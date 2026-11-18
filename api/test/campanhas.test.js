// Testes automatizados da API. Execute com: npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarApp } from "../src/app.js";
import { criarRepositorio } from "../src/repositorio/campanhas.repositorio.js";

let servidor;
let base;
let pasta;
let arquivo;

// Datas distantes deixam o status previsível em qualquer dia.
const valida = {
  nome: "Campanha Verão",
  anunciante: "Sorveteria Gelato",
  descricao: "Promoção de sorvetes.",
  inicio: "2020-01-01",
  fim: "2099-12-31",
  estabelecimento: "shopping"
};

function iniciar(app) {
  return new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });
}

async function chamar(metodo, caminho, corpo, cabecalhos = {}) {
  const opcoes = { method: metodo, headers: { ...cabecalhos } };
  if (corpo !== undefined) {
    opcoes.body = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
    if (!opcoes.headers["Content-Type"]) opcoes.headers["Content-Type"] = "application/json";
  }
  const resposta = await fetch(base + caminho, opcoes);
  const texto = await resposta.text();
  return { status: resposta.status, headers: resposta.headers, corpo: texto ? JSON.parse(texto) : null };
}

before(async () => {
  pasta = await mkdtemp(join(tmpdir(), "indoorview-api-"));
  arquivo = join(pasta, "campanhas.json");
  servidor = await iniciar(criarApp(criarRepositorio(arquivo)));
  base = "http://127.0.0.1:" + servidor.address().port;
});

after(async () => {
  await new Promise(resolve => servidor.close(resolve));
  await rm(pasta, { recursive: true, force: true });
});

test("GET /api/campanhas lista as campanhas iniciais", async () => {
  const r = await chamar("GET", "/api/campanhas");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /application\/json/);
  assert.equal(r.corpo.length, 3);
  assert.ok(r.corpo.every(item => ["ativa", "futura", "encerrada"].includes(item.status)));
  assert.equal(r.corpo[0].estabelecimentoNome, "Academia Power Fit");
});

test("GET /api/campanhas/:id retorna uma campanha ou 404", async () => {
  const r = await chamar("GET", "/api/campanhas/1");
  assert.equal(r.status, 200);
  assert.equal(r.corpo.nome, "Campanha Academia Fit");

  const inexistente = await chamar("GET", "/api/campanhas/nao-existe");
  assert.equal(inexistente.status, 404);
  assert.equal(inexistente.corpo.erro.codigo, "NAO_ENCONTRADA");
});

test("POST cria campanha com 201, Location e status calculado", async () => {
  const r = await chamar("POST", "/api/campanhas", { ...valida, nome: "  Campanha Verão  " });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.nome, "Campanha Verão");
  assert.equal(r.corpo.status, "ativa");
  assert.ok(r.corpo.id);
  assert.equal(r.headers.get("location"), "/api/campanhas/" + r.corpo.id);

  const consulta = await chamar("GET", r.headers.get("location"));
  assert.equal(consulta.status, 200);
  assert.equal(consulta.corpo.id, r.corpo.id);

  // Os dados ficam gravados no arquivo.
  const gravado = JSON.parse(await readFile(arquivo, "utf8"));
  assert.ok(gravado.some(item => item.id === r.corpo.id));
  assert.ok(gravado.every(item => item.status === undefined));
});

test("POST valida campos e retorna 422 com detalhes", async () => {
  const r = await chamar("POST", "/api/campanhas", {
    nome: "ab", anunciante: "", inicio: "2026-02-30", fim: "2026-01-01", estabelecimento: "praia"
  });
  assert.equal(r.status, 422);
  assert.equal(r.corpo.erro.codigo, "VALIDACAO");
  const campos = r.corpo.erro.detalhes.map(item => item.campo);
  assert.deepEqual(campos, ["nome", "anunciante", "inicio", "estabelecimento"]);

  const periodo = await chamar("POST", "/api/campanhas", { ...valida, inicio: "2026-10-10", fim: "2026-10-01" });
  assert.equal(periodo.status, 422);
  assert.deepEqual(periodo.corpo.erro.detalhes, [{ campo: "fim", mensagem: "O término não pode ser anterior ao início." }]);

  const tipo = await chamar("POST", "/api/campanhas", { ...valida, nome: 123 });
  assert.equal(tipo.status, 422);
  assert.equal(tipo.corpo.erro.detalhes[0].campo, "nome");

  const extra = await chamar("POST", "/api/campanhas", { ...valida, preco: "10" });
  assert.equal(extra.status, 422);
  assert.equal(extra.corpo.erro.detalhes[0].campo, "preco");

  const comId = await chamar("POST", "/api/campanhas", { ...valida, id: "99" });
  assert.equal(comId.status, 422);
  assert.equal(comId.corpo.erro.detalhes[0].campo, "id");

  const longa = await chamar("POST", "/api/campanhas", { ...valida, descricao: "x".repeat(501) });
  assert.equal(longa.status, 422);
  assert.equal(longa.corpo.erro.detalhes[0].campo, "descricao");
});

test("POST trata JSON inválido, corpo ausente, tipo errado e corpo grande", async () => {
  const quebrado = await chamar("POST", "/api/campanhas", "{ nome: ");
  assert.equal(quebrado.status, 400);
  assert.equal(quebrado.corpo.erro.codigo, "JSON_INVALIDO");

  const lista = await chamar("POST", "/api/campanhas", []);
  assert.equal(lista.status, 400);
  assert.equal(lista.corpo.erro.codigo, "CORPO_INVALIDO");

  const vazio = await chamar("POST", "/api/campanhas");
  assert.equal(vazio.status, 400);
  assert.equal(vazio.corpo.erro.codigo, "CORPO_AUSENTE");

  const texto = await chamar("POST", "/api/campanhas", "nome=teste", { "Content-Type": "text/plain" });
  assert.equal(texto.status, 415);
  assert.equal(texto.corpo.erro.codigo, "TIPO_NAO_SUPORTADO");

  const grande = await chamar("POST", "/api/campanhas", { ...valida, descricao: "x".repeat(20000) });
  assert.equal(grande.status, 413);
  assert.equal(grande.corpo.erro.codigo, "CORPO_MUITO_GRANDE");
});

