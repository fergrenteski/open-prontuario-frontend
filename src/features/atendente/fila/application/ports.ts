import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { Prioridade } from '../../../../shared/domain/prioridade';
import type { MotivoSaida } from '../../../../shared/domain/tipos';

export interface FilaPort {
  /** GET /aggregated-data?unidadeId= (MS Fila + MS Prontuário + Function). */
  carregarPainel(unidadeId: string): Promise<DadosAgregados>;
  confirmarChegada(registroId: string): Promise<void>;
  alterarPrioridade(registroId: string, prioridade: Prioridade): Promise<void>;
  iniciarAtendimento(registroId: string): Promise<void>;
  encerrar(registroId: string, motivo: MotivoSaida): Promise<void>;
}
