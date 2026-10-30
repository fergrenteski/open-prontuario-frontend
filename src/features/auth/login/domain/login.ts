import type { Perfil, Sessao, Usuario } from '../../../../shared/domain/tipos';

export interface GrupoPersonas {
  titulo: string;
  personas: Usuario[];
}

const GRUPOS: { titulo: string; perfis: Perfil[] }[] = [
  { titulo: 'Paciente', perfis: ['PACIENTE'] },
  { titulo: 'Atendimento na unidade', perfis: ['ATENDENTE', 'PROFISSIONAL'] },
  { titulo: 'Gestão', perfis: ['GESTOR'] },
];

/** Agrupa as personas do modo dev por área do sistema, sem grupos vazios. */
export function agruparPersonas(personas: Usuario[]): GrupoPersonas[] {
  return GRUPOS.map((g) => ({
    titulo: g.titulo,
    personas: personas.filter((p) => p.roles.some((r) => g.perfis.includes(r))),
  })).filter((g) => g.personas.length > 0);
}

/** "Dr. Paulo Lima" → "PL". */
export function iniciais(nome: string): string {
  const partes = nome
    .split(/\s+/)
    .filter((p) => p && !/^(dr|dra)\.?$/i.test(p));
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Sessão a partir da resposta de token; expira 1 min antes para evitar 401 no limite. */
export function criarSessao(accessToken: string, expiresInSeg: number, usuario: Usuario, agora: number): Sessao {
  return { token: accessToken, usuario, expiraEm: agora + Math.max(0, expiresInSeg - 60) * 1000 };
}
