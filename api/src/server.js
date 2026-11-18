import { criarApp } from "./app.js";
import { criarRepositorio } from "./repositorio/campanhas.repositorio.js";

const PORTA = Number(process.env.PORT) || 3000;

const repositorio = criarRepositorio(process.env.DADOS_ARQUIVO);
const app = criarApp(repositorio);

app.listen(PORTA, () => {
  console.log("API do IndoorView em execução: http://localhost:" + PORTA + "/api/campanhas");
});
