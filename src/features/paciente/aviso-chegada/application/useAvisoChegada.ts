import { useCallback, useState } from 'react';
import { useAcao } from '../../../../shared/application/useAcao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import { normalizarSintomas, semErros, validarAviso, type AvisoChegada, type ErrosAviso } from '../domain/aviso';
import type { AvisoChegadaPort } from './ports';

export function useAvisoChegada(porta: AvisoChegadaPort, unidadeId: string) {
  const unidade = useConsulta(() => porta.buscarUnidade(unidadeId), unidadeId);
  const [errosCampos, setErrosCampos] = useState<ErrosAviso>({});

  const enviar = useCallback(
    async (aviso: AvisoChegada) => {
      const erros = validarAviso(aviso);
      setErrosCampos(erros);
      if (!semErros(erros)) return undefined;
      return porta.avisarChegada(unidadeId, { ...aviso, sintomas: normalizarSintomas(aviso.sintomas) });
    },
    [porta, unidadeId],
  );

  return { unidade, errosCampos, enviar: useAcao(enviar) };
}
