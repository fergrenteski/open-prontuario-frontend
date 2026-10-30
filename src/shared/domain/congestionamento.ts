import type { NivelCongestionamento } from './tipos';

const ROTULOS: Record<NivelCongestionamento, string> = {
  BAIXO: 'Movimento baixo',
  MEDIO: 'Movimento moderado',
  ALTO: 'Muito cheia',
};

export function rotuloCongestionamento(n: NivelCongestionamento): string {
  return ROTULOS[n];
}

/** Quantos dos 3 segmentos do medidor acendem. */
export function segmentosCongestionamento(n: NivelCongestionamento): 1 | 2 | 3 {
  return n === 'BAIXO' ? 1 : n === 'MEDIO' ? 2 : 3;
}
