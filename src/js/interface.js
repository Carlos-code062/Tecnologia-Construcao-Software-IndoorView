import { locais, statusNomes, calcularStatus, formatarData } from "./dominio.js";

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
    botao.addEventListener("click", () => abrirDetalhes(campanha));
    const editar = adicionarTexto(card, "a", "Editar campanha");
    editar.className = "editar-campanha";
    editar.href = "cadastro-campanha.html?editar=" + encodeURIComponent(campanha.id);
    editar.setAttribute("aria-label", "Editar: " + campanha.nome);
  }
  return card;
}

function abrirDetalhes(campanha) {
  const id = campanha.id;
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


export { adicionarTexto, criarCard };
