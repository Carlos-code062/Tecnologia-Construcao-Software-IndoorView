"use strict";

// Os status antigos são ignorados: as datas determinam o status atual.
const CHAVE = "indoorview-campanhas-v1";
const locais = { academia: "Academia Power Fit", mercado: "Mercado Central", shopping: "Shopping Centro" };
const statusNomes = { ativa: "Ativa", futura: "Futura", encerrada: "Encerrada" };
const exemplos = [
  { id: "1", nome: "Campanha Academia Fit", anunciante: "Academia Fit", descricao: "Divulgação dos planos da academia.", inicio: "2026-08-25", fim: "2026-09-25", estabelecimento: "academia", status: "ativa" },
  { id: "2", nome: "Campanha Restaurante Sabor", anunciante: "Restaurante Sabor", descricao: "Divulgação do cardápio do restaurante.", inicio: "2026-09-01", fim: "2026-09-30", estabelecimento: "mercado", status: "futura" },
  { id: "3", nome: "Campanha Loja Tech", anunciante: "Loja Tech", descricao: "Ofertas de produtos de tecnologia.", inicio: "2026-08-01", fim: "2026-08-20", estabelecimento: "shopping", status: "encerrada" }
];

function avisar(texto) {
  document.querySelector("#aviso-dados").textContent = texto;
}

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

let armazenamentoDisponivel = true;
function carregarCampanhas() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === null) return [...exemplos];
    const dados = JSON.parse(salvo);
    const campos = ["id", "nome", "anunciante", "descricao", "inicio", "fim", "estabelecimento"];
    if (!Array.isArray(dados) || !dados.every(item =>
      item && campos.every(campo => typeof item[campo] === "string") &&
      item.id.length > 0 && Object.keys(validarCampanha(item)).length === 0
    ) || new Set(dados.map(item => item.id)).size !== dados.length) {
      throw new Error("Dados inválidos");
    }
    return dados;
  } catch {
    armazenamentoDisponivel = false;
    avisar("Não foi possível ler os dados salvos. Exibindo exemplos; cadastros e edições estão bloqueados para preservar os dados existentes.");
    return [...exemplos];
  }
}

let campanhas = carregarCampanhas();
const idEdicao = new URLSearchParams(location.search).get("editar");
let versaoEditada = null;

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

function atualizarPreviaStatus() {
  const inicio = document.querySelector("#data-inicio").value;
  const fim = document.querySelector("#data-fim").value;
  document.querySelector("#status-calculado").textContent =
    dataValida(inicio) && dataValida(fim) && fim >= inicio
      ? statusNomes[calcularStatus({ inicio, fim })]
      : "Informe um período válido.";
}

function prepararFormulario() {
  const form = document.querySelector("#form-campanha");
  if (idEdicao !== null) {
    document.querySelector(".form-section h2").textContent = "Editar campanha";
    document.title = "IndoorView - Editar campanha";
    form.querySelector("button[type=submit]").textContent = "Salvar alterações";
    const existente = campanhas.find(item => item.id === idEdicao);
    if (!existente || !armazenamentoDisponivel) {
      avisar("Não foi possível abrir esta campanha para edição. Volte à listagem e tente novamente.");
      form.querySelectorAll("input, textarea, select, button").forEach(campo => { campo.disabled = true; });
      return;
    }
    versaoEditada = JSON.stringify(existente);
    ["nome", "anunciante", "descricao", "estabelecimento"].forEach(campo => {
      form.elements[campo].value = existente[campo];
    });
    form.elements["data-inicio"].value = existente.inicio;
    form.elements["data-fim"].value = existente.fim;
  }
  atualizarPreviaStatus();
  form.elements["data-inicio"].addEventListener("input", atualizarPreviaStatus);
  form.elements["data-fim"].addEventListener("input", atualizarPreviaStatus);
}

function formatarData(data) {
  return data.split("-").reverse().join("/");
}

// textContent apresenta dados como texto, sem interpretar HTML digitado.
function adicionarTexto(pai, tag, texto) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  pai.append(elemento);
  return elemento;
}

