import type { DadosAgregados } from '../../src/shared/domain/agregacao';
import type { RegistroFila } from '../../src/shared/domain/fila';

export const AGORA = '2026-06-14T14:30:00-03:00';

export function registro(over: Partial<RegistroFila> & Pick<RegistroFila, 'id'>): RegistroFila {
  return {
    pacienteId: `pac-${over.id}`,
    pacienteNome: `Paciente ${over.id}`,
    unidadeId: 'upa-01',
    prioridade: 'NAO_URGENTE',
    status: 'AGUARDANDO',
    sintomas: ['febre'],
    horarioAviso: '2026-06-14T14:00:00-03:00',
    horarioChegada: '2026-06-14T14:10:00-03:00',
    prontuarioAutorizado: false,
    ...over,
  };
}

export function dadosAgregados(fila: RegistroFila[], over: Partial<DadosAgregados> = {}): DadosAgregados {
  return {
    unidade: { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA', latitude: -25.3866, longitude: -49.2346 },
    fila,
    visaoAgregada: { unidadeId: 'upa-01', totalPresente: 2, totalACaminho: 1, tempoMedioEsperaMin: 25, nivelCongestionamento: 'MEDIO' },
    prontuario: null,
    meta: {
      correlationId: 'corr-1',
      geradoEm: AGORA,
      degraded: false,
      fontes: [
        { nome: 'ms-fila-sql', status: 'ok', duracaoMs: 42 },
        { nome: 'ms-prontuario-mongo', status: 'ok', duracaoMs: 35 },
        { nome: 'fn-visao-agregada', status: 'ok', duracaoMs: 120 },
      ],
      falhas: [],
      avisos: [],
    },
    ...over,
  };
}
