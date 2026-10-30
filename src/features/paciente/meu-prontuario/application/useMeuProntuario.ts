import { useConsulta } from '../../../../shared/application/useConsulta';
import { acessosRecentes } from '../domain/meuProntuario';
import type { MeuProntuarioPort } from './ports';

/** Prontuário próprio (sem consentimento, sem auditoria de terceiros) + histórico de acessos. */
export function useMeuProntuario(porta: MeuProntuarioPort) {
  return useConsulta(async () => {
    const prontuario = await porta.consultarMeu();
    const [acessos, unidades] = await Promise.all([porta.listarAcessos(prontuario.id), porta.listarUnidades()]);
    return { prontuario, acessos: acessosRecentes(acessos), unidades };
  }, 'meu-prontuario');
}
