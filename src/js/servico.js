import { responder, CHAVE } from "./servico-simulado.js";

// Contrato assíncrono isolado da interface. O adaptador atual é um serviço simulado.
async function requisitar(metodo, corpo) {
  const requisicao = new Request(new URL("../api/campanhas", import.meta.url), {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    ...(corpo ? { body: JSON.stringify(corpo) } : {})
  });
  try {
    const resposta = await responder(requisicao);
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "O serviço não concluiu a operação.");
    return dados;
  } catch (erro) {
    if (erro instanceof TypeError) throw new Error("Não foi possível comunicar com o serviço. Confira a conexão e tente novamente.");
    throw erro;
  }
}

export function listarCampanhas() { return requisitar("GET"); }
export function salvarCampanha(campanha, editar, versao) {
  return requisitar(editar ? "PUT" : "POST", { campanha, versao });
}
export { CHAVE };
