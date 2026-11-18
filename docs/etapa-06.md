# Etapa 06 — API REST da aplicação

Nesta etapa o IndoorView passa a ter um servidor próprio. A API, feita em **Node.js com Express**, disponibiliza o recurso principal do sistema, **campanhas**, com consulta, consulta individual, criação, alteração (PUT e PATCH) e exclusão. Os dados trafegam em JSON, os códigos HTTP seguem o resultado de cada operação e todos os erros usam o mesmo formato.

O front-end das etapas anteriores continua funcionando como antes, no GitHub Pages, com o serviço simulado da Etapa 05. A integração da interface com esta API fica para a próxima etapa.

## 1. Como executar

Pré-requisito: [Node.js](https://nodejs.org/) versão 20 ou superior (o npm já vem junto).

```bash
cd api
npm install
npm start
```

A API fica disponível em `http://localhost:3000`. Para usar outra porta: `PORT=4000 npm start` (Linux/macOS) ou `$env:PORT=4000; npm start` (PowerShell).

Para executar os testes automatizados:

```bash
cd api
npm test
```

Os testes sobem a API numa porta livre e usam um arquivo de dados temporário. Por isso não alteram os dados reais.

Na primeira execução a API cria `api/dados/campanhas.json` a partir de `api/dados/campanhas-iniciais.json`, que tem as três campanhas de exemplo das etapas anteriores. Para voltar aos dados iniciais, pare a API e apague `api/dados/campanhas.json`. Esse arquivo está no `.gitignore`, porque é gerado durante o uso.

## 2. Organização do código

| Arquivo | Responsabilidade |
| --- | --- |
| `api/src/server.js` | Inicia o servidor HTTP na porta configurada |
| `api/src/app.js` | Monta o Express: CORS, leitura de JSON, rotas, rota inexistente (404) e tratamento centralizado de erros |
| `api/src/routes/campanhas.routes.js` | Define as rotas do recurso `/api/campanhas` e o 405 para métodos não suportados |
| `api/src/controllers/campanhas.controller.js` | Recebe cada requisição, valida a entrada, chama o repositório e escolhe o código HTTP |
| `api/src/dominio/campanha.js` | Regras de negócio: validação dos campos, datas, estabelecimentos e cálculo do status |
| `api/src/repositorio/campanhas.repositorio.js` | Persistência em arquivo JSON, com gravação segura e uma alteração por vez |
| `api/src/erros.js` | Classe `ErroApi` e formato padrão das respostas de erro |
| `api/test/campanhas.test.js` | Testes automatizados de todos os endpoints e erros (`node:test`) |
| `api/postman/IndoorView-API.postman_collection.json` | Coleção do Postman (também pode ser importada no Insomnia) |

Separação em camadas: **rota → controlador → domínio/repositório**. Só o repositório sabe que os dados ficam num arquivo JSON. Para trocar por SQLite, que está previsto na proposta, basta reescrever esse módulo, sem mexer nas rotas.

## 3. Recurso Campanha

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | texto | Gerado pelo servidor (UUID). Não pode ser enviado na criação. |
| `nome` | texto | Obrigatório, de 3 a 80 caracteres (espaços nas pontas são removidos) |
| `anunciante` | texto | Obrigatório, de 3 a 80 caracteres |
| `descricao` | texto | Opcional, até 500 caracteres; vazio quando não for enviado |
| `inicio` | texto `AAAA-MM-DD` | Obrigatório, precisa ser uma data real (ex.: `2026-02-30` é recusada) |
| `fim` | texto `AAAA-MM-DD` | Obrigatório, data real e não anterior ao início |
| `estabelecimento` | texto | Obrigatório: `academia`, `mercado` ou `shopping` |
| `estabelecimentoNome` | texto | Calculado: nome do estabelecimento (somente leitura) |
| `status` | texto | Calculado pelas datas: `futura`, `ativa` ou `encerrada` (somente leitura) |
| `criadoEm`, `atualizadoEm` | data/hora ISO | Preenchidos pelo servidor (somente leitura) |

O status segue a mesma regra do front-end. É `futura` antes do início, `ativa` do início até o fim do último dia (inclusive) e `encerrada` depois do término. Ele usa a data do servidor e não é gravado, então nunca fica desatualizado.

Os campos somente leitura (`status`, `estabelecimentoNome`, `criadoEm`, `atualizadoEm`) são ignorados se o cliente enviá-los. Assim é possível pegar o objeto de um GET, alterar e mandar de volta num PUT. Campos desconhecidos são recusados com 422.

## 4. Endpoints

URL base: `http://localhost:3000`

| Método | Rota | Descrição | Sucesso | Erros possíveis |
| --- | --- | --- | --- | --- |
| GET | `/api/campanhas` | Lista as campanhas. Filtros opcionais `?status=` e `?busca=` | 200 | 400, 500 |
| GET | `/api/campanhas/:id` | Consulta uma campanha | 200 | 404, 500 |
| POST | `/api/campanhas` | Cria uma campanha | 201 + header `Location` | 400, 413, 415, 422, 500 |
| PUT | `/api/campanhas/:id` | Substitui todos os campos editáveis | 200 | 400, 404, 413, 415, 422, 500 |
| PATCH | `/api/campanhas/:id` | Altera somente os campos enviados | 200 | 400, 404, 413, 415, 422, 500 |
| DELETE | `/api/campanhas/:id` | Exclui uma campanha | 204 (sem corpo) | 404, 500 |
| GET | `/` | Informações da API e lista de recursos | 200 | — |

Filtros da listagem:

- `status`: `ativa`, `futura` ou `encerrada`. Qualquer outro valor retorna 400.
- `busca`: procura no nome e no anunciante, até 80 caracteres. Ignora maiúsculas, minúsculas e acentos (`pao` encontra "Pão").
- Os dois podem ser combinados: `/api/campanhas?status=ativa&busca=academia`.

Diferença entre PUT e PATCH: no **PUT** o corpo precisa ter a campanha completa, e um campo opcional omitido (`descricao`) fica vazio. No **PATCH** basta enviar os campos que vão mudar. A regra do período é conferida junto com os dados já gravados, então um `fim` anterior ao `inicio` atual é recusado.

## 5. Códigos HTTP utilizados

| Código | Quando acontece |
| --- | --- |
| 200 OK | Consulta, PUT ou PATCH concluídos |
| 201 Created | Campanha criada. O header `Location` aponta para a nova campanha |
| 204 No Content | Campanha excluída |
| 400 Bad Request | JSON malformado, corpo ausente, corpo que não é um objeto, ou parâmetro de consulta inválido |
| 404 Not Found | Campanha ou rota inexistente |
| 405 Method Not Allowed | Método não suportado na rota (ex.: `DELETE /api/campanhas`). O header `Allow` lista os métodos aceitos |
| 413 Payload Too Large | Corpo maior que 10 KB |
| 415 Unsupported Media Type | Corpo enviado sem `Content-Type: application/json` |
| 422 Unprocessable Entity | JSON correto, mas com campos que não cumprem as regras |
| 500 Internal Server Error | Falha ao ler ou gravar os dados, ou arquivo de dados corrompido (o arquivo não é sobrescrito) |

## 6. Formato dos erros

Todo erro, de qualquer endpoint, tem o mesmo formato:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Existem campos inválidos.",
    "detalhes": [
      { "campo": "nome", "mensagem": "O nome deve ter entre 3 e 80 caracteres." }
    ]
  }
}
```

- `codigo`: identificador fixo para o programa cliente tratar o erro. Valores possíveis: `VALIDACAO`, `JSON_INVALIDO`, `CORPO_AUSENTE`, `CORPO_INVALIDO`, `PARAMETRO_INVALIDO`, `TIPO_NAO_SUPORTADO`, `CORPO_MUITO_GRANDE`, `NAO_ENCONTRADA`, `ROTA_NAO_ENCONTRADA`, `METODO_NAO_PERMITIDO`, `DADOS_INVALIDOS`, `ERRO_ARMAZENAMENTO` e `ERRO_INTERNO`.
- `mensagem`: texto em português para mostrar ao usuário.
- `detalhes`: lista de problemas por campo (vazia quando não se aplica).

## 7. Exemplos de requisições e respostas

Os exemplos usam `curl`. No Windows, use o **Prompt de Comando** ou o Git Bash. No PowerShell, chame `curl.exe` em vez de `curl`. Os valores de `id`, datas de criação e `status` mudam conforme o dia da execução.

### 7.1 Listar campanhas — `GET /api/campanhas`

```bash
curl -i http://localhost:3000/api/campanhas
```

Resposta `200 OK`:

```json
[
  {
    "id": "1",
    "nome": "Campanha Academia Fit",
    "anunciante": "Academia Fit",
    "descricao": "Divulgação dos planos da academia.",
    "inicio": "2026-08-25",
    "fim": "2026-09-25",
    "estabelecimento": "academia",
    "criadoEm": "2026-08-20T12:00:00.000Z",
    "atualizadoEm": "2026-08-20T12:00:00.000Z",
    "estabelecimentoNome": "Academia Power Fit",
    "status": "encerrada"
  }
]
```

(Resposta resumida: a lista inicial tem três campanhas.)

Com filtros:

```bash
curl -i "http://localhost:3000/api/campanhas?status=encerrada&busca=academia"
```

Filtro inválido, `GET /api/campanhas?status=pausada`, resposta `400 Bad Request`:

```json
{
  "erro": {
    "codigo": "PARAMETRO_INVALIDO",
    "mensagem": "Parâmetros de consulta inválidos.",
    "detalhes": [
      { "campo": "status", "mensagem": "Use um destes valores: ativa, futura, encerrada." }
    ]
  }
}
```

### 7.2 Consultar uma campanha — `GET /api/campanhas/:id`

```bash
curl -i http://localhost:3000/api/campanhas/1
```

Resposta `200 OK`: o objeto da campanha, no mesmo formato de um item da listagem.

Campanha inexistente, `GET /api/campanhas/999`, resposta `404 Not Found`:

```json
{
  "erro": {
    "codigo": "NAO_ENCONTRADA",
    "mensagem": "Campanha com id \"999\" não encontrada.",
    "detalhes": []
  }
}
```

### 7.3 Criar campanha — `POST /api/campanhas`

```bash
curl -i -X POST http://localhost:3000/api/campanhas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Campanha Verão","anunciante":"Sorveteria Gelato","descricao":"Promoção de sorvetes.","inicio":"2026-11-01","fim":"2099-12-31","estabelecimento":"shopping"}'
```

No Prompt de Comando do Windows, use uma linha só e aspas duplas escapadas. Evite acentos no terminal, porque ele pode não enviar o texto em UTF-8. Para testar com acentos, use o Postman.

```bash
curl -i -X POST http://localhost:3000/api/campanhas -H "Content-Type: application/json" -d "{\"nome\":\"Campanha Verao\",\"anunciante\":\"Sorveteria Gelato\",\"inicio\":\"2026-11-01\",\"fim\":\"2099-12-31\",\"estabelecimento\":\"shopping\"}"
```

Resposta `201 Created`, com o header `Location: /api/campanhas/3f0c6a2e-8a51-4d7e-9b8e-2a6c1f7d9e10`:

```json
{
  "id": "3f0c6a2e-8a51-4d7e-9b8e-2a6c1f7d9e10",
  "nome": "Campanha Verão",
  "anunciante": "Sorveteria Gelato",
  "descricao": "Promoção de sorvetes.",
  "inicio": "2026-11-01",
  "fim": "2099-12-31",
  "estabelecimento": "shopping",
  "criadoEm": "2026-11-17T14:30:00.000Z",
  "atualizadoEm": "2026-11-17T14:30:00.000Z",
  "estabelecimentoNome": "Shopping Centro",
  "status": "ativa"
}
```

Dados inválidos:

```json
{ "nome": "AB", "anunciante": "", "inicio": "2026-10-10", "fim": "2026-10-01", "estabelecimento": "praia" }
```

Resposta `422 Unprocessable Entity`:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Existem campos inválidos.",
    "detalhes": [
      { "campo": "nome", "mensagem": "O nome deve ter entre 3 e 80 caracteres." },
      { "campo": "anunciante", "mensagem": "O anunciante é obrigatório." },
      { "campo": "fim", "mensagem": "O término não pode ser anterior ao início." },
      { "campo": "estabelecimento", "mensagem": "Use um destes valores: academia, mercado, shopping." }
    ]
  }
}
```

