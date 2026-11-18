// Erro com código HTTP e formato padronizado de resposta.
export class ErroApi extends Error {
  constructor(status, codigo, mensagem, detalhes = []) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

// Todas as respostas de erro da API seguem este formato.
export function corpoErro(codigo, mensagem, detalhes = []) {
  return { erro: { codigo, mensagem, detalhes } };
}
