import { validarCampanha } from "./dominio.js";

export const CHAVE = "indoorview-campanhas-v1";
const fonte = new URL("../dados/campanhas.json", import.meta.url);
const respostaJSON = (dados, status = 200) => new Response(JSON.stringify(dados), {
  status, headers: { "Content-Type": "application/json" }
});

function listaValida(dados) {
  const campos = ["id", "nome", "anunciante", "descricao", "inicio", "fim", "estabelecimento"];
  return Array.isArray(dados) && dados.every(item => item &&
    campos.every(campo => typeof item[campo] === "string") && item.id.length > 0 &&
    Object.keys(validarCampanha(item)).length === 0) &&
    new Set(dados.map(item => item.id)).size === dados.length;
}

async function lerDados() {
  let salvo;
  try { salvo = localStorage.getItem(CHAVE); }
  catch { throw new Error("Não foi possível acessar os dados do navegador."); }
  let dados;
  if (salvo !== null) {
    try { dados = JSON.parse(salvo); }
    catch { throw new Error("Os dados salvos estão inválidos. Nenhum cadastro foi sobrescrito."); }
  } else {
    // Consulta real via Fetch API ao JSON servido pelo GitHub Pages ou Live Server.
    const controle = new AbortController();
    const tempo = setTimeout(() => controle.abort(), 8000);
    try {
      const resposta = await fetch(fonte, { signal: controle.signal, cache: "no-store" });
      if (!resposta.ok) throw new Error("Falha ao consultar os dados iniciais (HTTP " + resposta.status + ").");
      dados = await resposta.json();
    } catch (erro) {
      if (erro.name === "AbortError") throw new Error("O serviço demorou demais para responder. Tente novamente.");
      if (erro instanceof SyntaxError) throw new Error("O serviço retornou dados ilegíveis.");
      throw erro;
    } finally { clearTimeout(tempo); }
  }
  if (!listaValida(dados)) throw new Error("Os dados recebidos são inválidos. Nenhum cadastro foi sobrescrito.");
  return dados;
}

// Simula latência, consulta e envio, sem inventar um servidor remoto de gravação.
// GET consulta; POST inclui; PUT edita. As respostas seguem status HTTP.
export async function responder(requisicao) {
  await new Promise(resolve => setTimeout(resolve, 600));
  const metodo = requisicao.method;
  const falha = new URLSearchParams(location.search).get("falha");
  if ((metodo === "GET" && falha === "consulta") || (metodo !== "GET" && falha === "envio")) {
    return respostaJSON({ erro: "Serviço temporariamente indisponível (falha simulada)." }, 503);
  }
  if (!["GET", "POST", "PUT"].includes(metodo)) return respostaJSON({ erro: "Operação não permitida." }, 405);
  try {
    // Carrega os exemplos antes da transação; dentro da gravação relê a versão atual.
    const iniciais = await lerDados();
    if (metodo === "GET") return respostaJSON(iniciais);
    const { campanha, versao } = await requisicao.json();
    if (!listaValida([campanha])) return respostaJSON({ erro: "Campanha inválida. Confira os campos." }, 422);
    const gravar = () => {
      const salvo = localStorage.getItem(CHAVE);
      const atuais = salvo === null ? iniciais : JSON.parse(salvo);
      if (!listaValida(atuais)) throw new Error("Os dados salvos são inválidos. Gravação cancelada.");
      const existente = atuais.find(item => item.id === campanha.id);
      if (metodo === "PUT" && (!existente || JSON.stringify(existente) !== versao)) {
        return respostaJSON({ erro: "Esta campanha foi alterada ou não existe mais. Volte à listagem e reabra a edição." }, 409);
      }
      if (metodo === "POST" && existente) return respostaJSON({ erro: "Esta campanha já está cadastrada." }, 409);
      const atualizadas = metodo === "PUT"
        ? atuais.map(item => item.id === campanha.id ? campanha : item)
        : [...atuais, campanha];
      localStorage.setItem(CHAVE, JSON.stringify(atualizadas));
      return respostaJSON(campanha, metodo === "POST" ? 201 : 200);
    };
    // Serializa gravações entre abas quando o navegador oferece Web Locks.
    return navigator.locks ? await navigator.locks.request(CHAVE, gravar) : gravar();
  } catch (erro) {
    if (erro instanceof TypeError) throw erro;
    const mensagem = erro.name === "QuotaExceededError" || erro.name === "SecurityError"
      ? "Não foi possível salvar. Confira o espaço e a permissão de armazenamento."
      : erro.message;
    return respostaJSON({ erro: mensagem }, 500);
  }
}