JSON malformado (`{ "nome": "Campanha sem fechar"`), resposta `400 Bad Request`:

```json
{ "erro": { "codigo": "JSON_INVALIDO", "mensagem": "O corpo enviado não é um JSON válido.", "detalhes": [] } }
```

Sem `Content-Type: application/json`, resposta `415 Unsupported Media Type`:

```json
{ "erro": { "codigo": "TIPO_NAO_SUPORTADO", "mensagem": "Envie o corpo em JSON com o cabeçalho Content-Type: application/json.", "detalhes": [] } }
```

### 7.4 Substituir campanha — `PUT /api/campanhas/:id`

```bash
curl -i -X PUT http://localhost:3000/api/campanhas/1 \
  -H "Content-Type: application/json" \
  -d '{"nome":"Campanha Academia Fit 2027","anunciante":"Academia Fit","descricao":"Renovação dos planos.","inicio":"2027-01-01","fim":"2027-01-31","estabelecimento":"academia"}'
```

Resposta `200 OK`:

```json
{
  "id": "1",
  "nome": "Campanha Academia Fit 2027",
  "anunciante": "Academia Fit",
  "descricao": "Renovação dos planos.",
  "inicio": "2027-01-01",
  "fim": "2027-01-31",
  "estabelecimento": "academia",
  "criadoEm": "2026-08-20T12:00:00.000Z",
  "atualizadoEm": "2026-11-17T14:35:00.000Z",
  "estabelecimentoNome": "Academia Power Fit",
  "status": "futura"
}
```

