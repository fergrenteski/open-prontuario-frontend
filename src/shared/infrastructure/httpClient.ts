// ÚNICO lugar do frontend que usa `fetch` (verificado pelo teste de arquitetura e pelo ESLint).
import { ErroApi, codigoPorStatus } from '../domain/erros';

export type Consulta = Record<string, string | number | boolean | undefined | null>;

export interface HttpClient {
  get<T>(caminho: string, consulta?: Consulta): Promise<T>;
  post<T>(caminho: string, corpo?: unknown): Promise<T>;
  put<T>(caminho: string, corpo?: unknown): Promise<T>;
  patch<T>(caminho: string, corpo?: unknown): Promise<T>;
  delete<T = void>(caminho: string, consulta?: Consulta): Promise<T>;
}

export interface OpcoesHttp {
  baseUrl: string;
  obterToken: () => string | null | Promise<string | null>;
  /** Chamado em qualquer 401 (sessão expirada / token inválido). */
  aoNaoAutenticar?: () => void;
  timeoutMs?: number;
  /** Chave de assinatura do Azure API Management (gateway em nuvem). */
  chaveApim?: string;
}

function montarUrl(baseUrl: string, caminho: string, consulta?: Consulta): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(consulta ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return `${baseUrl}${caminho}${qs ? `?${qs}` : ''}`;
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  const texto = await resposta.text();
  if (!texto) return undefined;
  const tipo = resposta.headers.get('Content-Type') ?? '';
  if (tipo.includes('json')) {
    try {
      return JSON.parse(texto);
    } catch {
      return undefined;
    }
  }
  return texto;
}

export function criarHttpClient(opcoes: OpcoesHttp): HttpClient {
  async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown, consulta?: Consulta): Promise<T> {
    const token = await opcoes.obterToken();
    const headers: Record<string, string> = { Accept: 'application/json, application/problem+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opcoes.chaveApim) headers['Ocp-Apim-Subscription-Key'] = opcoes.chaveApim;
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';

    let resposta: Response;
    try {
      resposta = await fetch(montarUrl(opcoes.baseUrl, caminho, consulta), {
        method: metodo,
        headers,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
        // Em nuvem tudo escala a zero: BFF + microserviço Java acordando somam ~60 s.
        signal: AbortSignal.timeout(opcoes.timeoutMs ?? 60000),
      });
    } catch {
      throw new ErroApi({ status: 0, codigo: 'REDE_INDISPONIVEL' });
    }

    const correlationId = resposta.headers.get('X-Correlation-Id') ?? undefined;
    const dados = await lerCorpo(resposta);

    if (!resposta.ok) {
      if (resposta.status === 401) opcoes.aoNaoAutenticar?.();
      const problema = (typeof dados === 'object' && dados !== null ? dados : {}) as Record<string, unknown>;
      throw new ErroApi({
        status: resposta.status,
        codigo: typeof problema.codigo === 'string' ? problema.codigo : codigoPorStatus(resposta.status),
        titulo: typeof problema.title === 'string' ? problema.title : undefined,
        detalhe: typeof problema.detail === 'string' ? problema.detail : undefined,
        correlationId: typeof problema.correlationId === 'string' ? problema.correlationId : correlationId,
      });
    }
    return dados as T;
  }

  return {
    get: (c, q) => requisitar('GET', c, undefined, q),
    post: (c, b) => requisitar('POST', c, b),
    put: (c, b) => requisitar('PUT', c, b),
    patch: (c, b) => requisitar('PATCH', c, b),
    delete: (c, q) => requisitar('DELETE', c, undefined, q),
  };
}

/** Codifica um segmento de caminho vindo de dado (ids). */
export const seg = encodeURIComponent;
