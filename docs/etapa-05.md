# Etapa 05 — Modularização e comunicação assíncrona

O IndoorView mantém cadastro, edição, pesquisa, detalhes e status automático. Nesta etapa, separa as responsabilidades em módulos ES e passa a consultar e enviar dados por uma camada assíncrona. Foi escolhida a opção de **serviço simulado**, permitida no enunciado, para funcionar no GitHub Pages sem depender de uma API pública de terceiros.

## Organização do código

| Arquivo | Responsabilidade |
| --- | --- |
| `src/js/app.js` | Eventos das páginas, formulário, filtros, resumo e estados de carregamento |
| `src/js/dominio.js` | Regras de validação, cálculo de status, datas e nomes dos estabelecimentos |
| `src/js/interface.js` | Criação segura dos cartões e apresentação do modal |
| `src/js/servico.js` | Contrato de consulta e gravação; tratamento das respostas do serviço |
| `src/js/servico-simulado.js` | Adaptador de serviço: recebe Request, retorna Promise de Response, consulta e persiste os dados |
| `src/dados/campanhas.json` | Dados iniciais externos aos módulos JavaScript, consultados por Fetch API |

As três páginas carregam `app.js` com `type="module"`. As dependências são declaradas com `import` e `export`. O serviço não acessa elementos da página; as regras de domínio não dependem do DOM. Não há bibliotecas ou instalação de dependências para usar o site.

## Consulta e envio

Na abertura da página, `carregarPagina()` aguarda `listarCampanhas()` com `await`. O adaptador simula 600 ms de latência com uma Promise e recebe uma operação GET. Sem cadastros locais, executa um `fetch()` real para `dados/campanhas.json`, verifica `response.ok`, interpreta o JSON e valida sua estrutura. Com cadastros existentes, utiliza a lista persistida no navegador, preservando os dados da Etapa 04.

No cadastro, a interface valida os campos e chama `salvarCampanha()`. O cliente cria um Request com método POST e corpo JSON. Na edição utiliza PUT, preservando o ID. O adaptador valida novamente, detecta IDs duplicados ou conflito de edição, grava a lista e só então responde com sucesso. A interface aguarda a resposta antes de limpar o formulário ou anunciar sucesso.

**Limite da simulação:** o POST/PUT é submetido ao adaptador JavaScript local, não a um servidor remoto. A URL lógica `api/campanhas` identifica a operação no Request, mas não é um endpoint publicado no GitHub Pages. A consulta inicial ao JSON é uma requisição HTTP real. Os dados gravados continuam no localStorage, por navegador e origem. Não há banco de dados, autenticação nem sincronização entre computadores. No painel Network, a consulta inicial aparece como `campanhas.json`; POST e PUT simulados não aparecem como tráfego de rede.

| Operação | Resposta simulada |
| --- | --- |
| GET | 200 e lista de campanhas |
| POST válido | 201 e campanha criada |
| PUT válido | 200 e campanha atualizada |
| Dados de campanha inválidos | 422 |
| ID duplicado ou conflito de edição | 409 |
| Falha de demonstração | 503 |
| Falha de armazenamento ou dados ilegíveis | 500 |

## Carregamento, sucesso e erro

- Consulta: exibe “Carregando campanhas...” e bloqueia filtros ou formulário até a resposta. Ao concluir, informa sucesso e apresenta os dados.
- Envio: exibe “Enviando campanha...”, marca o formulário com `aria-busy` e bloqueia seus controles para impedir edições durante a operação e envios duplicados.
- Sucesso: exibe confirmação somente após persistir. A edição mantém o mesmo cadastro.
- Erro de consulta: informa o problema, deixa os indicadores indisponíveis e oferece “Tentar novamente”. Não apresenta dados fictícios como se a consulta tivesse funcionado.
- Erro de envio: mantém os campos preenchidos e permite uma nova tentativa. Não grava quando a falha simulada ocorre.
- `try/catch/finally` garante que carregamento e bloqueios terminem tanto no sucesso quanto no erro.
- Fetch verifica falhas de rede, status HTTP, JSON inválido e tempo limite de oito segundos.
- Dados locais inválidos não são sobrescritos. A chave de armazenamento da Etapa 04 foi mantida.
- Quando disponível, Web Locks serializa gravações do serviço entre abas. Na ausência dessa API, a releitura e gravação síncronas reduzem conflitos, mas não oferecem a mesma garantia entre abas.

## Executar e demonstrar