Um PUT sem todos os campos obrigatórios retorna 422. Um `id` no corpo diferente do da URL também retorna 422. Um id inexistente retorna 404.

### 7.5 Alterar parcialmente — `PATCH /api/campanhas/:id`

```bash
curl -i -X PATCH http://localhost:3000/api/campanhas/1 \
  -H "Content-Type: application/json" \
  -d '{"descricao":"Planos com desconto."}'
```

Resposta `200 OK`: a campanha completa, com só a `descricao` alterada e `atualizadoEm` atualizado.

Corpo vazio (`{}`), resposta `422 Unprocessable Entity`:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Envie ao menos um campo para alterar.",
    "detalhes": [
      { "campo": "corpo", "mensagem": "Campos aceitos: nome, anunciante, descricao, inicio, fim, estabelecimento." }
    ]
  }
}
```

### 7.6 Excluir campanha — `DELETE /api/campanhas/:id`

```bash
curl -i -X DELETE http://localhost:3000/api/campanhas/1
```

Resposta `204 No Content`, sem corpo. Repetir a exclusão retorna `404 Not Found`, com o código `NAO_ENCONTRADA`.

### 7.7 Método não permitido

```bash
curl -i -X DELETE http://localhost:3000/api/campanhas
```

Resposta `405 Method Not Allowed`, com o header `Allow: GET, HEAD, POST, OPTIONS`:

```json
{
  "erro": {
    "codigo": "METODO_NAO_PERMITIDO",
    "mensagem": "Método DELETE não permitido. Use: GET, HEAD, POST, OPTIONS.",
    "detalhes": []
  }
}
```

## 8. Coleção do Postman

Arquivo: `api/postman/IndoorView-API.postman_collection.json`

1. Inicie a API (`npm start` dentro de `api`).
2. No Postman, clique em **Import** e selecione o arquivo. No Insomnia, use **Import → From File**: o Insomnia aceita coleções do Postman.
3. A variável `baseUrl` já vem como `http://localhost:3000`.
4. Execute a pasta **1 - Fluxo principal (CRUD)** em ordem, ou use o **Run collection**. A requisição *Criar campanha* guarda o id criado em `campanhaId`, e as seguintes consultam, substituem, alteram e excluem essa mesma campanha.
5. A pasta **2 - Erros e validações** demonstra as respostas 400, 404, 405, 415 e 422.

