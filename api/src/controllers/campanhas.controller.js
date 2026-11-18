import { ErroApi } from "../erros.js";
import { STATUS, lerEntrada, validarCampanha, apresentar, calcularStatus, normalizarTexto } from "../dominio/campanha.js";

// Exige corpo JSON nas operações de escrita.
function exigirJson(req) {
  const tamanho = req.get("content-length");
  const semCorpo = !req.get("transfer-encoding") && (tamanho === undefined || Number(tamanho) === 0);
  if (semCorpo) throw new ErroApi(400, "CORPO_AUSENTE", "Envie os dados da campanha no corpo da requisição, em JSON.");
  if (!req.is("application/json")) throw new ErroApi(415, "TIPO_NAO_SUPORTADO", "Envie o corpo em JSON com o cabeçalho Content-Type: application/json.");
}

// Lê e valida o corpo. Corpo que não é objeto gera 400; regras de campo geram 422.
function lerCorpo(req, idDaRota) {
  const { valores, detalhes } = lerEntrada(req.body, idDaRota);
  if (detalhes.some(item => item.campo === "corpo")) {
    throw new ErroApi(400, "CORPO_INVALIDO", detalhes[0].mensagem);
  }
  if (detalhes.length) throw new ErroApi(422, "VALIDACAO", "Existem campos inválidos.", detalhes);
  return valores;
}

// Campanha completa (POST e PUT), sempre com os campos na mesma ordem.
function campanhaCompleta(valores) {
  return {
    nome: valores.nome,
    anunciante: valores.anunciante,
    descricao: valores.descricao ?? "",
    inicio: valores.inicio,
    fim: valores.fim,
    estabelecimento: valores.estabelecimento
  };
}

function validarOuFalhar(campanha) {
  const detalhes = validarCampanha(campanha);
  if (detalhes.length) throw new ErroApi(422, "VALIDACAO", "Existem campos inválidos.", detalhes);
}

function naoEncontrada(id) {
  return new ErroApi(404, "NAO_ENCONTRADA", "Campanha com id \"" + id + "\" não encontrada.");
}

export function criarControlador(repositorio) {
  return {
    // GET /api/campanhas?status=ativa&busca=academia
    async listar(req, res) {
      const { status, busca } = req.query;
      const detalhes = [];
      if (status !== undefined && (typeof status !== "string" || !STATUS.includes(status))) {
        detalhes.push({ campo: "status", mensagem: "Use um destes valores: " + STATUS.join(", ") + "." });
      }
      if (busca !== undefined && (typeof busca !== "string" || busca.length > 80)) {
        detalhes.push({ campo: "busca", mensagem: "Informe um único texto de até 80 caracteres." });
      }
      if (detalhes.length) throw new ErroApi(400, "PARAMETRO_INVALIDO", "Parâmetros de consulta inválidos.", detalhes);

      const termo = busca ? normalizarTexto(busca) : "";
      const campanhas = (await repositorio.listar()).filter(item =>
        (!status || calcularStatus(item) === status) &&
        (!termo || normalizarTexto(item.nome + " " + item.anunciante).includes(termo))
      );
      res.status(200).json(campanhas.map(apresentar));
    },

    // GET /api/campanhas/:id
    async buscar(req, res) {
      const campanha = await repositorio.buscar(req.params.id);
      if (!campanha) throw naoEncontrada(req.params.id);
      res.status(200).json(apresentar(campanha));
    },

    // POST /api/campanhas
    async criar(req, res) {
      exigirJson(req);
      const dados = campanhaCompleta(lerCorpo(req, null));
      validarOuFalhar(dados);
      const criada = await repositorio.criar(dados);
      res.status(201).location("/api/campanhas/" + encodeURIComponent(criada.id)).json(apresentar(criada));
    },

    // PUT /api/campanhas/:id — substitui todos os campos editáveis.
    async substituir(req, res) {
      exigirJson(req);
      const { id } = req.params;
      if (!await repositorio.buscar(id)) throw naoEncontrada(id);
      const dados = campanhaCompleta(lerCorpo(req, id));
      validarOuFalhar(dados);
      const atualizada = await repositorio.atualizar(id, dados);
      if (!atualizada) throw naoEncontrada(id);
      res.status(200).json(apresentar(atualizada));
    },

    // PATCH /api/campanhas/:id — altera apenas os campos enviados.
    async alterarParcial(req, res) {
      exigirJson(req);
      const { id } = req.params;
      const existente = await repositorio.buscar(id);
      if (!existente) throw naoEncontrada(id);
      const valores = lerCorpo(req, id);
      if (!Object.keys(valores).length) {
        throw new ErroApi(422, "VALIDACAO", "Envie ao menos um campo para alterar.", [
          { campo: "corpo", mensagem: "Campos aceitos: nome, anunciante, descricao, inicio, fim, estabelecimento." }
        ]);
      }
      validarOuFalhar({ ...existente, ...valores });
      const atualizada = await repositorio.atualizar(id, valores);
      if (!atualizada) throw naoEncontrada(id);
      res.status(200).json(apresentar(atualizada));
    },

    // DELETE /api/campanhas/:id
    async excluir(req, res) {
      const excluiu = await repositorio.excluir(req.params.id);
      if (!excluiu) throw naoEncontrada(req.params.id);
      res.status(204).end();
    }
  };
}
