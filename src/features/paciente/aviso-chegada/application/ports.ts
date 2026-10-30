import type { Unidade } from '../../../../shared/domain/tipos';
import type { AvisoChegada, RegistroAviso } from '../domain/aviso';

export interface AvisoChegadaPort {
  buscarUnidade(unidadeId: string): Promise<Unidade>;
  /** POST /fila/{unidadeId}/aviso-chegada (o BFF também concede o consentimento, se pedido). */
  avisarChegada(unidadeId: string, aviso: AvisoChegada): Promise<RegistroAviso>;
}
