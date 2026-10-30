import { describe, expect, it } from 'vitest';
import { AGORA, registro } from '../../../../../test/fakes/fila';
import { acoesPermitidas, agruparFila, contarFila, nomeExibicao, ordenarFila, resultadoMotivo, rotuloMotivo, situacao } from './fila';

const agora = new Date(AGORA);

describe('ordenação da fila (OrdenacaoFilaPolicy)', () => {
  it('mais grave primeiro e, no empate, quem chegou (ou avisou) antes', () => {
    const fila = ordenarFila([
      registro({ id: 'a', prioridade: 'POUCO_URGENTE', horarioChegada: '2026-06-14T14:00:00-03:00' }),
      registro({ id: 'b', prioridade: 'EMERGENCIA', horarioChegada: '2026-06-14T14:20:00-03:00' }),
      registro({ id: 'c', prioridade: 'POUCO_URGENTE', horarioChegada: '2026-06-14T13:50:00-03:00' }),
      registro({ id: 'd', prioridade: 'POUCO_URGENTE', status: 'A_CAMINHO', horarioChegada: null, horarioAviso: '2026-06-14T13:55:00-03:00' }),
      registro({ id: 'e', status: 'FINALIZADO' }),
    ]);
    expect(fila.map((r) => r.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('agrupa em atendimento à parte e aplica filtro de situação', () => {
    const regs = [
      registro({ id: 'p', status: 'AGUARDANDO' }),
      registro({ id: 'c', status: 'A_CAMINHO', horarioChegada: null }),
      registro({ id: 'x', status: 'EM_ATENDIMENTO' }),
    ];
    expect(agruparFila(regs).emAtendimento.map((r) => r.id)).toEqual(['x']);
    expect(agruparFila(regs).espera.map((r) => r.id).sort()).toEqual(['c', 'p']);
    expect(agruparFila(regs, 'presentes').espera.map((r) => r.id)).toEqual(['p']);
    expect(agruparFila(regs, 'a-caminho').espera.map((r) => r.id)).toEqual(['c']);
    expect(contarFila(regs)).toEqual({ presentes: 1, aCaminho: 1, emAtendimento: 1 });
  });
});

describe('situação (presente × a caminho)', () => {
  it('presente mostra chegada e tempo de espera', () => {
    expect(situacao(registro({ id: '1' }), agora)).toEqual({ tipo: 'presente', rotulo: 'Presente', detalhe: 'chegou 14:10 · espera 20 min' });
  });

  it('a caminho mostra previsão, atraso ou ausência de previsão', () => {
    const base = { id: '1', status: 'A_CAMINHO' as const, horarioChegada: null, horarioAviso: '2026-06-14T14:20:00-03:00' };
    expect(situacao(registro({ ...base, tempoEstimadoChegadaMin: 25 }), agora).detalhe).toBe('chega em ~15 min');
    expect(situacao(registro({ ...base, tempoEstimadoChegadaMin: 4 }), agora).detalhe).toBe('previsto há 6 min · ainda não chegou');
    expect(situacao(registro({ ...base, tempoEstimadoChegadaMin: null }), agora)).toMatchObject({ tipo: 'a-caminho', detalhe: 'avisou 14:20 · sem previsão' });
  });

  it('em atendimento mostra o início', () => {
    const r = registro({ id: '1', status: 'EM_ATENDIMENTO', horarioInicioAtendimento: '2026-06-14T14:25:00-03:00' });
    expect(situacao(r, agora)).toEqual({ tipo: 'em-atendimento', rotulo: 'Em atendimento', detalhe: 'desde 14:25' });
    expect(situacao(registro({ id: '2', status: 'EM_ATENDIMENTO', horarioChegada: null }), agora).detalhe).toBe('desde 14:00');
  });
});

describe('ações permitidas (máquina de estados)', () => {
  it('segue as transições válidas do RegistroFila', () => {
    expect(acoesPermitidas('A_CAMINHO')).toEqual({ confirmarChegada: true, alterarPrioridade: true, iniciarAtendimento: false, encerrarCom: ['DESISTENCIA'] });
    expect(acoesPermitidas('AGUARDANDO')).toEqual({ confirmarChegada: false, alterarPrioridade: true, iniciarAtendimento: true, encerrarCom: ['ENCAMINHADO', 'DESISTENCIA'] });
    expect(acoesPermitidas('EM_ATENDIMENTO')).toEqual({ confirmarChegada: false, alterarPrioridade: false, iniciarAtendimento: false, encerrarCom: ['ATENDIDO'] });
    expect(acoesPermitidas('FINALIZADO').encerrarCom).toEqual([]);
  });

  it('rótulos de motivo e nome de exibição', () => {
    expect(rotuloMotivo('DESISTENCIA')).toBe('Desistiu');
    expect(resultadoMotivo('ATENDIDO')).toBe('atendimento concluído');
    expect(nomeExibicao(registro({ id: '9', pacienteNome: null }))).toBe('Paciente pac-9');
  });
});
