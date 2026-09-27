"use strict";

// Dados de exemplo da Etapa 02. O status é escolhido manualmente no cadastro.
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
  if (!Object.hasOwn(statusNomes, campanha.status)) erros.status = "Selecione um status válido.";
  return erros;
}

let armazenamentoDisponivel = true;
function carregarCampanhas() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === null) return [...exemplos];
    const dados = JSON.parse(salvo);
    const campos = ["id", "nome", "anunciante", "descricao", "inicio", "fim", "estabelecimento", "status"];
    if (!Array.isArray(dados) || !dados.every(item =>
      item && campos.every(campo => typeof item[campo] === "string") &&
      item.id.length > 0 && Object.keys(validarCampanha(item)).length === 0
    ) || new Set(dados.map(item => item.id)).size !== dados.length) {
      throw new Error("Dados inválidos");
    }
    return dados;
  } catch {
    armazenamentoDisponivel = false;
    avisar("Não foi possível ler os dados salvos. Exibindo exemplos; novos cadastros estão bloqueados para preservar os dados existentes.");
    return [...exemplos];
  }
}

let campanhas = carregarCampanhas();

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
  adicionarTexto(card, "p", "Status: " + statusNomes[campanha.status]);
  adicionarTexto(card, "p", "Local: " + locais[campanha.estabelecimento]);
  if (comBotao) {
    const botao = adicionarTexto(card, "button", "Ver detalhes");
    botao.type = "button";
    botao.setAttribute("aria-label", "Ver detalhes: " + campanha.nome);
    botao.addEventListener("click", () => abrirDetalhes(campanha.id));
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
    (status === "" || campanha.status === status)
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
  adicionarTexto(conteudo, "p", "Status: " + statusNomes[campanha.status]);
  document.querySelector("#detalhes").showModal();
}

function cadastrar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  const campanha = {
    id: crypto.randomUUID(),
    nome: form.elements.nome.value.trim(),
    anunciante: form.elements.anunciante.value.trim(),
    descricao: form.elements.descricao.value.trim(),
    inicio: form.elements["data-inicio"].value,
    fim: form.elements["data-fim"].value,
    estabelecimento: form.elements.estabelecimento.value,
    status: form.elements.status.value
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
    mensagem.textContent = "Corrija os campos indicados para cadastrar.";
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
    const atualizadas = [...campanhas, campanha];
    localStorage.setItem(CHAVE, JSON.stringify(atualizadas));
    campanhas = atualizadas;
  } catch {
    mensagem.textContent = "Não foi possível salvar. Verifique o espaço e a permissão de armazenamento do navegador. Seus campos foram mantidos.";
    mensagem.focus();
    return;
  }
  form.reset();
  mensagem.className = "mensagem sucesso";
  mensagem.textContent = "Campanha cadastrada com sucesso! Acesse Consultar campanhas cadastradas para visualizá-la.";
  mensagem.focus();
}

function atualizarResumo() {
  document.querySelector("#total-ativas").textContent = campanhas.filter(item => item.status === "ativa").length + " campanha(s)";
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
