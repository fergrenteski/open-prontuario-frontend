// Erro tipado vindo do BFF (problem+json, RFC 9457) e mensagens amigáveis por `codigo` (CONVENCOES §4).

export type CodigoErro =
  | 'REQUISICAO_INVALIDA'
  | 'NAO_AUTENTICADO'
  | 'SEM_PERMISSAO'
  | 'CONSENTIMENTO_AUSENTE'
  | 'RECURSO_NAO_ENCONTRADO'
  | 'TRANSICAO_INVALIDA'
  | 'REGISTRO_ATIVO_DUPLICADO'
  | 'CONSENTIMENTO_DUPLICADO'
  | 'DEPENDENCIA_INDISPONIVEL'
  | 'AGREGACAO_FALHOU'
  | 'REDE_INDISPONIVEL'
  | 'ERRO_DESCONHECIDO';

export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: CodigoErro | string;
  readonly detalhe?: string;
  readonly correlationId?: string;

  constructor(dados: { status: number; codigo: string; titulo?: string; detalhe?: string; correlationId?: string }) {
    super(dados.titulo ?? dados.codigo);
    this.name = 'ErroApi';
    this.status = dados.status;
    this.codigo = dados.codigo;
    this.detalhe = dados.detalhe;
    this.correlationId = dados.correlationId;
  }
}

/** Dado recusado antes de sair do navegador; a mensagem já é a que o usuário deve ler. */
export class ErroValidacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacao';
  }
}

const MENSAGENS: Record<CodigoErro, string> = {
  REQUISICAO_INVALIDA: 'Alguns dados não foram aceitos. Revise os campos e tente de novo.',
  NAO_AUTENTICADO: 'Sua sessão terminou. Entre novamente para continuar.',
  SEM_PERMISSAO: 'Seu perfil não tem acesso a esta ação ou você não está lotado nesta unidade.',
  CONSENTIMENTO_AUSENTE:
    'O paciente não autorizou o compartilhamento do prontuário com esta unidade, ou a autorização expirou ou foi revogada.',
  RECURSO_NAO_ENCONTRADO: 'Não encontramos o que você procurou. Ele pode ter sido removido.',
  TRANSICAO_INVALIDA: 'Essa ação não vale para a situação atual do paciente. A fila foi atualizada.',
  REGISTRO_ATIVO_DUPLICADO: 'Você já está na fila desta unidade. Não é preciso avisar de novo.',
  CONSENTIMENTO_DUPLICADO: 'Já existe uma autorização válida para esta unidade. Use “Renovar” para estender o prazo.',
  DEPENDENCIA_INDISPONIVEL: 'Um serviço do sistema está fora do ar agora. Nada foi exibido por segurança; tente em instantes.',
  AGREGACAO_FALHOU: 'Nenhuma fonte de dados respondeu. Tente atualizar em instantes.',
  REDE_INDISPONIVEL: 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
  ERRO_DESCONHECIDO: 'Algo deu errado do nosso lado. Tente de novo em instantes.',
};

export function codigoPorStatus(status: number): CodigoErro {
  if (status === 400) return 'REQUISICAO_INVALIDA';
  if (status === 401) return 'NAO_AUTENTICADO';
  if (status === 403) return 'SEM_PERMISSAO';
  if (status === 404) return 'RECURSO_NAO_ENCONTRADO';
  if (status === 409) return 'TRANSICAO_INVALIDA';
  if (status === 502) return 'AGREGACAO_FALHOU';
  if (status === 503 || status === 504) return 'DEPENDENCIA_INDISPONIVEL';
  return 'ERRO_DESCONHECIDO';
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroValidacao) return erro.message;
  if (erro instanceof ErroApi) {
    return MENSAGENS[erro.codigo as CodigoErro] ?? MENSAGENS[codigoPorStatus(erro.status)];
  }
  return MENSAGENS.ERRO_DESCONHECIDO;
}

export function temCodigo(erro: unknown, codigo: CodigoErro): boolean {
  return erro instanceof ErroApi && erro.codigo === codigo;
}