Cada requisição tem testes (aba *Tests*) que conferem o código HTTP e o conteúdo da resposta. No Collection Runner todas devem aparecer como aprovadas.

## 9. Matriz de atendimento

| Requisito do enunciado | Implementação | Onde verificar |
| --- | --- | --- |
| Pelo menos um recurso principal | Recurso `campanhas` em `/api/campanhas` | `api/src/routes/campanhas.routes.js` |
| GET para consulta | `GET /api/campanhas`, com filtros `status` e `busca` | `listar()` no controlador; seção 7.1 |
| GET para consulta individual | `GET /api/campanhas/:id` | `buscar()`; seção 7.2 |
| POST para criação | `POST /api/campanhas`, que retorna 201 e `Location` | `criar()`; seção 7.3 |
| PUT ou PATCH para alteração | `PUT` (substituição) e `PATCH` (parcial) | `substituir()` e `alterarParcial()`; seções 7.4 e 7.5 |
| DELETE para exclusão | `DELETE /api/campanhas/:id`, que retorna 204 | `excluir()`; seção 7.6 |
| Utilizar HTTP adequadamente | Métodos com semântica correta, header `Location`, header `Allow` no 405, CORS | `app.js`, `campanhas.routes.js` |
| Utilizar JSON | Entrada por `express.json()` e saída por `res.json()`; exige `Content-Type` JSON | `app.js`; `exigirJson()` no controlador |
| Códigos HTTP coerentes | 200, 201, 204, 400, 404, 405, 413, 415, 422 e 500 | Seção 5; testes automatizados |
| Validar entradas | Tipos, obrigatórios, tamanhos, datas reais, período, estabelecimento, campos desconhecidos e parâmetros de consulta | `api/src/dominio/campanha.js` |
| Erros consistentes | Formato único `{ erro: { codigo, mensagem, detalhes } }` num tratador central | `api/src/erros.js`; tratador no fim de `app.js` |
| Organizar as rotas | `Router` do Express por recurso, em camadas rota → controlador → domínio/repositório | `api/src/routes/`, `api/src/controllers/` |
| Permitir testes com Postman/curl | Coleção do Postman com testes e exemplos `curl` | `api/postman/`; seções 7 e 8 |
| Código da API | Pasta `api/` | `api/src/` |
| Documentação, exemplos e instruções | Este documento | `docs/etapa-06.md` |

