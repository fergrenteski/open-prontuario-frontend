import type { Coordenadas, UnidadeProxima } from '../domain/unidadesProximas';

export interface UnidadesProximasPort {
  listarProximas(origem: Coordenadas, raioKm: number): Promise<UnidadeProxima[]>;
}

/** Localização do dispositivo (rejeita se negada/indisponível). */
export interface LocalizacaoPort {
  obterPosicao(): Promise<Coordenadas>;
}
