# ETAPA 03 - INTERFACE RESPONSIVA COM CSS

## 1. Interfaces apresentadas

As evidências mostram as mesmas três interfaces desenvolvidas na Etapa 02:

1. `src/index.html`: página inicial com visão geral e campanhas recentes.
2. `src/campanhas.html`: listagem das campanhas cadastradas.
3. `src/cadastro-campanha.html`: formulário de cadastro de campanha.

## 2. Viewports utilizados

| Dispositivo | Viewport | Evidências |
| --- | --- | --- |
| Desktop | 1440 x 900 px | `desktop-tela-01.png`, `desktop-tela-02.png` e `desktop-tela-03.png` |
| Tablet | 768 x 1024 px | `tablet-tela-01.png`, `tablet-tela-02.png` e `tablet-tela-03.png` |
| Smartphone | 390 x 844 px | `smartphone-tela-01.png`, `smartphone-tela-02.png` e `smartphone-tela-03.png` |

Os nove arquivos estão em `docs/evidencias/etapa-03/`.

## 3. Breakpoints utilizados

- `max-width: 1024px`: reorganiza os cards em duas colunas e reduz as margens laterais para tablets e telas intermediárias.
- `max-width: 600px`: transforma cards e formulário em uma coluna, empilha o menu e ajusta espaçamentos para smartphones.

## 4. Principais decisões de responsividade

- Flexbox foi utilizado no corpo da página, no menu de navegação, nos cards e nos grupos de campos do formulário.
- CSS Grid foi utilizado para distribuir os cards e organizar o formulário em duas colunas no desktop.
- No tablet, as grades de indicadores e campanhas passam para duas colunas.
- No smartphone, menu, cards e formulário passam para uma coluna, evitando rolagem horizontal.
- Links, botões e campos possuem altura mínima de 44 px para facilitar o uso por toque.
- Larguras fluidas, `minmax()`, `clamp()` e quebra de palavras mantêm o conteúdo legível em diferentes tamanhos.
- O item atual do menu possui destaque visual e os elementos interativos possuem foco visível para uso por teclado.

## 5. Localização do CSS

Todo o CSS responsável pela apresentação e pela responsividade está organizado em:

`src/css/style.css`
