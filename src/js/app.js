import { CHAVE, listarCampanhas, salvarCampanha } from "./servico.js";
import { dataValida, validarCampanha, hojeLocal, calcularStatus, normalizar, statusNomes } from "./dominio.js";
import { criarCard, adicionarTexto } from "./interface.js";

let campanhas = [];
let armazenamentoDisponivel = false;
let enviando = false;
let consultando = false;
let formularioPreparado = false;
const idEdicao = new URLSearchParams(location.search).get("editar");
let versaoEditada = null;
const avisar = texto => { document.querySelector("#aviso-dados").textContent = texto; };

function bloquearFormulario(bloquear) {
  document.querySelectorAll("#form-campanha input, #form-campanha textarea, #form-campanha select, #form-campanha button")
    .forEach(campo => { campo.disabled = bloquear; });
}

async function carregarPagina() {
  if (consultando || enviando) return;
  consultando = true;
  armazenamentoDisponivel = false;
  bloquearFormulario(true);
  const main = document.querySelector("main");
  const tentar = document.querySelector("#tentar-novamente");
  main.setAttribute("aria-busy", "true");
  tentar.hidden = true;
  avisar("Carregando campanhas...");
  document.querySelectorAll(".filtros input, .filtros select, .filtros button").forEach(el => { el.disabled = true; });
  try {
    campanhas = await listarCampanhas();
    armazenamentoDisponivel = true;
    avisar("Campanhas carregadas com sucesso.");
    bloquearFormulario(false);
    if (document.querySelector("#form-campanha") && !formularioPreparado) {
      prepararFormulario();
      formularioPreparado = true;
    }
    if (document.querySelector("#lista-campanhas")) atualizarLista();
    if (document.querySelector("#campanhas-recentes")) atualizarResumo();
    document.querySelectorAll(".filtros input, .filtros select, .filtros button").forEach(el => { el.disabled = false; });
  } catch (erro) {
    avisar(erro.message);
    tentar.hidden = false;
    document.querySelectorAll("#total-ativas, #total-anunciantes, #total-estabelecimentos").forEach(el => { el.textContent = "Indisponível"; });
    document.querySelector("#lista-campanhas")?.replaceChildren();
    document.querySelector("#campanhas-recentes")?.replaceChildren();
    const resultado = document.querySelector("#resultado");
    if (resultado) resultado.textContent = "Consulta não concluída. Tente novamente.";
  } finally {
    consultando = false;
    main.setAttribute("aria-busy", "false");
  }
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

async function cadastrar(evento) {
  if (enviando) { evento.preventDefault(); return; }
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
  enviando = true;
  bloquearFormulario(true);
  form.setAttribute("aria-busy", "true");
  mensagem.className = "mensagem carregando";
  mensagem.textContent = "Enviando campanha...";
  try {
    const salva = await salvarCampanha(campanha, idEdicao !== null, versaoEditada);
    campanhas = idEdicao !== null
      ? campanhas.map(item => item.id === salva.id ? salva : item)
      : [...campanhas, salva];
    if (idEdicao !== null) versaoEditada = JSON.stringify(salva);
  } catch (erro) {
    mensagem.className = "mensagem erro";
    mensagem.textContent = erro.message + " Seus campos foram mantidos. Tente salvar novamente.";
    mensagem.focus();
    return;
  } finally {
    enviando = false;
    bloquearFormulario(false);
    form.setAttribute("aria-busy", "false");
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
}



document.querySelector("#tentar-novamente").addEventListener("click", carregarPagina);
window.addEventListener("storage", evento => {
  if (evento.key !== CHAVE && evento.key !== null) return;
  document.querySelector("#detalhes")?.close();
  // Uma edição aberta mantém sua versão para detectar conflitos no envio.
  if (!document.querySelector("#form-campanha")) carregarPagina();
});
// Atualiza ao virar o dia e ao retomar uma aba que ficou suspensa.
let diaExibido = hojeLocal();
function conferirMudancaDeDia() {
  const hoje = hojeLocal();
  if (hoje === diaExibido || !armazenamentoDisponivel) return;
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

carregarPagina();
