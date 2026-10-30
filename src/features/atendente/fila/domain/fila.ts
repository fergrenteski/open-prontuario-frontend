// Regras de apresentação da fila (RF08/RF09). Domínio puro.
import { formatarHora, minutosEntre } from '../../../../shared/domain/datas';
import type { RegistroFila } from '../../../../shared/domain/fila';
import { gravidade } from '../../../../shared/domain/prioridade';
import type { MotivoSaida, StatusFila } from '../../../../shared/domain/tipos';

export type { RegistroFila };

/** Horário de desempate: chegada (presente) ou aviso (a caminho). */
export function horarioReferencia(r: RegistroFila): string {
  return r.horarioChegada ?? r.horarioAviso;
}

/**
 * OrdenacaoFilaPolicy (CONVENCOES §6): mais grave primeiro; empate pelo horário de referência,
 * mais antigo primeiro. FINALIZADO não aparece.
 */
export function ordenarFila(registros: RegistroFila[]): RegistroFila[] {
  return registros
    .filter((r) => r.status !== 'FINALIZADO')
    .sort(
      (a, b) =>
        gravidade(a.prioridade) - gravidade(b.prioridade) ||
        Date.parse(horarioReferencia(a)) - Date.parse(horarioReferencia(b)),
    );
}

export interface FilaAgrupada {
  emAtendimento: RegistroFila[];
  espera: RegistroFila[];
}

export type FiltroFila = 'todos' | 'presentes' | 'a-caminho';

/** Separa quem já está em atendimento da fila de espera, aplicando o filtro de situação. */
export function agruparFila(registros: RegistroFila[], filtro: FiltroFila = 'todos'): FilaAgrupada {
  const ordenada = ordenarFila(registros);
  const espera = ordenada.filter((r) => {
    if (r.status === 'EM_ATENDIMENTO') return false;
    if (filtro === 'presentes') return r.status === 'AGUARDANDO';
    if (filtro === 'a-caminho') return r.status === 'A_CAMINHO';
    return true;
  });
  return { emAtendimento: ordenada.filter((r) => r.status === 'EM_ATENDIMENTO'), espera };
}

export function contarFila(registros: RegistroFila[]) {
  return {
    presentes: registros.filter((r) => r.status === 'AGUARDANDO').length,
    aCaminho: registros.filter((r) => r.status === 'A_CAMINHO').length,
    emAtendimento: registros.filter((r) => r.status === 'EM_ATENDIMENTO').length,
  };
}

export type TipoSituacao = 'presente' | 'a-caminho' | 'em-atendimento';

export interface Situacao {
  tipo: TipoSituacao;
  rotulo: string;
  detalhe: string;
}

/** RF09: texto de "presente" × "a caminho" com o tempo relevante para o balcão. */
export function situacao(r: RegistroFila, agora: Date): Situacao {
  if (r.status === 'EM_ATENDIMENTO') {
    const desde = r.horarioInicioAtendimento ?? r.horarioChegada ?? r.horarioAviso;
    return { tipo: 'em-atendimento', rotulo: 'Em atendimento', detalhe: `desde ${formatarHora(desde)}` };
  }
  if (r.status === 'AGUARDANDO') {
    const chegada = r.horarioChegada ?? r.horarioAviso;
    return {
      tipo: 'presente',
      rotulo: 'Presente',
      detalhe: `chegou ${formatarHora(chegada)} · espera ${minutosEntre(chegada, agora)} min`,
    };
  }
  const estimado = r.tempoEstimadoChegadaMin;
  if (estimado === null || estimado === undefined) {
    return { tipo: 'a-caminho', rotulo: 'A caminho', detalhe: `avisou ${formatarHora(r.horarioAviso)} · sem previsão` };
  }
  const falta = estimado - minutosEntre(r.horarioAviso, agora);
  return {
    tipo: 'a-caminho',
    rotulo: 'A caminho',
    detalhe: falta > 0 ? `chega em ~${falta} min` : `previsto há ${-falta} min · ainda não chegou`,
  };
}

export interface AcoesPermitidas {
  confirmarChegada: boolean;
  alterarPrioridade: boolean;
  iniciarAtendimento: boolean;
  encerrarCom: MotivoSaida[];
}

/** Máquina de estados do RegistroFila (CONVENCOES §6) vista pelo painel. */
export function acoesPermitidas(status: StatusFila): AcoesPermitidas {
  return {
    confirmarChegada: status === 'A_CAMINHO',
    alterarPrioridade: status === 'A_CAMINHO' || status === 'AGUARDANDO',
    iniciarAtendimento: status === 'AGUARDANDO',
    encerrarCom:
      status === 'A_CAMINHO'
        ? ['DESISTENCIA']
        : status === 'AGUARDANDO'
          ? ['ENCAMINHADO', 'DESISTENCIA']
          : status === 'EM_ATENDIMENTO'
            ? ['ATENDIDO']
            : [],
  };
}

const ROTULO_MOTIVO: Record<MotivoSaida, string> = {
  ATENDIDO: 'Encerrar: atendido',
  ENCAMINHADO: 'Encaminhado',
  DESISTENCIA: 'Desistiu',
};

export function rotuloMotivo(m: MotivoSaida): string {
  return ROTULO_MOTIVO[m];
}

const RESULTADO_MOTIVO: Record<MotivoSaida, string> = {
  ATENDIDO: 'atendimento concluído',
  ENCAMINHADO: 'encaminhado',
  DESISTENCIA: 'desistência',
};

export function resultadoMotivo(m: MotivoSaida): string {
  return RESULTADO_MOTIVO[m];
}

export function nomeExibicao(r: RegistroFila): string {
  return r.pacienteNome?.trim() || `Paciente ${r.pacienteId}`;
}
