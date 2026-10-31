// Lotações (quem trabalha em qual unidade, com qual perfil). Domínio puro.
import { rotuloPerfil } from '../../../../shared/domain/perfis';
import type { Perfil } from '../../../../shared/domain/tipos';

export interface Lotacao {
  id: string;
  usuarioId: string;
  unidadeId: string;
  perfil: Perfil;
}

/** Paciente não é lotado em unidade. */
export const PERFIS_LOTACAO: Perfil[] = ['ATENDENTE', 'PROFISSIONAL', 'GESTOR'];

export function validarLotacao(usuarioId: string, perfil: Perfil): string | null {
  const id = usuarioId.trim();
  if (id.length < 3 || id.length > 64 || /\s/.test(id)) return 'Informe o identificador do usuário (ex.: usr-prof-03), sem espaços.';
  if (!PERFIS_LOTACAO.includes(perfil)) return 'Escolha atendente, profissional ou gestor.';
  return null;
}

/** Agrupa por perfil na ordem do atendimento (balcão → clínica → gestão). */
export function ordenarLotacoes(lotacoes: Lotacao[]): Lotacao[] {
  return [...lotacoes].sort(
    (a, b) => PERFIS_LOTACAO.indexOf(a.perfil) - PERFIS_LOTACAO.indexOf(b.perfil) || a.usuarioId.localeCompare(b.usuarioId),
  );
}

export function rotuloLotacao(l: Lotacao): string {
  return `${l.usuarioId} (${rotuloPerfil(l.perfil)})`;
}
