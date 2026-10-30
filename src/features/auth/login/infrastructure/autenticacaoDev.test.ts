import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../../../../shared/infrastructure/httpClient';
import { criarAutenticacaoDev } from './autenticacaoDev';

describe('autenticacaoDev', () => {
  it('chama /auth/personas e /auth/dev-token do BFF', async () => {
    const usuario = { id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE'] };
    const http = {
      get: vi.fn(async () => [usuario]),
      post: vi.fn(async () => ({ accessToken: 'jwt', expiresIn: 3600, usuario })),
    } as unknown as HttpClient;
    const porta = criarAutenticacaoDev(http);

    expect(await porta.listarPersonas()).toEqual([usuario]);
    const sessao = await porta.entrar('pac-101');
    expect(http.post).toHaveBeenCalledWith('/auth/dev-token', { usuarioId: 'pac-101' });
    expect(sessao.token).toBe('jwt');
    expect(sessao.expiraEm).toBeGreaterThan(Date.now());
  });
});
