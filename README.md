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

Etapa 05 — Modularização e comunicação assíncrona

Nesta etapa foram criadas três interfaces para o IndoorView:

- Página inicial;
- Listagem de campanhas;
- Formulário de cadastro de campanha.

As três interfaces mantêm o CSS responsivo e possuem cadastro validado, edição de campanhas, pesquisa e filtro, modal de detalhes e resumo dinâmico. Os cadastros são guardados no localStorage do navegador. O status é calculado pelas datas: Futura antes do início, Ativa durante todo o período e Encerrada após o último dia, conforme a data local do dispositivo.

Para executar, abra a pasta no VS Code e use **Open with Live Server** em `src/index.html`. Não são necessárias dependências da aplicação. Use sempre o mesmo endereço e porta para acessar seus dados.

Alternativa com Python instalado: execute `python -m http.server 8000 --directory src` na raiz do projeto e acesse `http://localhost:8000/index.html`.

O [roteiro da Etapa 05](docs/etapa-05.md) explica os módulos, a consulta Fetch e o envio ao serviço simulado com async/await. Há mensagens de carregamento, sucesso e erro, com repetição de consulta e preservação dos campos em falhas. O serviço simulado grava no navegador, não em um servidor remoto. Os cinco módulos estão em `src/js/` e os dados iniciais em `src/dados/campanhas.json`. Execute por HTTP/HTTPS (Live Server ou GitHub Pages), não abrindo o HTML diretamente por `file://`. As tags anteriores preservam suas respectivas entregas.

Documentação

Etapa 01:
docs/proposta.md

Etapa 02:
docs/etapa-02.md

Etapa 03:
docs/etapa-03.md

Etapa 04:
[Interatividade, testes e evidências](docs/etapa-04.md)

Etapa 05:
[Modularização, serviço assíncrono e demonstração](docs/etapa-05.md)
