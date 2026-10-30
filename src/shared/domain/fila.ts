import type { Prioridade } from './prioridade';
import type { MotivoSaida, StatusFila } from './tipos';

/** RegistroFila como devolvido pelo BFF (fila + prontuarioAutorizado do MS Prontuário). */
export interface RegistroFila {
  id: string;
  pacienteId: string;
  pacienteNome?: string | null;
  unidadeId: string;
  prioridade: Prioridade;
  status: StatusFila;
  sintomas: string[];
  tempoEstimadoChegadaMin?: number | null;
  horarioAviso: string;
  horarioChegada?: string | null;
  horarioInicioAtendimento?: string | null;
  motivoSaida?: MotivoSaida | null;
  /** null = MS Prontuário não respondeu (degradação). */
  prontuarioAutorizado?: boolean | null;
}