## 10. Testes automatizados

`api/test/campanhas.test.js` usa o executor de testes nativo do Node (`node:test`) e o `fetch` nativo, sem dependências extras. Ele confere:

- listagem, consulta individual, criação com 201 e `Location`, PUT, PATCH e DELETE com 204;
- gravação no arquivo, sem salvar o `status` calculado;
- validação de cada campo, período inválido, tipo errado, campo desconhecido, `id` na criação e descrição longa;
- JSON malformado (400), corpo ausente (400), corpo em lista (400), `Content-Type` errado (415) e corpo grande (413);
- PATCH que deixaria o término antes do início, PATCH vazio, PUT incompleto e `id` divergente;
- 404 para campanha e rota inexistentes, 405 com `Allow`, e resposta ao preflight CORS;
- filtros por status e busca sem acento, e filtro inválido ou repetido;
- arquivo de dados corrompido, que gera 500 sem ser sobrescrito.

## 11. Limitações

- A persistência é feita num arquivo JSON, adequado para esta etapa. O banco SQLite previsto na proposta pode substituir o repositório depois, sem alterar a API.
- Não há autenticação: qualquer cliente que alcance a API pode alterar os dados.
- O front-end publicado no GitHub Pages ainda usa o serviço simulado da Etapa 05. O GitHub Pages hospeda só arquivos estáticos e não executa a API em Node.js.
- O status depende do relógio e do fuso horário do computador onde a API está rodando.
