import type { RegistroFila } from './fila';
import type { Prontuario } from './prontuario';
import type { Unidade, VisaoAgregada } from './tipos';

export type NomeFonte = 'ms-fila-sql' | 'ms-prontuario-mongo' | 'fn-visao-agregada';

export interface MetaAgregacao {
  correlationId: string;
  geradoEm: string;
  degraded: boolean;
  fontes: { nome: NomeFonte; status: 'ok' | 'falha'; duracaoMs: number }[];
  falhas: { fonte: string; motivo: string }[];
  avisos: string[];
}

/** Resposta do GET /aggregated-data do BFF (um único JSON com as três fontes). */
export interface DadosAgregados {
  unidade: Unidade | null;
  fila: RegistroFila[] | null;
  visaoAgregada: VisaoAgregada | null;
  prontuario: Prontuario | null;
  meta: MetaAgregacao;
}

const FONTES: Record<NomeFonte, { rotulo: string; tecnologia: string }> = {
  'ms-fila-sql': { rotulo: 'MS Fila', tecnologia: 'Azure SQL' },
  'ms-prontuario-mongo': { rotulo: 'MS Prontuário', tecnologia: 'MongoDB' },
  'fn-visao-agregada': { rotulo: 'Function Visão Agregada', tecnologia: 'Azure Functions' },
};

export function descreverFonte(nome: string): { rotulo: string; tecnologia: string } {
  return FONTES[nome as NomeFonte] ?? { rotulo: nome, tecnologia: '—' };
}
