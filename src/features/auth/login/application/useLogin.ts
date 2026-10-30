import { useCallback } from 'react';
import { rotaInicial } from '../../../../shared/domain/perfis';
import type { Usuario } from '../../../../shared/domain/tipos';
import { useAcao } from '../../../../shared/application/useAcao';
import { useSessao } from '../../../../shared/application/sessao';
import { useConsulta } from '../../../../shared/application/useConsulta';
import type { AutenticacaoPort } from './ports';

const SEM_PERSONAS: Usuario[] = [];

/** Caso de uso de login: carrega personas (modo dev), autentica e diz para onde ir. */
export function useLogin(porta: AutenticacaoPort) {
  const { entrar: guardarSessao } = useSessao();
  const personas = useConsulta(
    () => (porta.modo === 'dev' ? porta.listarPersonas() : Promise.resolve(SEM_PERSONAS)),
    `personas-${porta.modo}`,
  );

  const autenticar = useCallback(
    async (usuarioId?: string) => {
      const sessao = await porta.entrar(usuarioId);
      guardarSessao(sessao);
      return rotaInicial(sessao.usuario);
    },
    [porta, guardarSessao],
  );

  return { personas, entrar: useAcao(autenticar) };
}
