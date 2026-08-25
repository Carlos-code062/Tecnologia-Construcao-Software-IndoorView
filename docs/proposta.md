1. Nome da aplicação

IndoorView — Sistema de Gerenciamento de Mídia Indoor


2. Descrição do problema que pretende resolver

Profissionais e empresas que trabalham com mídia indoor precisam controlar anúncios exibidos em televisões instaladas em diferentes estabelecimentos.

Quando esse controle é realizado por planilhas, mensagens ou anotações, pode ser difícil saber quais anúncios estão ativos, onde cada campanha está sendo exibida e quando o período de divulgação começa ou termina.

O IndoorView será uma aplicação Web para centralizar essas informações e facilitar o gerenciamento das campanhas.


3. Público-alvo

O sistema será destinado principalmente a:

- empresas de mídia indoor;
- agências de publicidade;
- profissionais que comercializam anúncios em televisões instaladas em estabelecimentos.


4. Objetivo principal da aplicação

Criar uma aplicação Web que permita organizar anunciantes, campanhas publicitárias e os locais onde os anúncios serão exibidos.

O sistema deverá facilitar a consulta das campanhas e identificar quais estão ativas, programadas ou encerradas.


5. Funcionalidades

A aplicação deverá possuir as seguintes funcionalidades principais:

1. Cadastrar anunciantes.
2. Cadastrar estabelecimentos e suas telas.
3. Criar campanhas publicitárias.
4. Associar uma campanha a uma ou mais telas.
5. Definir data de início e término da campanha.
6. Consultar campanhas por status: futura, ativa ou encerrada.
7. Pesquisar campanhas por anunciante.


6. Entidades ou conceitos importantes

Anunciante

Representa a empresa ou pessoa que deseja divulgar um anúncio.

Informações principais:

- nome;
- telefone;
- e-mail.

Campanha

Representa o anúncio que será divulgado.

Informações principais:

- nome da campanha;
- anunciante;
- descrição;
- data de início;
- data de término.

Estabelecimento

Representa o local onde uma ou mais telas estão instaladas.

Informações principais:

- nome do estabelecimento;
- endereço;
- observações.

Tela

Representa a televisão utilizada para exibição dos anúncios.

Cada tela estará vinculada a um estabelecimento.


7. Telas ou interfaces

Tela inicial

Apresentará um resumo do sistema, mostrando:

- quantidade de anunciantes;
- quantidade de campanhas;
- campanhas ativas;
- quantidade de telas cadastradas.

Tela de anunciantes

Permitirá:

- cadastrar anunciante;
- visualizar anunciantes cadastrados;
- editar informações;
- pesquisar anunciantes.

Tela de campanhas

Permitirá:

- criar campanha;
- selecionar o anunciante;
- informar data inicial e final;
- escolher as telas;
- consultar campanhas;
- visualizar o status da campanha.

Tela de estabelecimentos e telas

Permitirá cadastrar estabelecimentos e registrar as telas existentes em cada local.


8. Operações da aplicação

As principais operações serão:

1. Cadastrar anunciante.
2. Editar anunciante.
3. Cadastrar estabelecimento.
4. Cadastrar tela.
5. Criar campanha.
6. Associar campanha a uma tela.
7. Alterar informações de uma campanha.
8. Consultar campanhas ativas.
9. Pesquisar campanhas por anunciante.
10. Encerrar ou excluir uma campanha.


9. Tecnologias utilizadas no cliente

Serão utilizadas inicialmente:

- HTML5;
- CSS3;
- JavaScript.


10. Tecnologias utilizadas no servidor

Serão utilizadas:

- Node.js;
- Express.js.


11. Tecnologia de persistência

Será utilizado o banco de dados SQLite.

O banco armazenará os dados dos anunciantes, campanhas, estabelecimentos e telas.


12. Diagrama da visão geral da solução

![Diagrama da solução](https://github.com/user-attachments/assets/3a49df35-cad0-42a9-a997-eddfc69b8b89)

Regra principal do sistema

Uma campanha será associada a um anunciante, possuirá uma data de início e uma data de término e poderá ser exibida em uma ou mais telas.

Com base nas datas, o sistema poderá informar se a campanha está:

- Futura: ainda não chegou à data de início.
- Ativa: está dentro do período de exibição.
- Encerrada: a data de término já passou.


Escopo do projeto

O objetivo do projeto é criar um sistema simples de gerenciamento.

O IndoorView não realizará transmissão de vídeos diretamente para televisões e não possuirá pagamentos on-line ou aplicativo para Smart TV.

O foco será o gerenciamento das campanhas, anunciantes, estabelecimentos e telas.
