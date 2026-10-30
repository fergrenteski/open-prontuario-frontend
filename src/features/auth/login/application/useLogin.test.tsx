import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sessaoDe, wrapperSessao } from '../../../../../test/utils';
import { ErroApi } from '../../../../shared/domain/erros';
import type { AutenticacaoPort } from './ports';
import { useLogin } from './useLogin';

function portaFake(over: Partial<AutenticacaoPort> = {}): AutenticacaoPort {
  return {
    modo: 'dev',
    listarPersonas: vi.fn(async () => [{ id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE' as const] }]),
    entrar: vi.fn(async () => sessaoDe('pac-101', 'João Pereira', 'PACIENTE')),
    ...over,
  };
}

describe('useLogin', () => {
  it('lista personas, guarda a sessão e devolve a rota do perfil', async () => {
    const porta = portaFake();
    const { Wrapper, valor } = wrapperSessao();
    const { result } = renderHook(() => useLogin(porta), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.personas.dados).toHaveLength(1));
    let rota: string | undefined;
    await act(async () => {
      rota = await result.current.entrar.executar('pac-101');
    });

    expect(porta.entrar).toHaveBeenCalledWith('pac-101');
    expect(valor.entrar).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok' }));
    expect(rota).toBe('/paciente/unidades');
  });

  it('modo entra não busca personas', async () => {
    const porta = portaFake({ modo: 'entra' });
    const { Wrapper } = wrapperSessao();
    const { result } = renderHook(() => useLogin(porta), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.personas.dados).toEqual([]));
    expect(porta.listarPersonas).not.toHaveBeenCalled();
  });

  it('erro de login fica disponível e não guarda sessão', async () => {
    const porta = portaFake({ entrar: vi.fn().mockRejectedValue(new ErroApi({ status: 404, codigo: 'RECURSO_NAO_ENCONTRADO' })) });
    const { Wrapper, valor } = wrapperSessao();
    const { result } = renderHook(() => useLogin(porta), { wrapper: Wrapper });

    await act(async () => {
      await result.current.entrar.executar('x');
    });
    expect(result.current.entrar.erro).toBeInstanceOf(ErroApi);
    expect(valor.entrar).not.toHaveBeenCalled();
  });
});
