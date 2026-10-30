import { useConsulta } from '../../../../shared/application/useConsulta';
import { CENTRO_CURITIBA, RAIO_PADRAO_KM, ordenarPorDistancia, type Coordenadas } from '../domain/unidadesProximas';
import type { LocalizacaoPort, UnidadesProximasPort } from './ports';

/** Pega a localização (ou o centro de Curitiba) e lista as unidades por distância. */
export function useUnidadesProximas(porta: UnidadesProximasPort, localizacao: LocalizacaoPort) {
  return useConsulta(async () => {
    let origem: Coordenadas = CENTRO_CURITIBA;
    let localizacaoReal = true;
    try {
      origem = await localizacao.obterPosicao();
    } catch {
      localizacaoReal = false;
    }
    const unidades = ordenarPorDistancia(await porta.listarProximas(origem, RAIO_PADRAO_KM));
    return { origem, localizacaoReal, unidades };
  }, 'unidades-proximas');
}