function criarCard(campanha, comBotao) {
  const card = document.createElement("article");
  adicionarTexto(card, "h3", campanha.nome);
  adicionarTexto(card, "p", "Anunciante: " + campanha.anunciante);
  adicionarTexto(card, "p", "Período: " + formatarData(campanha.inicio) + " até " + formatarData(campanha.fim));
  adicionarTexto(card, "p", "Status: " + statusNomes[calcularStatus(campanha)]);
  adicionarTexto(card, "p", "Local: " + locais[campanha.estabelecimento]);
  if (comBotao) {
    const botao = adicionarTexto(card, "button", "Ver detalhes");
    botao.type = "button";
    botao.setAttribute("aria-label", "Ver detalhes: " + campanha.nome);
    botao.addEventListener("click", () => abrirDetalhes(campanha.id));
    const editar = adicionarTexto(card, "a", "Editar campanha");
    editar.className = "editar-campanha";
    editar.href = "cadastro-campanha.html?editar=" + encodeURIComponent(campanha.id);
    editar.setAttribute("aria-label", "Editar: " + campanha.nome);
  }
  return card;
}

function normalizar(texto) {
  return texto.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function atualizarLista() {
  const busca = normalizar(document.querySelector("#pesquisa").value);
  const status = document.querySelector("#filtro-status").value;
  const filtradas = campanhas.filter(campanha =>
    normalizar(campanha.nome + " " + campanha.anunciante).includes(busca) &&
    (status === "" || calcularStatus(campanha) === status)
  );
  const lista = document.querySelector("#lista-campanhas");
  lista.replaceChildren();
  filtradas.forEach(campanha => lista.append(criarCard(campanha, true)));
  document.querySelector("#resultado").textContent = filtradas.length
    ? filtradas.length + " campanha(s) encontrada(s)."
    : "Nenhuma campanha encontrada. Ajuste a pesquisa ou limpe os filtros.";
}

function abrirDetalhes(id) {
  const campanha = campanhas.find(item => item.id === id);
  if (!campanha) {
    document.querySelector("#resultado").textContent = "Campanha não encontrada. Atualize a listagem.";
    return;
  }
  const conteudo = document.querySelector("#conteudo-detalhes");
  conteudo.replaceChildren();
  adicionarTexto(conteudo, "h3", campanha.nome);
  adicionarTexto(conteudo, "p", "Anunciante: " + campanha.anunciante);
  adicionarTexto(conteudo, "p", "Descrição: " + (campanha.descricao || "Não informada."));
  adicionarTexto(conteudo, "p", "Período: " + formatarData(campanha.inicio) + " até " + formatarData(campanha.fim));
  adicionarTexto(conteudo, "p", "Local: " + locais[campanha.estabelecimento]);
  adicionarTexto(conteudo, "p", "Status: " + statusNomes[calcularStatus(campanha)]).id = "status-detalhes";
  document.querySelector("#detalhes").dataset.campanhaId = id;
  document.querySelector("#detalhes").showModal();
}

function cadastrar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  const campanha = {
    id: idEdicao ?? crypto.randomUUID(),
    nome: form.elements.nome.value.trim(),
    anunciante: form.elements.anunciante.value.trim(),
    descricao: form.elements.descricao.value.trim(),
    inicio: form.elements["data-inicio"].value,
    fim: form.elements["data-fim"].value,
    estabelecimento: form.elements.estabelecimento.value
  };
  const erros = validarCampanha(campanha);
  const mensagem = document.querySelector("#mensagem");
  form.querySelectorAll("input, textarea, select").forEach(campo => {
    const erro = erros[campo.id] || "";
    campo.setAttribute("aria-invalid", String(Boolean(erro)));
    document.querySelector("#erro-" + campo.id).textContent = erro;
  });
  mensagem.className = "mensagem erro";
  if (Object.keys(erros).length) {
    mensagem.textContent = "Corrija os campos indicados para salvar.";
    document.getElementById(Object.keys(erros)[0]).focus();
    return;
  }
  if (!armazenamentoDisponivel) {
    mensagem.textContent = "Cadastro indisponível: os dados salvos não puderam ser lidos.";
    mensagem.focus();
    return;
  }
  // Releitura evita perder cadastros feitos em outra aba desde a abertura.
  campanhas = carregarCampanhas();
  if (!armazenamentoDisponivel) {
    mensagem.textContent = "Cadastro indisponível: confira o aviso sobre os dados salvos.";
    mensagem.focus();
    return;
  }
  try {
    const existente = campanhas.find(item => item.id === idEdicao);
    if (idEdicao !== null && (!existente || JSON.stringify(existente) !== versaoEditada)) {
      mensagem.textContent = "Esta campanha foi alterada ou não existe mais. Volte à listagem e reabra a edição para conferir os dados atuais.";
      mensagem.focus();
      return;
    }
    const atualizadas = idEdicao !== null
      ? campanhas.map(item => item.id === idEdicao ? campanha : item)
      : [...campanhas, campanha];
    localStorage.setItem(CHAVE, JSON.stringify(atualizadas));
    campanhas = atualizadas;
    if (idEdicao !== null) versaoEditada = JSON.stringify(campanha);
  } catch {
    mensagem.textContent = "Não foi possível salvar. Verifique o espaço e a permissão de armazenamento do navegador. Seus campos foram mantidos.";
    mensagem.focus();
    return;
  }
  if (idEdicao === null) form.reset();
  atualizarPreviaStatus();
  mensagem.className = "mensagem sucesso";
  mensagem.textContent = idEdicao !== null
    ? "Campanha atualizada com sucesso! O status foi recalculado pelas datas."
    : "Campanha cadastrada com sucesso! Acesse Consultar campanhas cadastradas para visualizá-la.";
  mensagem.focus();
}

