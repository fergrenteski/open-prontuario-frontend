import { beforeEach, describe, expect, it } from 'vitest';
import { sessaoStorage } from './sessaoStorage';

const sessao = { token: 't', usuario: { id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE' as const] }, expiraEm: 2000 };

describe('sessaoStorage', () => {
  beforeEach(() => sessionStorage.clear());

  it('salva, carrega e limpa', () => {
    sessaoStorage.salvar(sessao);
    expect(sessaoStorage.carregar(1000)).toEqual(sessao);
    sessaoStorage.limpar();
    expect(sessaoStorage.carregar(1000)).toBeNull();
  });

  it('descarta sessão expirada e conteúdo inválido', () => {
    sessaoStorage.salvar(sessao);
    expect(sessaoStorage.carregar(3000)).toBeNull();
    sessionStorage.setItem('open-prontuario.sessao', '{x');
    expect(sessaoStorage.carregar(1000)).toBeNull();
  });
});
