import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { vi } from 'vitest';
import { SessaoContext } from '../src/shared/application/sessao';
import type { Perfil, Sessao } from '../src/shared/domain/tipos';

export function sessaoDe(id: string, nome: string, ...roles: Perfil[]): Sessao {
  return { token: 'tok', usuario: { id, nome, roles }, expiraEm: Date.now() + 3600_000 };
}

export function wrapperSessao(sessao: Sessao | null = null) {
  const valor = { sessao, entrar: vi.fn(), sair: vi.fn() };
  const Wrapper = ({ children }: { children: ReactNode }) => <SessaoContext value={valor}>{children}</SessaoContext>;
  return { Wrapper, valor };
}

interface Opcoes {
  sessao?: Sessao | null;
  /** URL inicial e padrão de rota (para useParams). */
  url?: string;
  rota?: string;
}

/** Renderiza uma tela dentro de sessão + roteador em memória; rotas extras mostram "rota:<path>". */
export function renderTela(ui: ReactElement, { sessao = null, url = '/', rota = '*' }: Opcoes = {}) {
  const { Wrapper, valor } = wrapperSessao(sessao);
  const utils = render(
    <Wrapper>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={rota} element={ui} />
          <Route path="*" element={<RotaAtual />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
  return { ...utils, sessaoCtx: valor };
}

function RotaAtual() {
  return <p>rota:{useLocation().pathname}</p>;
}
