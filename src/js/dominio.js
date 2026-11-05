const locais = { academia: "Academia Power Fit", mercado: "Mercado Central", shopping: "Shopping Centro" };
const statusNomes = { ativa: "Ativa", futura: "Futura", encerrada: "Encerrada" };
function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith("0000")) return false;
  const data = new Date(valor + "T00:00:00Z");
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

// Retorna erros por campo; a mesma regra valida o cadastro e os dados salvos.
function validarCampanha(campanha) {
  const erros = {};
  if (!campanha.nome || campanha.nome.length < 3 || campanha.nome.length > 80) erros.nome = "Informe um nome entre 3 e 80 caracteres.";
  if (!campanha.anunciante || campanha.anunciante.length < 3 || campanha.anunciante.length > 80) erros.anunciante = "Informe um anunciante entre 3 e 80 caracteres.";
  if (campanha.descricao.length > 500) erros.descricao = "Use no máximo 500 caracteres.";
  if (!dataValida(campanha.inicio)) erros["data-inicio"] = "Informe uma data de início válida.";
  if (!dataValida(campanha.fim)) erros["data-fim"] = "Informe uma data de término válida.";
  if (dataValida(campanha.inicio) && dataValida(campanha.fim) && campanha.fim < campanha.inicio) erros["data-fim"] = "O término não pode ser anterior ao início.";
  if (!Object.hasOwn(locais, campanha.estabelecimento)) erros.estabelecimento = "Selecione um estabelecimento válido.";
  return erros;
}

function hojeLocal() {
  const agora = new Date();
  return [agora.getFullYear(), String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0")].join("-");
}

function calcularStatus(campanha, hoje = hojeLocal()) {
  if (hoje < campanha.inicio) return "futura";
  if (hoje > campanha.fim) return "encerrada";
  return "ativa"; // Inclui o dia inicial e todo o dia final, no fuso do dispositivo.
}

function formatarData(data) {
  return data.split("-").reverse().join("/");
}

function normalizar(texto) {
  return texto.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


export { locais, statusNomes, dataValida, validarCampanha, hojeLocal, calcularStatus, formatarData, normalizar };
