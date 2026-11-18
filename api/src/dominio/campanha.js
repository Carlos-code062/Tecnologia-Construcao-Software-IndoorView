// Regras de negócio da campanha no servidor.
// São as mesmas regras do front-end (src/js/dominio.js), agora aplicadas também na API,
// porque o servidor não pode confiar apenas na validação feita no navegador.

export const ESTABELECIMENTOS = {
  academia: "Academia Power Fit",
  mercado: "Mercado Central",
  shopping: "Shopping Centro"
};

export const STATUS = ["ativa", "futura", "encerrada"];

export const CAMPOS_EDITAVEIS = ["nome", "anunciante", "descricao", "inicio", "fim", "estabelecimento"];

// Campos calculados pelo servidor: se o cliente enviar, são ignorados.
const CAMPOS_SOMENTE_LEITURA = ["status", "estabelecimentoNome", "criadoEm", "atualizadoEm"];

export function dataValida(valor) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith("0000")) return false;
  const data = new Date(valor + "T00:00:00Z");
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function hojeLocal(agora = new Date()) {
  return [agora.getFullYear(), String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0")].join("-");
}

// Futura antes do início; Ativa do início até o fim do último dia; Encerrada depois.
export function calcularStatus(campanha, hoje = hojeLocal()) {
  if (hoje < campanha.inicio) return "futura";
  if (hoje > campanha.fim) return "encerrada";
  return "ativa";
}

export function normalizarTexto(texto) {
  return String(texto).trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function ehObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

/**
 * Lê o corpo enviado pelo cliente.
 * Retorna { valores, detalhes }: valores contém apenas os campos editáveis enviados,
 * já com espaços removidos; detalhes contém os erros encontrados por campo.
 * idDaRota: na alteração, o "id" do corpo só é aceito se for igual ao da URL.
 */
export function lerEntrada(corpo, idDaRota = null) {
  if (!ehObjeto(corpo)) {
    return { valores: {}, detalhes: [{ campo: "corpo", mensagem: "O corpo da requisição deve ser um objeto JSON." }] };
  }
  const valores = {};
  const detalhes = [];
  for (const [campo, valor] of Object.entries(corpo)) {
    if (campo === "id") {
      if (idDaRota === null) detalhes.push({ campo, mensagem: "O id é gerado pelo servidor e não deve ser enviado." });
      else if (valor !== idDaRota) detalhes.push({ campo, mensagem: "O id do corpo é diferente do id da URL." });
      continue;
    }
    if (CAMPOS_SOMENTE_LEITURA.includes(campo)) continue;
    if (!CAMPOS_EDITAVEIS.includes(campo)) {
      detalhes.push({ campo, mensagem: "Campo não permitido." });
      continue;
    }
    if (typeof valor !== "string") {
      detalhes.push({ campo, mensagem: "O valor deve ser um texto." });
      continue;
    }
    valores[campo] = valor.trim();
  }
  return { valores, detalhes };
}

// Valida a campanha completa (após juntar os dados enviados com os existentes, no PATCH).
export function validarCampanha(campanha) {
  const detalhes = [];
  const texto = (campo, rotulo) => {
    const valor = campanha[campo];
    if (valor === undefined || valor === "") detalhes.push({ campo, mensagem: rotulo + " é obrigatório." });
    else if (valor.length < 3 || valor.length > 80) detalhes.push({ campo, mensagem: rotulo + " deve ter entre 3 e 80 caracteres." });
  };
  texto("nome", "O nome");
  texto("anunciante", "O anunciante");
  if (campanha.descricao !== undefined && campanha.descricao.length > 500) {
    detalhes.push({ campo: "descricao", mensagem: "A descrição deve ter no máximo 500 caracteres." });
  }
  const inicioOk = dataValida(campanha.inicio);
  const fimOk = dataValida(campanha.fim);
  if (campanha.inicio === undefined || campanha.inicio === "") detalhes.push({ campo: "inicio", mensagem: "A data de início é obrigatória." });
  else if (!inicioOk) detalhes.push({ campo: "inicio", mensagem: "Informe uma data real no formato AAAA-MM-DD." });
  if (campanha.fim === undefined || campanha.fim === "") detalhes.push({ campo: "fim", mensagem: "A data de término é obrigatória." });
  else if (!fimOk) detalhes.push({ campo: "fim", mensagem: "Informe uma data real no formato AAAA-MM-DD." });
  if (inicioOk && fimOk && campanha.fim < campanha.inicio) {
    detalhes.push({ campo: "fim", mensagem: "O término não pode ser anterior ao início." });
  }
  if (campanha.estabelecimento === undefined || campanha.estabelecimento === "") {
    detalhes.push({ campo: "estabelecimento", mensagem: "O estabelecimento é obrigatório." });
  } else if (!Object.hasOwn(ESTABELECIMENTOS, campanha.estabelecimento)) {
    detalhes.push({ campo: "estabelecimento", mensagem: "Use um destes valores: " + Object.keys(ESTABELECIMENTOS).join(", ") + "." });
  }
  return detalhes;
}

// Representação enviada ao cliente: dados gravados + campos calculados.
export function apresentar(campanha) {
  return {
    ...campanha,
    estabelecimentoNome: ESTABELECIMENTOS[campanha.estabelecimento],
    status: calcularStatus(campanha)
  };
}
