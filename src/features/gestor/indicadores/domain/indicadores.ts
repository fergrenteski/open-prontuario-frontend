// Indicadores do gestor a partir do GET /aggregated-data (RF18). Domínio puro.
import type { MetaAgregacao, NomeFonte } from '../../../../shared/domain/agregacao';
import type { RegistroFila } from '../../../../shared/domain/fila';
import { PRIORIDADES, type Prioridade } from '../../../../shared/domain/prioridade';

export const FONTES_ESPERADAS: NomeFonte[] = ['ms-fila-sql', 'ms-prontuario-mongo', 'fn-visao-agregada'];

/** Qual parte da resposta veio de qual fonte (para evidenciar a agregação). */
export const CAMPOS_POR_FONTE: Record<NomeFonte, string> = {
  'ms-fila-sql': 'unidade, fila',
  'ms-prontuario-mongo': 'prontuarioAutorizado de cada paciente',
  'fn-visao-agregada': 'presentes, a caminho, espera média, congestionamento',
};

export interface EstadoFonte {
  nome: NomeFonte;
  status: 'ok' | 'falha' | 'sem-resposta';
  duracaoMs: number | null;
  motivo?: string;
  /** 0–100, relativo à fonte mais lenta. */
  proporcao: number;
}

export function estadoDasFontes(meta: MetaAgregacao): EstadoFonte[] {
  const maior = Math.max(1, ...meta.fontes.map((f) => f.duracaoMs));
  return FONTES_ESPERADAS.map((nome) => {
    const f = meta.fontes.find((x) => x.nome === nome);
    const falha = meta.falhas.find((x) => x.fonte === nome);
    if (!f) return { nome, status: falha ? 'falha' : 'sem-resposta', duracaoMs: null, motivo: falha?.motivo, proporcao: 0 };
    return { nome, status: f.status, duracaoMs: f.duracaoMs, motivo: falha?.motivo, proporcao: Math.round((f.duracaoMs / maior) * 100) };
  });
}

/** Contagem de pacientes ativos por nível de prioridade, na ordem do protocolo. */
export function distribuicaoPrioridade(fila: RegistroFila[]): { prioridade: Prioridade; total: number }[] {
  const ativos = fila.filter((r) => r.status !== 'FINALIZADO');
  return PRIORIDADES.map((prioridade) => ({ prioridade, total: ativos.filter((r) => r.prioridade === prioridade).length }));
}

export function taxaAutorizacao(fila: RegistroFila[]): number | null {
  const conhecidos = fila.filter((r) => r.status !== 'FINALIZADO' && typeof r.prontuarioAutorizado === 'boolean');
  if (conhecidos.length === 0) return null;
  return Math.round((conhecidos.filter((r) => r.prontuarioAutorizado).length / conhecidos.length) * 100);
}
