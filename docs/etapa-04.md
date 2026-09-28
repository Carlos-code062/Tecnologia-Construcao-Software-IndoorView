# Etapa 04 — Interatividade com JavaScript

O IndoorView mantém as três páginas e o CSS responsivo das etapas anteriores. Esta versão acrescenta cadastro validado, pesquisa com filtro de status e detalhes em uma janela modal. A página inicial também atualiza os indicadores e as campanhas recentes.

## Execução

1. Abra a pasta do projeto no VS Code.
2. Com a extensão Live Server, clique com o botão direito em `src/index.html` e selecione **Open with Live Server**.
3. Use o menu para navegar entre Início, Campanhas e Nova Campanha.

Alternativa, se houver Python instalado: na raiz do repositório execute `python -m http.server 8000 --directory src` e abra `http://localhost:8000/index.html`.

Use um navegador atualizado, com JavaScript e armazenamento local habilitados. Mantenha o mesmo endereço e porta ao navegar. Não há instalação de dependências para executar a aplicação.

## Funcionalidades e arquivos

### 1. Cadastro de campanha

Em `src/cadastro-campanha.html`, o evento `submit` chama `cadastrar()` em `src/js/app.js`. A função usa `preventDefault()` para evitar o envio tradicional e o recarregamento da página, lê os campos, remove espaços nas extremidades e chama `validarCampanha()`.

Erros são apresentados abaixo dos campos, com `aria-invalid` e foco no primeiro campo inválido. Um cadastro válido é acrescentado ao array, salvo com `localStorage.setItem()` e confirmado por uma mensagem de sucesso. O formulário é limpo somente depois de salvar. A campanha aparece na listagem e continua disponível após atualizar a página.

### 2. Pesquisa e filtro de campanhas

Em `src/campanhas.html`, digitar na pesquisa dispara `input`; selecionar um status dispara `change`. Ambos chamam `atualizarLista()` em `src/js/app.js`.

A função usa `filter()` para combinar pesquisa por nome/anunciante com o status. Maiúsculas, minúsculas, espaços nas extremidades e acentos são normalizados. A lista é reconstruída com `replaceChildren()`, `createElement()`, `append()` e `forEach()`, sem recarregar a página. O resultado informa a quantidade ou uma mensagem de lista vazia. O botão Limpar filtros restaura todos os resultados.

### 3. Detalhes em modal

Os botões criados por `criarCard()` chamam `abrirDetalhes(id)`, que procura a campanha com `find()` e preenche o elemento `dialog` de `src/campanhas.html`. A janela apresenta nome, anunciante, descrição, período, local e status.

É possível fechar pelo botão, pela tecla Esc ou clicando fora. O `dialog` nativo controla o foco enquanto está aberto e o devolve ao botão que abriu a janela. Um identificador inexistente produz uma mensagem em vez de tentar acessar dados ausentes.

### 4. Resumo da página inicial

`atualizarResumo()` preenche os indicadores de `src/index.html` a partir do array: quantidade de campanhas ativas, anunciantes distintos e estabelecimentos utilizados. Mostra também as duas últimas campanhas da lista, começando pela mais recente. Utiliza `filter()`, `map()`, `Set`, `slice()` e `forEach()`.

O indicador de oito telas permanece identificado como exemplo da Etapa 02, pois não existe cadastro de telas nesta versão.

## Validações e situações inválidas

- Nome e anunciante: obrigatórios, entre 3 e 80 caracteres após remover espaços nas extremidades.
- Descrição: opcional, até 500 caracteres.
- Datas: início e término obrigatórios, com datas reais no formato esperado; o término não pode ser anterior ao início. Um período de um único dia é permitido.
- Estabelecimento: deve corresponder às opções existentes. O status é calculado, sem seleção manual.
- Pesquisa sem correspondência: apresenta orientação para ajustar ou limpar os filtros.
- Campanha inexistente: apresenta mensagem e não abre um modal com dados ausentes.
- Dados salvos com JSON inválido, campos incorretos ou IDs repetidos: apresenta aviso e exemplos; bloqueia novos cadastros para evitar sobrescrever os dados existentes.
- Falha ao salvar (por exemplo, armazenamento bloqueado ou cheio): informa o erro e mantém o formulário preenchido, sem anunciar sucesso.
- Conteúdo digitado é inserido por `textContent`, sendo apresentado como texto, sem executar HTML.

## Armazenamento e limitações

O array `exemplos` contém as três campanhas da Etapa 02. Quando não há dados salvos, ele é utilizado como ponto de partida. O primeiro cadastro salva a lista completa na chave `indoorview-campanhas-v1` do `localStorage`, usando JSON.