function atualizarResumo() {
  document.querySelector("#total-ativas").textContent = campanhas.filter(item => calcularStatus(item) === "ativa").length + " campanha(s)";
  document.querySelector("#total-anunciantes").textContent = new Set(campanhas.map(item => normalizar(item.anunciante))).size + " anunciante(s)";
  document.querySelector("#total-estabelecimentos").textContent = new Set(campanhas.map(item => item.estabelecimento)).size + " estabelecimento(s)";
  const recentes = document.querySelector("#campanhas-recentes");
  recentes.replaceChildren();
  campanhas.slice(-2).reverse().forEach(item => recentes.append(criarCard(item, false)));
  if (!campanhas.length) adicionarTexto(recentes, "p", "Nenhuma campanha cadastrada.");
}

// Cada página ativa apenas os eventos dos elementos que possui.
if (document.querySelector("#form-campanha")) {
  prepararFormulario();
  document.querySelector("#form-campanha").addEventListener("submit", cadastrar);
}
if (document.querySelector("#lista-campanhas")) {
  document.querySelector("#pesquisa").addEventListener("input", atualizarLista);
  document.querySelector("#filtro-status").addEventListener("change", atualizarLista);
  document.querySelector("#limpar-filtros").addEventListener("click", () => {
    document.querySelector("#pesquisa").value = "";
    document.querySelector("#filtro-status").value = "";
    atualizarLista();
  });
  const dialogo = document.querySelector("#detalhes");
  document.querySelector("#fechar-detalhes").addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("click", evento => {
    const area = dialogo.getBoundingClientRect();
    if (evento.target === dialogo && (evento.clientX < area.left || evento.clientX > area.right ||
      evento.clientY < area.top || evento.clientY > area.bottom)) dialogo.close();
  });
  // O elemento dialog já permite fechar com Esc e retornar o foco ao botão.
  atualizarLista();
}
if (document.querySelector("#campanhas-recentes")) atualizarResumo();

window.addEventListener("storage", evento => {
  if (evento.key !== CHAVE && evento.key !== null) return;
  armazenamentoDisponivel = true;
  avisar("");
  campanhas = carregarCampanhas();
  if (document.querySelector("#lista-campanhas")) atualizarLista();
  if (document.querySelector("#campanhas-recentes")) atualizarResumo();
  document.querySelector("#detalhes")?.close();
});

// Atualiza ao virar o dia e ao retomar uma aba que ficou suspensa.
let diaExibido = hojeLocal();
function conferirMudancaDeDia() {
  const hoje = hojeLocal();
  if (hoje === diaExibido) return;
  diaExibido = hoje;
  if (document.querySelector("#lista-campanhas")) atualizarLista();
  if (document.querySelector("#campanhas-recentes")) atualizarResumo();
  if (document.querySelector("#form-campanha")) atualizarPreviaStatus();
  const modal = document.querySelector("#detalhes");
  if (modal?.open) {
    const campanha = campanhas.find(item => item.id === modal.dataset.campanhaId);
    if (campanha) document.querySelector("#status-detalhes").textContent = "Status: " + statusNomes[calcularStatus(campanha)];
  }
}
function agendarViradaDoDia() {
  const agora = new Date();
  const proximoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  setTimeout(() => {
    conferirMudancaDeDia();
    agendarViradaDoDia();
  }, proximoDia - agora + 100);
}
agendarViradaDoDia();
window.addEventListener("focus", conferirMudancaDeDia);
document.addEventListener("visibilitychange", conferirMudancaDeDia);
