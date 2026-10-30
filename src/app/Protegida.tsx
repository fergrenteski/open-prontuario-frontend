import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSessao } from '../shared/application/sessao';
import { rotaInicial, temPerfil } from '../shared/domain/perfis';
import type { Perfil } from '../shared/domain/tipos';

/** Exige sessão e um dos perfis; caso contrário leva ao login ou à área do próprio perfil. */
export function Protegida({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { sessao } = useSessao();
  if (!sessao) return <Navigate to="/entrar" replace />;
  if (!temPerfil(sessao.usuario, ...perfis)) return <Navigate to={rotaInicial(sessao.usuario)} replace />;
  return children;
}
