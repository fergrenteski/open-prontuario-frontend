// RF02: unidades próximas com distância e indicadores da visão agregada. Domínio puro.
import type { Unidade, VisaoAgregada } from '../../../../shared/domain/tipos';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/** Fallback quando o navegador não fornece a localização: Praça Tiradentes, centro de Curitiba. */
export const CENTRO_CURITIBA: Coordenadas = { latitude: -25.4284, longitude: -49.2733 };
export const RAIO_PADRAO_KM = 20;

export interface UnidadeProxima extends Unidade {
  distanciaKm: number;
  visaoAgregada?: VisaoAgregada | null;
}

export function ordenarPorDistancia(unidades: UnidadeProxima[]): UnidadeProxima[] {
  return [...unidades].sort((a, b) => a.distanciaKm - b.distanciaKm);
}

const km = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 0,85 → "850 m"; 3,24 → "3,2 km". */
export function formatarDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) return `${Math.round((distanciaKm * 1000) / 10) * 10} m`;
  return `${km.format(distanciaKm)} km`;
}

/** Resumo em linguagem simples para o paciente decidir para onde ir. */
export function resumoMovimento(v: VisaoAgregada | null | undefined): string {
  if (!v) return 'Movimento indisponível agora';
  const pessoas = v.totalPresente + v.totalACaminho;
  const espera = v.tempoMedioEsperaMin > 0 ? ` · espera média de ${v.tempoMedioEsperaMin} min` : '';
  return `${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'} na fila${espera}`;
}
