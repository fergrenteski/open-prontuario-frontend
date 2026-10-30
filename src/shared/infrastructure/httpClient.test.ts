import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErroApi } from '../domain/erros';
import { criarHttpClient } from './httpClient';

function resposta(status: number, corpo?: unknown, headers: Record<string, string> = {}) {
  const texto = corpo === undefined ? '' : typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return new Response(status === 204 ? null : texto, { status, headers });
}

describe('httpClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('anexa Authorization Bearer, monta a URL com query e devolve o JSON', async () => {
    const fetchFake = vi.fn().mockResolvedValue(resposta(200, [{ id: 'upa-01' }], { 'Content-Type': 'application/json' }));
    vi.stubGlobal('fetch', fetchFake);
    const http = criarHttpClient({ baseUrl: 'https://gw.exemplo/api', obterToken: () => 'tok-123' });

    const dados = await http.get('/unidades/proximas', { latitude: -25.4, longitude: -49.2, raioKm: undefined });

    expect(dados).toEqual([{ id: 'upa-01' }]);
    const [url, init] = fetchFake.mock.calls[0];
    expect(url).toBe('https://gw.exemplo/api/unidades/proximas?latitude=-25.4&longitude=-49.2');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer tok-123');
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('envia corpo JSON em POST/PUT/PATCH e não envia Authorization sem token', async () => {
    const fetchFake = vi.fn().mockImplementation(() => Promise.resolve(resposta(201, { ok: true }, { 'Content-Type': 'application/json' })));
    vi.stubGlobal('fetch', fetchFake);
    const http = criarHttpClient({ baseUrl: '/api', obterToken: async () => null });

    await http.post('/consentimentos', { unidadeId: 'upa-01' });
    await http.put('/consentimentos/c1', { validadeDias: 5 });
    await http.patch('/fila/r1/prioridade', { prioridade: 'URGENTE' });

    expect(fetchFake.mock.calls.map((c) => c[1].method)).toEqual(['POST', 'PUT', 'PATCH']);
    const init = fetchFake.mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ unidadeId: 'upa-01' });
  });

  it('devolve undefined em 204 (DELETE com query)', async () => {
    const fetchFake = vi.fn().mockResolvedValue(resposta(204));
    vi.stubGlobal('fetch', fetchFake);
    const http = criarHttpClient({ baseUrl: '/api', obterToken: () => 't' });

    await expect(http.delete('/fila/r1', { motivo: 'ATENDIDO' })).resolves.toBeUndefined();
    expect(fetchFake.mock.calls[0][0]).toBe('/api/fila/r1?motivo=ATENDIDO');
  });

  it('converte problem+json em ErroApi com codigo e correlationId', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        resposta(
          403,
          { title: 'Consentimento inválido', status: 403, detail: 'sem consentimento', codigo: 'CONSENTIMENTO_AUSENTE', correlationId: 'corr-1' },
          { 'Content-Type': 'application/problem+json' },
        ),
      ),
    );
    const http = criarHttpClient({ baseUrl: '/api', obterToken: () => 't' });

    const erro = await http.get('/prontuarios/pac-101').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro).toMatchObject({ status: 403, codigo: 'CONSENTIMENTO_AUSENTE', correlationId: 'corr-1', detalhe: 'sem consentimento', message: 'Consentimento inválido' });
  });

  it('usa o header X-Correlation-Id e o status quando o corpo não é problem+json', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(503, 'Service Unavailable', { 'Content-Type': 'text/plain', 'X-Correlation-Id': 'corr-2' })));
    const http = criarHttpClient({ baseUrl: '/api', obterToken: () => 't' });

    await expect(http.get('/x')).rejects.toMatchObject({ status: 503, codigo: 'DEPENDENCIA_INDISPONIVEL', correlationId: 'corr-2' });
  });

  it('tolera JSON quebrado e avisa sessão expirada em 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(401, '{quebrado', { 'Content-Type': 'application/json' })));
    const aoNaoAutenticar = vi.fn();
    const http = criarHttpClient({ baseUrl: '/api', obterToken: () => 't', aoNaoAutenticar });

    await expect(http.get('/auth/me')).rejects.toMatchObject({ status: 401, codigo: 'NAO_AUTENTICADO' });
    expect(aoNaoAutenticar).toHaveBeenCalledOnce();
  });

  it('falha de rede vira REDE_INDISPONIVEL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const http = criarHttpClient({ baseUrl: '/api', obterToken: () => 't' });

    await expect(http.get('/x')).rejects.toMatchObject({ status: 0, codigo: 'REDE_INDISPONIVEL' });
  });
});
