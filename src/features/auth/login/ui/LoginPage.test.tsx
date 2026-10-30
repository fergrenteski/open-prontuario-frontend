import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../../test/utils';
import { ErroApi } from '../../../../shared/domain/erros';
import type { AutenticacaoPort } from '../application/ports';
import { LoginPage } from './LoginPage';

const personas = [
  { id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE' as const] },
  { id: 'usr-atendente-07', nome: 'Carla Mendes', roles: ['ATENDENTE' as const] },
  { id: 'usr-gestor-01', nome: 'Lúcia Andrade', roles: ['GESTOR' as const] },
];

describe('LoginPage', () => {
  it('modo dev: lista personas por grupo e entra redirecionando pelo perfil', async () => {
    const porta: AutenticacaoPort = {
      modo: 'dev',
      listarPersonas: vi.fn(async () => personas),
      entrar: vi.fn(async () => sessaoDe('usr-atendente-07', 'Carla Mendes', 'ATENDENTE')),
    };
    renderTela(<LoginPage porta={porta} />, { url: '/entrar', rota: '/entrar' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Fila por risco/);
    expect(await screen.findByRole('group', { name: 'Atendimento na unidade' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Carla Mendes/ }));

    expect(porta.entrar).toHaveBeenCalledWith('usr-atendente-07');
    expect(await screen.findByText('rota:/atendimento')).toBeInTheDocument();
  });

  it('mostra erro amigável quando o BFF está fora', async () => {
    const porta: AutenticacaoPort = {
      modo: 'dev',
      listarPersonas: vi.fn().mockRejectedValue(new ErroApi({ status: 0, codigo: 'REDE_INDISPONIVEL' })),
      entrar: vi.fn(),
    };
    renderTela(<LoginPage porta={porta} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Sem conexão/);
  });

  it('modo entra: botão de login da Microsoft', async () => {
    const porta: AutenticacaoPort = {
      modo: 'entra',
      listarPersonas: vi.fn(async () => []),
      entrar: vi.fn(async () => sessaoDe('usr-gestor-01', 'Lúcia Andrade', 'GESTOR')),
    };
    renderTela(<LoginPage porta={porta} />, { url: '/entrar', rota: '/entrar' });
    await userEvent.click(screen.getByRole('button', { name: 'Entrar com conta Microsoft' }));
    expect(porta.entrar).toHaveBeenCalledWith(undefined);
    expect(await screen.findByText('rota:/gestao/indicadores')).toBeInTheDocument();
  });
});