Os dados pertencem ao navegador, perfil e endereço/porta usados. Não são enviados a um servidor nem compartilhados entre computadores. Limpar os dados do site remove os cadastros locais; para demonstrar os exemplos sem alterar seus cadastros, utilize uma janela privada.

O status é calculado por `calcularStatus()`, usando a data local do dispositivo: antes do início é Futura; do início até o último dia, inclusive, é Ativa; depois do término, Encerrada. Cards, modal, filtro e indicadores usam essa mesma função. O campo de status do formulário mostra uma prévia ao alterar as datas. Os status manuais de cadastros antigos são ignorados, sem apagar os dados salvos.

A interface recalcula ao abrir a página, à meia-noite e ao retomar uma aba suspensa. Nenhum processo precisa ficar executando com o navegador fechado: ao reabrir, a data atual determina o status correto.

O evento `storage` atualiza listas e indicadores quando outra aba altera os dados. Antes de editar, uma comparação com a versão originalmente aberta evita substituir silenciosamente uma alteração detectada em outra aba. Isso não equivale ao controle de concorrência de um banco de dados.

### Edição e renovação

Cada card da listagem tem o link **Editar campanha**, que abre `cadastro-campanha.html?editar=ID`. `prepararFormulario()` preenche os dados e muda a ação para **Salvar alterações**. A função `cadastrar()` valida e usa `map()` para substituir somente o item com esse ID; a quantidade de campanhas não aumenta.

Para renovar, altere início e término. Se hoje estiver no novo período, o status passa automaticamente para Ativa. Se o início for futuro, fica Futura. O período anterior é substituído; para manter o histórico de duas campanhas, crie outro cadastro. ID inexistente ou dados ilegíveis bloqueiam a edição. Erros de validação e falhas de armazenamento mantêm os campos preenchidos.

O CSS de filtros, mensagens e modal está em `src/css/style.css`. Foram mantidos os breakpoints de 1024 e 600 px.

## Matriz de evidências

| Requisito | Funcionalidade relacionada | Arquivo(s) | Evidência |
| --- | --- | --- | --- |
| Manipulação do DOM | Listagem e modal | `src/js/app.js`, `src/campanhas.html` | `criarCard()`, `atualizarLista()` e `abrirDetalhes()`; imagens 02 e 04 |
| Tratamento de eventos | Cadastro, filtros e detalhes | `src/js/app.js` | `addEventListener()` para submit, input, change e click; imagens 02, 04 e 07 |
| Validação de formulários | Cadastro | `src/js/app.js`, `src/cadastro-campanha.html` | `validarCampanha()` e `dataValida()`; imagens 05 e 06 |
| Alteração dinâmica da interface | Cadastro, filtro e resumo | `src/js/app.js`, três HTML | `atualizarLista()` e `atualizarResumo()`; imagens 02, 08 e 09 |
| Uso de funções | Todas | `src/js/app.js` | Funções nomeadas para validar, cadastrar, criar cards e mostrar detalhes |
| Uso de arrays | Campanhas e resultados | `src/js/app.js` | `exemplos`, `campanhas` e `filtradas`; imagem 08 |
| Métodos de iteração | Filtro, cards e validação dos dados | `src/js/app.js` | `filter()`, `forEach()`, `find()`, `map()` e `every()` |
| Tratamento de situações inválidas | Cadastro, pesquisa e armazenamento | `src/js/app.js` | Erros por campo, lista vazia e `try/catch`; imagens 03, 05, 06, 11 e 12 |

## Evidências de funcionamento

Capturas feitas no Microsoft Edge em sessão de teste isolada, com data simulada de 20/09/2026 no fuso America/Sao_Paulo para resultados reproduzíveis. Arquivos em `docs/evidencias/etapa-04/`. Imagens de desktop usam viewport 1440 × 1000 e captura da página inteira (a altura do PNG pode ser maior). A imagem 10 registra somente o viewport 390 × 844.

