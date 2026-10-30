import type { Perfil, Usuario } from './tipos';

/** Rota inicial de cada perfil após o login. */
export function rotaInicial(usuario: Usuario): string {
  const r = usuario.roles;
  if (r.includes('ATENDENTE') || r.includes('PROFISSIONAL')) return '/atendimento';
  if (r.includes('GESTOR')) return '/gestao/indicadores';
  if (r.includes('PACIENTE')) return '/paciente/unidades';
  return '/entrar';
}

export function temPerfil(usuario: Usuario | null | undefined, ...perfis: Perfil[]): boolean {
  return !!usuario && usuario.roles.some((r) => perfis.includes(r));
}

const ROTULOS: Record<Perfil, string> = {
  PACIENTE: 'Paciente',
  ATENDENTE: 'Atendente',
  PROFISSIONAL: 'Profissional de saúde',
  GESTOR: 'Gestor da unidade',
};

export function rotuloPerfil(p: Perfil): string {
  return ROTULOS[p];
}
