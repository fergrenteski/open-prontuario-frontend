import { useConsulta } from '../../../../shared/application/useConsulta';
import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { IndicadoresPort } from './ports';

export const INTERVALO_INDICADORES_MS = 15000;

/** Unidades do gestor + /aggregated-data da unidade escolhida (atualiza a cada 15 s). */
export function useIndicadores(porta: IndicadoresPort, unidadeId: string | null) {
  const unidades = useConsulta(() => porta.listarMinhasUnidades(), 'unidades-gestor');
  const unidadeAtual = unidadeId ?? unidades.dados?.[0]?.id ?? null;
  const agregado = useConsulta<DadosAgregados | null>(
    () => (unidadeAtual ? porta.carregar(unidadeAtual) : Promise.resolve(null)),
    `indicadores-${unidadeAtual ?? '-'}`,
    unidadeAtual ? INTERVALO_INDICADORES_MS : undefined,
  );
  return { unidades, unidadeAtual, agregado };
}