| Imagem | O que demonstra |
| --- | --- |
| [01 — Listagem inicial](evidencias/etapa-04/01-listagem-inicial.png) | Três campanhas de exemplo |
| [02 — Pesquisa e filtro](evidencias/etapa-04/02-pesquisa-filtro.png) | Pesquisa por ACADEMIA combinada ao status Ativa |
| [03 — Sem resultados](evidencias/etapa-04/03-sem-resultados.png) | Mensagem para pesquisa sem correspondência |
| [04 — Detalhes](evidencias/etapa-04/04-detalhes.png) | Modal com os dados de uma campanha |
| [05 — Campos inválidos](evidencias/etapa-04/05-campos-invalidos.png) | Envio vazio com mensagens de validação |
| [06 — Período inválido](evidencias/etapa-04/06-periodo-invalido.png) | Término anterior ao início |
| [07 — Cadastro concluído](evidencias/etapa-04/07-cadastro-sucesso.png) | Confirmação após gravar e limpar o formulário |
| [08 — Campanha incluída](evidencias/etapa-04/08-campanha-incluida.png) | Quarta campanha visível após recarregar |
| [09 — Resumo atualizado](evidencias/etapa-04/09-resumo-atualizado.png) | Indicadores e campanhas recentes atualizados |
| [10 — Modal no smartphone](evidencias/etapa-04/10-detalhes-smartphone.png) | Detalhes adaptados ao viewport móvel |
| [11 — Dados inválidos](evidencias/etapa-04/11-dados-invalidos.png) | Aviso ao encontrar armazenamento corrompido |
| [12 — Falha ao salvar](evidencias/etapa-04/12-falha-armazenamento.png) | Erro de escrita simulado, sem limpar o formulário |
| [13 — Renovação por edição](evidencias/etapa-04/13-edicao-renovacao.png) | Campanha Loja Tech renovada no mesmo cadastro |
| [14 — Status automático](evidencias/etapa-04/14-status-automatico.png) | Filtro Ativa inclui a campanha renovada |

## Roteiro para testar

1. Em uma janela privada, abra Campanhas: devem aparecer três exemplos.
2. Pesquise ACADEMIA: deve aparecer uma campanha. Selecione o status correspondente às datas dela em relação a hoje e confira o resultado. Digite algo inexistente: deve aparecer a mensagem de lista vazia. Clique em Limpar filtros.
3. Abra Ver detalhes. Teste separadamente fechar pelo botão, por Esc e clicando fora. Navegue também usando Tab e Enter.
4. Em Nova Campanha, envie o formulário vazio e confira as mensagens.
5. Preencha nome Campanha Primavera, anunciante Loja Primavera, início 10/10/2026, término 01/10/2026 e estabelecimento Shopping Centro. O envio deve apontar o período inválido.
6. Corrija o término para 30/10/2026 e envie. Confira a mensagem de sucesso e o formulário limpo.
7. Clique em Consultar campanhas cadastradas e atualize a página: devem aparecer quatro campanhas.
8. Vá a Início: Campanha Primavera aparece nas recentes; a quantidade de ativas deve corresponder aos períodos que incluem o dia de hoje.
9. Teste as três páginas em 1440 × 900, 768 × 1024 e 390 × 844: menu, cards, filtros e campos devem permanecer utilizáveis, sem rolagem horizontal.
10. Edite uma campanha encerrada, informe início hoje e término amanhã, e salve. Deve voltar a Ativa, mantendo o ID e a quantidade de cadastros. Atualize a página e confira a persistência.
11. Na edição, teste término anterior ao início: os dados não devem ser salvos. Teste também um período futuro e outro passado para conferir Futura e Encerrada.

Para reproduzir os testes excepcionais 11 e 12, use apenas a janela privada de teste. No console do navegador, `localStorage.setItem("indoorview-campanhas-v1", "quebrado")` seguido de recarregamento demonstra o aviso de dados inválidos. Feche essa janela privada e abra outra para começar com dados novos. Para simular falha de escrita, preencha um cadastro válido e execute `Storage.prototype.setItem = () => { throw new Error("Falha simulada"); }` antes de enviar; recarregar a página restaura o método. Essa simulação não altera o código-fonte.

## Verificação realizada

Foram testados em navegador: inclusão e persistência após recarregar; validação de campos e período; combinação de pesquisa/filtro; limpar filtros; lista vazia; abertura e três formas de fechar o modal; retorno do foco; ID inexistente; resumo atualizado; ausência de estouro horizontal nos nove cenários de tamanho/página; leitura de dados corrompidos; falha de escrita e exibição segura de texto. Não foram observados erros JavaScript não tratados nesses testes.

A tag Git `etapa-04` preserva a entrega original. Esta documentação na branch `main` inclui a melhoria posterior de edição e status automático. Os testes adicionais verificaram renovação sem duplicação, persistência, período inválido, ID inexistente, conflito entre versões, início/término inclusivos e expiração à meia-noite com o modal aberto.

## Pontos para explicar na apresentação

- `campanhas` é o array; cada objeto representa uma campanha.
- `cadastrar()` recebe o evento, valida e salva. `preventDefault()` impede o recarregamento.
- `filter()` seleciona os resultados; `forEach()` cria os cards; `find()` procura uma campanha pelo ID.
- O DOM é atualizado com `createElement()`, `textContent` e `replaceChildren()`.
- Para mudar o limite mínimo do nome, localize `validarCampanha()`. Para mudar quantas campanhas recentes aparecem, localize `slice(-2)` em `atualizarResumo()`.
