IndoorView

Sistema Web para gerenciamento de campanhas de mídia indoor.

Objetivo

O IndoorView tem como objetivo facilitar o controle de anúncios exibidos em televisões instaladas em diferentes estabelecimentos.

O sistema permitirá gerenciar:

- anunciantes;
- campanhas;
- estabelecimentos;
- telas;
- períodos de exibição.

Funcionalidades previstas

- Cadastro de anunciantes.
- Cadastro de estabelecimentos.
- Cadastro de telas.
- Criação de campanhas.
- Associação de campanhas às telas.
- Definição de início e término das campanhas.
- Consulta de campanhas futuras, ativas e encerradas.
- Pesquisa de campanhas.

Tecnologias

Cliente:

- HTML
- CSS
- JavaScript

Servidor previsto para etapas futuras (não implementado):

- Node.js
- Express.js

Banco de dados previsto para etapas futuras (não implementado):

- SQLite

Etapa atual

Etapa 04 — Interatividade com JavaScript

Nesta etapa foram criadas três interfaces para o IndoorView:

- Página inicial;
- Listagem de campanhas;
- Formulário de cadastro de campanha.

As três interfaces mantêm o CSS responsivo e agora possuem cadastro validado, pesquisa e filtro de campanhas, modal de detalhes e resumo dinâmico. Os cadastros são guardados no localStorage do navegador. O status é escolhido manualmente.

Para executar, abra a pasta no VS Code e use **Open with Live Server** em `src/index.html`. Não são necessárias dependências da aplicação. Use sempre o mesmo endereço e porta para acessar seus dados.

Alternativa com Python instalado: execute `python -m http.server 8000 --directory src` na raiz do projeto e acesse `http://localhost:8000/index.html`.

O [roteiro de teste e a matriz de evidências](docs/etapa-04.md) explicam como verificar cada requisito. O JavaScript está em `src/js/app.js`. Versão de entrega: `etapa-04`.

Documentação

Etapa 01:
docs/proposta.md

Etapa 02:
docs/etapa-02.md

Etapa 03:
docs/etapa-03.md

Etapa 04:
[Interatividade, testes e evidências](docs/etapa-04.md)
