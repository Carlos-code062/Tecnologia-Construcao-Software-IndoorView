# IndoorView

Sistema Web para gerenciamento de campanhas de mídia indoor.

## Objetivo

O IndoorView tem como objetivo facilitar o controle de anúncios exibidos em televisões instaladas em diferentes estabelecimentos.

O sistema permitirá gerenciar:

- anunciantes;
- campanhas;
- estabelecimentos;
- telas;
- períodos de exibição.

## Funcionalidades previstas

- Cadastro de anunciantes.
- Cadastro de estabelecimentos.
- Cadastro de telas.
- Criação de campanhas.
- Associação de campanhas às telas.
- Definição de início e término das campanhas.
- Consulta de campanhas futuras, ativas e encerradas.
- Pesquisa de campanhas.

## Tecnologias

Cliente:

- HTML
- CSS
- JavaScript (módulos ES)

Servidor (implementado na Etapa 06, pasta `api/`):

- Node.js
- Express.js

Persistência:

- Etapa 06: arquivo JSON gerenciado pela API (`api/dados/`).
- Banco de dados SQLite previsto para uma etapa futura (não implementado).

## Etapa atual

Etapa 06 — API REST da aplicação

A pasta `api/` contém o servidor em Node.js/Express, que disponibiliza o recurso **campanhas** com os seguintes endpoints:

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/api/campanhas` | Consulta (filtros `?status=` e `?busca=`) |
| GET | `/api/campanhas/:id` | Consulta individual |
| POST | `/api/campanhas` | Criação |
| PUT | `/api/campanhas/:id` | Alteração completa |
| PATCH | `/api/campanhas/:id` | Alteração parcial |
| DELETE | `/api/campanhas/:id` | Exclusão |

A API usa JSON, retorna códigos HTTP coerentes (200, 201, 204, 400, 404, 405, 413, 415, 422 e 500), valida as entradas e informa os erros sempre no mesmo formato. A documentação completa, com exemplos de requisições e respostas, está em [docs/etapa-06.md](docs/etapa-06.md).

### Executar a API

Requer [Node.js](https://nodejs.org/) 20 ou superior.

```bash
cd api
npm install
npm start
```

A API fica disponível em `http://localhost:3000/api/campanhas`. Testes automatizados: `npm test`, dentro da pasta `api`.

A coleção do Postman está em `api/postman/IndoorView-API.postman_collection.json` e também pode ser importada no Insomnia.

### Executar o front-end

Para executar a interface, abra a pasta no VS Code e use **Open with Live Server** em `src/index.html`. Use sempre o mesmo endereço e a mesma porta para acessar seus dados.

Alternativa com Python instalado: execute `python -m http.server 8000 --directory src` na raiz do projeto e acesse `http://localhost:8000/index.html`.

A interface também está publicada no GitHub Pages. Ela mantém as funcionalidades das Etapas 04 e 05: cadastro validado, edição, pesquisa e filtro, modal de detalhes, resumo dinâmico e comunicação assíncrona com o serviço simulado, que grava no navegador. A integração da interface com a API da Etapa 06 fica para a próxima etapa. Execute por HTTP/HTTPS (Live Server ou GitHub Pages), não abrindo o HTML diretamente por `file://`.

As tags anteriores preservam suas respectivas entregas.

## Documentação

- Etapa 01: [Proposta](docs/proposta.md)
- Etapa 02: [HTML semântico](docs/etapa-02.md)
- Etapa 03: [Interface responsiva](docs/etapa-03.md)
- Etapa 04: [Interatividade, testes e evidências](docs/etapa-04.md)
- Etapa 05: [Modularização, serviço assíncrono e demonstração](docs/etapa-05.md)
- Etapa 06: [API REST, endpoints e exemplos](docs/etapa-06.md)
