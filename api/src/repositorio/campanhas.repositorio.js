import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ErroApi } from "../erros.js";
import { validarCampanha, CAMPOS_EDITAVEIS } from "../dominio/campanha.js";

const pastaDados = resolve(dirname(fileURLToPath(import.meta.url)), "../../dados");
export const ARQUIVO_PADRAO = resolve(pastaDados, "campanhas.json");
const ARQUIVO_INICIAL = resolve(pastaDados, "campanhas-iniciais.json");

/**
 * Repositório das campanhas com persistência em arquivo JSON.
 * Somente este módulo conhece o formato de armazenamento: trocar o arquivo por
 * SQLite em uma etapa futura não exige alterar rotas nem controladores.
 */
export function criarRepositorio(arquivo = ARQUIVO_PADRAO) {
  let campanhas = null;
  let fila = Promise.resolve();

  async function carregar() {
    if (campanhas) return campanhas;
    let texto;
    try {
      texto = await readFile(arquivo, "utf8");
    } catch (erro) {
      if (erro.code !== "ENOENT") throw new ErroApi(500, "ERRO_ARMAZENAMENTO", "Não foi possível ler os dados armazenados.");
      // Primeira execução: cria o arquivo de dados a partir das campanhas de exemplo.
      texto = await readFile(ARQUIVO_INICIAL, "utf8");
      await gravarArquivo(JSON.parse(texto));
    }
    let dados;
    try { dados = JSON.parse(texto); } catch { dados = null; }
    const valido = Array.isArray(dados) &&
      dados.every(item => item && typeof item.id === "string" && item.id !== "" &&
        CAMPOS_EDITAVEIS.every(campo => typeof item[campo] === "string") &&
        validarCampanha(item).length === 0) &&
      new Set(dados.map(item => item.id)).size === dados.length;
    if (!valido) {
      // Não sobrescreve: o arquivo pode ser corrigido manualmente.
      throw new ErroApi(500, "DADOS_INVALIDOS", "Os dados armazenados estão inválidos. Nenhuma informação foi sobrescrita.");
    }
    campanhas = dados;
    return campanhas;
  }

  async function gravarArquivo(lista) {
    // Grava em arquivo temporário e renomeia, para não deixar o JSON pela metade.
    await mkdir(dirname(arquivo), { recursive: true });
    const temporario = arquivo + ".tmp";
    await writeFile(temporario, JSON.stringify(lista, null, 2) + "\n", "utf8");
    await rename(temporario, arquivo);
  }

  // Executa uma alteração por vez, evitando que duas requisições gravem ao mesmo tempo.
  function emSequencia(operacao) {
    const resultado = fila.then(async () => {
      const atuais = await carregar();
      const { lista, retorno } = operacao(atuais);
      if (lista !== atuais) {
        try { await gravarArquivo(lista); }
        catch { throw new ErroApi(500, "ERRO_ARMAZENAMENTO", "Não foi possível salvar os dados."); }
        campanhas = lista;
      }
      return retorno;
    });
    fila = resultado.catch(() => {});
    return resultado;
  }

  return {
    async listar() {
      return [...await carregar()];
    },

    async buscar(id) {
      return (await carregar()).find(item => item.id === id) ?? null;
    },

    criar(dados) {
      return emSequencia(atuais => {
        const agora = new Date().toISOString();
        const nova = { id: randomUUID(), ...dados, criadoEm: agora, atualizadoEm: agora };
        return { lista: [...atuais, nova], retorno: nova };
      });
    },

    // Substitui os campos editáveis; retorna null se o id não existir.
    atualizar(id, dados) {
      return emSequencia(atuais => {
        const existente = atuais.find(item => item.id === id);
        if (!existente) return { lista: atuais, retorno: null };
        const atualizada = { ...existente, ...dados, id, atualizadoEm: new Date().toISOString() };
        return { lista: atuais.map(item => item.id === id ? atualizada : item), retorno: atualizada };
      });
    },

    // Retorna true se excluiu, false se o id não existir.
    excluir(id) {
      return emSequencia(atuais => {
        if (!atuais.some(item => item.id === id)) return { lista: atuais, retorno: false };
        return { lista: atuais.filter(item => item.id !== id), retorno: true };
      });
    }
  };
}
