import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErroApi, ErroValidacao } from '../../../../shared/domain/erros';
import type { Prontuario } from '../../../../shared/domain/prontuario';
import type { ProntuarioPort } from './ports';
import { useProntuario } from './useProntuario';

const pront: Prontuario = { id: 'pront-001', pacienteId: 'pac-101', alergias: ['dipirona'], medicacoes: [], historico: [] };

function portaFake(over: Partial<ProntuarioPort> = {}): ProntuarioPort {
  return {
    consultar: vi.fn(async () => pront),
    registrarAtendimento: vi.fn(async (_p, d) => ({ id: 'atd-1', prontuarioId: 'pront-001', data: '2026-06-14T15:00:00-03:00', ...d })),
    ...over,
  };
}

describe('useProntuario', () => {
  it('consulta uma única vez com a unidade (acesso auditado)', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useProntuario(porta, 'pac-101', 'upa-01'));
    await waitFor(() => expect(result.current.prontuario.dados).toEqual(pront));
    expect(porta.consultar).toHaveBeenCalledOnce();
    expect(porta.consultar).toHaveBeenCalledWith('pac-101', 'upa-01');
    expect(result.current.bloqueio).toBeNull();
  });

  it('403 CONSENTIMENTO_AUSENTE vira bloqueio sem dados', async () => {
    const porta = portaFake({ consultar: vi.fn().mockRejectedValue(new ErroApi({ status: 403, codigo: 'CONSENTIMENTO_AUSENTE' })) });
    const { result } = renderHook(() => useProntuario(porta, 'pac-101', 'upa-01'));
    await waitFor(() => expect(result.current.bloqueio).toBe('sem-consentimento'));
    expect(result.current.prontuario.dados).toBeUndefined();
  });

  it('503 (auditoria indisponível) bloqueia por segurança', async () => {
    const porta = portaFake({ consultar: vi.fn().mockRejectedValue(new ErroApi({ status: 503, codigo: 'DEPENDENCIA_INDISPONIVEL' })) });
    const { result } = renderHook(() => useProntuario(porta, 'pac-101', 'upa-01'));
    await waitFor(() => expect(result.current.bloqueio).toBe('auditoria-indisponivel'));
  });

  it('registra atendimento e acrescenta ao histórico sem reconsultar', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useProntuario(porta, 'pac-101', 'upa-01'));
    await waitFor(() => expect(result.current.prontuario.dados).toBeDefined());

    await act(async () => {
      await result.current.registrar.executar('  Paciente estável.  ');
    });
    expect(porta.registrarAtendimento).toHaveBeenCalledWith('pac-101', { unidadeId: 'upa-01', descricao: 'Paciente estável.' });
    expect(result.current.prontuario.dados?.historico).toHaveLength(1);
    expect(porta.consultar).toHaveBeenCalledOnce();
  });

  it('descrição inválida não chama a porta', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useProntuario(porta, 'pac-101', 'upa-01'));
    await waitFor(() => expect(result.current.prontuario.dados).toBeDefined());
    await act(async () => {
      await result.current.registrar.executar('a');
    });
    expect(result.current.registrar.erro).toBeInstanceOf(ErroValidacao);
    expect(porta.registrarAtendimento).not.toHaveBeenCalled();
  });
});
