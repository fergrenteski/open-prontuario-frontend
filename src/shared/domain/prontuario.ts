export interface Atendimento {
  id: string;
  prontuarioId: string;
  unidadeId: string;
  descricao: string;
  data: string;
}

export interface Prontuario {
  id: string;
  pacienteId: string;
  alergias: string[];
  medicacoes: string[];
  historico: Atendimento[];
}

/** Histórico do mais recente para o mais antigo (sem alterar o original). */
export function historicoRecente(historico: Atendimento[]): Atendimento[] {
  return [...historico].sort((a, b) => Date.parse(b.data) - Date.parse(a.data));
}
