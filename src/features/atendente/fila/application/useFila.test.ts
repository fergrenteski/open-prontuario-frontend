import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dadosAgregados, registro } from '../../../../../test/fakes/fila';
import { ErroApi } from '../../../../shared/domain/erros';
import type { FilaPort } from './ports';
import { INTERVALO_FILA_MS, useFila } from './useFila';

function portaFake(): FilaPort {
  return {
    carregarPainel: vi.fn(async () => dadosAgregados([registro({ id: 'r1', status: 'A_CAMINHO', horarioChegada: null })])),
    confirmarChegada: vi.fn(async () => {}),
    alterarPrioridade: vi.fn(async () => {}),
    iniciarAtendimento: vi.fn(async () => {}),
    encerrar: vi.fn(async () => {}),
  };
}

describe('useFila', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('consulta o /aggregated-data da unidade e repete a cada 5 s', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useFila(porta, 'upa-01'));
    await act(async () => {});
    expect(porta.carregarPainel).toHaveBeenCalledWith('upa-01');
    expect(result.current.painel.dados?.fila).toHaveLength(1);

    await act(async () => vi.advanceTimersByTime(INTERVALO_FILA_MS));
    await act(async () => vi.advanceTimersByTime(INTERVALO_FILA_MS));
    expect(porta.carregarPainel).toHaveBeenCalledTimes(3);
  });

  it('ações chamam a porta, avisam o sucesso e recarregam a fila', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useFila(porta, 'upa-01'));
    await act(async () => {});
    const r = registro({ id: 'r1', pacienteNome: 'João Pereira' });

    await act(async () => result.current.confirmarChegada(r));
    expect(porta.confirmarChegada).toHaveBeenCalledWith('r1');
    expect(result.current.mensagem).toBe('Chegada de João Pereira confirmada.');

    await act(async () => result.current.alterarPrioridade(r, 'EMERGENCIA'));
    expect(porta.alterarPrioridade).toHaveBeenCalledWith('r1', 'EMERGENCIA');
    expect(result.current.mensagem).toBe('João Pereira agora é Emergência.');

    await act(async () => result.current.iniciarAtendimento(r));
    expect(porta.iniciarAtendimento).toHaveBeenCalledWith('r1');

    await act(async () => result.current.encerrar(r, 'ATENDIDO'));
    expect(porta.encerrar).toHaveBeenCalledWith('r1', 'ATENDIDO');
    expect(result.current.mensagem).toBe('João Pereira saiu da fila (atendimento concluído).');
    expect(porta.carregarPainel).toHaveBeenCalledTimes(5);
    expect(result.current.emAndamento).toBeUndefined();
  });

  it('409 de transição inválida vira erro de ação e a fila é recarregada', async () => {
    const porta = portaFake();
    vi.mocked(porta.iniciarAtendimento).mockRejectedValue(new ErroApi({ status: 409, codigo: 'TRANSICAO_INVALIDA' }));
    const { result } = renderHook(() => useFila(porta, 'upa-01'));
    await act(async () => {});

    await act(async () => result.current.iniciarAtendimento(registro({ id: 'r1' })));
    expect(result.current.erroAcao).toMatchObject({ codigo: 'TRANSICAO_INVALIDA' });
    expect(result.current.mensagem).toBeUndefined();
    expect(porta.carregarPainel).toHaveBeenCalledTimes(2);
  });

  it('503 no polling mantém a última fila e expõe o erro', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useFila(porta, 'upa-01'));
    await act(async () => {});
    vi.mocked(porta.carregarPainel).mockRejectedValueOnce(new ErroApi({ status: 503, codigo: 'DEPENDENCIA_INDISPONIVEL' }));

    await act(async () => vi.advanceTimersByTime(INTERVALO_FILA_MS));
    expect(result.current.painel.erro).toMatchObject({ status: 503 });
    expect(result.current.painel.dados?.fila).toHaveLength(1);
  });
});
