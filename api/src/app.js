import express from "express";
import { ErroApi, corpoErro } from "./erros.js";
import { criarRotasCampanhas } from "./routes/campanhas.routes.js";

// Monta a aplicação sem iniciar o servidor, o que permite testá-la.
export function criarApp(repositorio) {
  const app = express();
  app.disable("x-powered-by");

  // CORS: permite que o front-end (Live Server ou GitHub Pages) consuma a API.
  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });

  app.use(express.json({ limit: "10kb" }));

  app.get("/", (req, res) => {
    res.json({
      nome: "API do IndoorView",
      versao: "1.0.0",
      recursos: { campanhas: "/api/campanhas" },
      documentacao: "docs/etapa-06.md"
    });
  });

  app.use("/api/campanhas", criarRotasCampanhas(repositorio));

  // Rota inexistente.
  app.use((req, res, next) => {
    next(new ErroApi(404, "ROTA_NAO_ENCONTRADA", "Rota " + req.method + " " + req.path + " não encontrada."));
  });

  // Tratamento centralizado: todo erro sai no mesmo formato JSON.
  app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);
    if (erro instanceof ErroApi) {
      return res.status(erro.status).json(corpoErro(erro.codigo, erro.message, erro.detalhes));
    }
    // Erros gerados pelo leitor de JSON do Express.
    if (erro.type === "entity.parse.failed") {
      return res.status(400).json(corpoErro("JSON_INVALIDO", "O corpo enviado não é um JSON válido."));
    }
    if (erro.type === "entity.too.large") {
      return res.status(413).json(corpoErro("CORPO_MUITO_GRANDE", "O corpo da requisição excede o limite de 10 KB."));
    }
    if (erro.type === "encoding.unsupported" || erro.type === "charset.unsupported") {
      return res.status(415).json(corpoErro("TIPO_NAO_SUPORTADO", "Use JSON com codificação UTF-8."));
    }
    console.error(erro);
    res.status(500).json(corpoErro("ERRO_INTERNO", "Erro interno no servidor. Tente novamente."));
  });

  return app;
}