test("PUT substitui a campanha e valida a entrada", async () => {
  const criada = (await chamar("POST", "/api/campanhas", valida)).corpo;
  const r = await chamar("PUT", "/api/campanhas/" + criada.id, {
    ...valida, id: criada.id, status: "ignorado", nome: "Campanha Inverno", descricao: undefined,
    inicio: "2098-01-01", fim: "2098-02-01"
  });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.nome, "Campanha Inverno");
  assert.equal(r.corpo.descricao, "");
  assert.equal(r.corpo.status, "futura");
  assert.equal(r.corpo.criadoEm, criada.criadoEm);

  const incompleto = await chamar("PUT", "/api/campanhas/" + criada.id, { nome: "Só o nome" });
  assert.equal(incompleto.status, 422);

  const idDiferente = await chamar("PUT", "/api/campanhas/" + criada.id, { ...valida, id: "outro" });
  assert.equal(idDiferente.status, 422);
  assert.equal(idDiferente.corpo.erro.detalhes[0].campo, "id");

  const inexistente = await chamar("PUT", "/api/campanhas/nao-existe", valida);
  assert.equal(inexistente.status, 404);
});

test("PATCH altera somente os campos enviados", async () => {
  const criada = (await chamar("POST", "/api/campanhas", valida)).corpo;
  const r = await chamar("PATCH", "/api/campanhas/" + criada.id, { inicio: "2010-01-01", fim: "2010-01-31" });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.nome, valida.nome);
  assert.equal(r.corpo.status, "encerrada");

  // A regra de período considera os dados já gravados.
  const periodo = await chamar("PATCH", "/api/campanhas/" + criada.id, { fim: "2009-12-31" });
  assert.equal(periodo.status, 422);
  assert.equal(periodo.corpo.erro.detalhes[0].campo, "fim");

  const vazio = await chamar("PATCH", "/api/campanhas/" + criada.id, {});
  assert.equal(vazio.status, 422);

  const inexistente = await chamar("PATCH", "/api/campanhas/nao-existe", { nome: "Teste" });
  assert.equal(inexistente.status, 404);
});

test("DELETE exclui com 204 e depois retorna 404", async () => {
  const criada = (await chamar("POST", "/api/campanhas", valida)).corpo;
  const r = await chamar("DELETE", "/api/campanhas/" + criada.id);
  assert.equal(r.status, 204);
  assert.equal(r.corpo, null);

  assert.equal((await chamar("GET", "/api/campanhas/" + criada.id)).status, 404);
  assert.equal((await chamar("DELETE", "/api/campanhas/" + criada.id)).status, 404);
});

test("GET filtra por status e busca, e valida os parâmetros", async () => {
  await chamar("POST", "/api/campanhas", { ...valida, nome: "Campanha Pão de Açúcar", inicio: "2097-01-01", fim: "2097-01-02" });

  const busca = await chamar("GET", "/api/campanhas?busca=" + encodeURIComponent("pao de acucar"));
  assert.equal(busca.status, 200);
  assert.equal(busca.corpo.length, 1);

  const futuras = await chamar("GET", "/api/campanhas?status=futura");
  assert.equal(futuras.status, 200);
  assert.ok(futuras.corpo.length >= 1);
  assert.ok(futuras.corpo.every(item => item.status === "futura"));

  const invalido = await chamar("GET", "/api/campanhas?status=pausada");
  assert.equal(invalido.status, 400);
  assert.equal(invalido.corpo.erro.codigo, "PARAMETRO_INVALIDO");

  const repetido = await chamar("GET", "/api/campanhas?status=ativa&status=futura");
  assert.equal(repetido.status, 400);
});

test("métodos e rotas inexistentes retornam erro no mesmo formato", async () => {
  const metodo = await chamar("DELETE", "/api/campanhas");
  assert.equal(metodo.status, 405);
  assert.equal(metodo.headers.get("allow"), "GET, HEAD, POST, OPTIONS");
  assert.equal(metodo.corpo.erro.codigo, "METODO_NAO_PERMITIDO");

  const rota = await chamar("GET", "/api/anunciantes");
  assert.equal(rota.status, 404);
  assert.equal(rota.corpo.erro.codigo, "ROTA_NAO_ENCONTRADA");
  assert.ok(Array.isArray(rota.corpo.erro.detalhes));

  const preflight = await fetch(base + "/api/campanhas", { method: "OPTIONS" });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
});

test("dados armazenados corrompidos geram 500 sem sobrescrever o arquivo", async () => {
  const outro = join(pasta, "corrompido.json");
  await writeFile(outro, "isto não é JSON", "utf8");
  const s = await iniciar(criarApp(criarRepositorio(outro)));
  try {
    const url = "http://127.0.0.1:" + s.address().port + "/api/campanhas";
    const r = await fetch(url);
    assert.equal(r.status, 500);
    assert.equal((await r.json()).erro.codigo, "DADOS_INVALIDOS");
    const p = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valida) });
    assert.equal(p.status, 500);
    assert.equal(await readFile(outro, "utf8"), "isto não é JSON");
  } finally {
    await new Promise(resolve => s.close(resolve));
  }
});