Abra `src/index.html` pelo Live Server do VS Code, ou use o endereço público do GitHub Pages. Não abra por `file://`: módulos e Fetch precisam de um servidor HTTP/HTTPS. Utilize uma janela privada para fazer a demonstração sem mexer em cadastros pessoais.

1. Abra `campanhas.html`. Observe o carregamento e a listagem com sucesso. Em uma janela privada nova, Network mostra a consulta Fetch a `dados/campanhas.json`.
2. Abra Nova Campanha e aguarde a consulta inicial. Tente salvar com campos vazios ou término anterior ao início: a validação continua funcionando.
3. Preencha dados válidos e salve. Observe “Enviando campanha...” e os controles bloqueados; depois aparece a confirmação. Abra a listagem e atualize para comprovar a persistência.
4. Use “Editar campanha”, altere o período e salve. A quantidade de campanhas não deve aumentar.
5. Para demonstrar erro de consulta, abra `campanhas.html?falha=consulta`. A mensagem informa uma falha simulada. Remova `?falha=consulta` do endereço e reabra para restaurar a consulta normal. Enquanto o parâmetro estiver presente, novas tentativas continuam falhando de propósito.
6. Para demonstrar erro de envio, abra `cadastro-campanha.html?falha=envio`. Preencha e envie: o formulário deve permanecer preenchido e a lista não deve mudar. Reabra o endereço normal para cadastrar sem a simulação.
7. Para testar uma falha real de rede, em uma janela privada sem dados locais, bloqueie `dados/campanhas.json` nas ferramentas do navegador e recarregue. Desbloqueie e clique em “Tentar novamente”. Não é preciso excluir dados do navegador pessoal.
8. Confira as três páginas em desktop 1440 × 900, tablet 768 × 1024 e celular 390 × 844.

## Matriz de atendimento

| Requisito do enunciado | Implementação | Evidência |
| --- | --- | --- |
| Separação em módulos | Cinco módulos com import/export | Arquivos em `src/js/` |
| Chamadas assíncronas e Promises | Cliente e serviço com async/await; latência por Promise | `servico.js`, `servico-simulado.js` |
| Fetch API ou equivalente | Fetch HTTP do JSON e adaptador Request/Response | Consulta inicial e contrato do serviço |
| Operação de consulta | GET com lista validada | Imagens 01 e 02 |
| Operação submetida a serviço | POST de cadastro e PUT de edição ao adaptador simulado | Imagens 03 e 04; teste automatizado |
| Carregamento | Avisos, aria-busy e controles desabilitados | Imagens 01 e 03 |
| Sucesso | Consulta e cadastro confirmados após resposta | Imagens 02 e 04 |
| Erro de comunicação | Falha de consulta/envio e botão de repetição | Imagens 05 e 06 |

## Evidências e testes

Capturas em `docs/evidencias/etapa-05/`, feitas em sessão isolada do Microsoft Edge:

- `01-carregando-consulta.png`
- `02-consulta-sucesso.png`
- `03-enviando-campanha.png`
- `04-envio-sucesso.png`
- `05-erro-consulta.png`
- `06-erro-envio.png`
- `07-celular.png`

O roteiro automatizado está em `tests/etapa-05.cjs`. Para desenvolvedores com Node.js, Microsoft Edge e o pacote Playwright disponíveis, execute `node tests/etapa-05.cjs`. O teste inicia seu próprio servidor HTTP e usa um perfil de navegador isolado. Essas dependências são apenas de teste; a aplicação não precisa delas.

Verificação realizada em 05/11/2026: o roteiro passou para consulta Fetch, carregamento, cadastro e edição simulados, persistência após recarregar, validações, pesquisa, modal, envio duplicado, repetição após erro, conflito de edição, ID inexistente, dados corrompidos, falhas de rede/HTTP e de armazenamento. As três páginas passaram nos três tamanhos indicados, sem rolagem horizontal. Não houve erro JavaScript não tratado. As capturas de envio, falha e celular foram inspecionadas visualmente.

## Explicação para a apresentação

“Separei as regras, a interface e a comunicação em módulos. A página aguarda o serviço com async/await e informa quando está carregando, quando concluiu e quando falhou. A consulta inicial usa Fetch para ler um JSON. O cadastro e a edição são enviados a um serviço simulado, permitido nesta etapa, que valida e guarda os dados no navegador. Ainda não é um banco de dados remoto.”

Referências técnicas: [Módulos JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) e [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
