import { Router } from "express";
import { ErroApi } from "../erros.js";
import { criarControlador } from "../controllers/campanhas.controller.js";

// Responde 405 com o cabeçalho Allow quando o método não existe para a rota.
function metodoNaoPermitido(permitidos) {
  return (req, res) => {
    res.set("Allow", permitidos);
    throw new ErroApi(405, "METODO_NAO_PERMITIDO", "Método " + req.method + " não permitido. Use: " + permitidos + ".");
  };
}

export function criarRotasCampanhas(repositorio) {
  const controlador = criarControlador(repositorio);
  const rotas = Router();

  rotas.route("/")
    .get(controlador.listar)
    .post(controlador.criar)
    .all(metodoNaoPermitido("GET, HEAD, POST, OPTIONS"));

  rotas.route("/:id")
    .get(controlador.buscar)
    .put(controlador.substituir)
    .patch(controlador.alterarParcial)
    .delete(controlador.excluir)
    .all(metodoNaoPermitido("GET, HEAD, PUT, PATCH, DELETE, OPTIONS"));

  return rotas;
}
