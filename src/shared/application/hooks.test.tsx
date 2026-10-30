import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessaoContext, useSessao } from './sessao';
import { useAcao } from './useAcao';
import { useConsulta } from './useConsulta';

describe('useConsulta', () => {
  afterEach(() => vi.useRealTimers());

  it('carrega, expõe dados e refaz quando a chave muda', async () => {
    const buscar = vi.fn(async (k: string) => `dados-${k}`);
    const { result, rerender } = renderHook(({ k }) => useConsulta(() => buscar(k), k), { initialProps: { k: 'a' } });

    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.dados).toBe('dados-a'));
    rerender({ k: 'b' });
    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.dados).toBe('dados-b'));
  });

  it('faz polling no intervalo e mantém os dados quando uma atualização falha', async () => {
    vi.useFakeTimers();
    let n = 0;
    const buscar = vi.fn(async () => {
      n += 1;
      if (n === 2) throw new Error('falhou');
      return n;
    });
    const { result } = renderHook(() => useConsulta(buscar, 'fila', 5000));

    await act(async () => {});
    expect(result.current.dados).toBe(1);

    await act(async () => vi.advanceTimersByTime(5000));
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(result.current.dados).toBe(1);
    expect(result.current.erro).toBeInstanceOf(Error);

    await act(async () => vi.advanceTimersByTime(5000));
    expect(result.current.dados).toBe(3);
    expect(result.current.erro).toBeUndefined();
  });

  it('para o polling ao desmontar e permite recarregar e alterar localmente', async () => {
    vi.useFakeTimers();
    const buscar = vi.fn(async () => [1]);
    const { result, unmount } = renderHook(() => useConsulta(buscar, 'k', 1000));
    await act(async () => {});

    await act(async () => result.current.recarregar());
    expect(buscar).toHaveBeenCalledTimes(2);
    act(() => result.current.alterarDados((d) => [...(d ?? []), 2]));
    expect(result.current.dados).toEqual([1, 2]);

    unmount();
    await act(async () => vi.advanceTimersByTime(5000));
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it('sem dados anteriores, erro deixa dados indefinidos', async () => {
    const { result } = renderHook(() => useConsulta(() => Promise.reject(new Error('x')), 'k'));
    await waitFor(() => expect(result.current.erro).toBeInstanceOf(Error));
    expect(result.current.dados).toBeUndefined();
    expect(result.current.carregando).toBe(false);
  });
});

describe('useAcao', () => {
  it('controla pendente, devolve o resultado e guarda o erro', async () => {
    const fn = vi.fn(async (x: number) => {
      if (x < 0) throw new Error('negativo');
      return x * 2;
    });
    const { result } = renderHook(() => useAcao(fn));

    let r: number | undefined;
    await act(async () => {
      r = await result.current.executar(2);
    });
    expect(r).toBe(4);
    expect(result.current.erro).toBeUndefined();

    await act(async () => {
      r = await result.current.executar(-1);
    });
    expect(r).toBeUndefined();
    expect(result.current.erro).toBeInstanceOf(Error);
    expect(result.current.pendente).toBe(false);

    act(() => result.current.limparErro());
    expect(result.current.erro).toBeUndefined();
  });
});

describe('useSessao', () => {
  it('exige o provider e devolve o contexto', () => {
    expect(() => renderHook(() => useSessao())).toThrow(/fora do SessaoContext/);
    const valor = { sessao: null, entrar: vi.fn(), sair: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => <SessaoContext value={valor}>{children}</SessaoContext>;
    const { result } = renderHook(() => useSessao(), { wrapper });
    expect(result.current).toBe(valor);
  });
});
