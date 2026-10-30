import type { Atendimento, Prontuario } from '../../../../shared/domain/prontuario';

export interface ProntuarioPort {
  /** GET /prontuarios/{pacienteId}?unidadeId= — exige lotação e consentimento; grava auditoria. */
  consultar(pacienteId: string, unidadeId: string): Promise<Prontuario>;
  registrarAtendimento(pacienteId: string, dados: { unidadeId: string; descricao: string }): Promise<Atendimento>;
}
