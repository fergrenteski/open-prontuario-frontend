import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi } from '../../../shared/domain/erros';
import type { UnidadesPort } from './application/ports';
import { useGestaoUnidades } from './application/useGestaoUnidades';
import { FORM_VAZIO, formDe, ordenarPorNome, validarUnidade } from './domain/unidade';
import { UnidadesPage } from './ui/UnidadesPage';

const unidades = [
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA' as const, latitude: -25.4486, longitude: -49.2183 },
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: -25.3866, longitude: -49.2346 },
];

function portaFake(): UnidadesPort {
  return {
    listar: vi.fn(async () => unidades),
    criar: vi.fn(async (r) => ({ id: 'nova', ...r })),
    atualizar: vi.fn(async () => {}),
    remover: vi.fn(async () => {}),
  };
}

describe('unidade (domínio)', () => {
  it('valida e converte o formulário', () => {
    expect(validarUnidade({ nome: ' UPA Sítio Cercado ', tipo: 'UPA', latitude: '-25,53', longitude: '-49.27' }).req).toEqual({
      nome: 'UPA Sítio Cercado', tipo: 'UPA', latitude: -25.53, longitude: -49.27,
    });
    const { req, erros } = validarUnidade({ ...FORM_VAZIO, nome: 'AB', latitude: '91', longitude: '' });
    expect(req).toBeUndefined();
    expect(Object.keys(erros).sort()).toEqual(['latitude', 'longitude', 'nome']);
    expect(validarUnidade({ ...formDe(unidades[0]), tipo: 'X' as 'UPA' }).erros.tipo).toBeDefined();
  });

  it('ordena por nome', () => {
    expect(ordenarPorNome(unidades).map((u) => u.id)).toEqual(['upa-01', 'upa-02']);
  });
});

describe('useGestaoUnidades', () => {
  it('cria, atualiza e remove recarregando a lista', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useGestaoUnidades(porta));
    await waitFor(() => expect(result.current.unidades.dados).toHaveLength(2));
    const form = { nome: 'UBS Nova', tipo: 'UBS' as const, latitude: '-25.4', longitude: '-49.2' };

    await act(async () => {
      await result.current.salvar.executar(form);
    });
    expect(porta.criar).toHaveBeenCalledWith({ nome: 'UBS Nova', tipo: 'UBS', latitude: -25.4, longitude: -49.2 });
    expect(result.current.mensagem).toBe('UBS Nova criada.');

    await act(async () => {
      await result.current.salvar.executar(form, 'upa-01');
    });
    expect(porta.atualizar).toHaveBeenCalledWith('upa-01', expect.objectContaining({ nome: 'UBS Nova' }));

    await act(async () => {
      await result.current.remover.executar('upa-01', 'UPA Boa Vista');
    });
    expect(porta.remover).toHaveBeenCalledWith('upa-01');
    expect(porta.listar).toHaveBeenCalledTimes(4);
  });

  it('formulário inválido não chama a porta', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useGestaoUnidades(porta));
    await act(async () => {
      expect(await result.current.salvar.executar(FORM_VAZIO)).toBe(false);
    });
    expect(result.current.erros.nome).toBeDefined();
    expect(porta.criar).not.toHaveBeenCalled();
  });
});

describe('UnidadesPage', () => {
  const sessao = sessaoDe('usr-gestor-01', 'Lúcia Andrade', 'GESTOR');

  it('lista, cria e edita', async () => {
    const porta = portaFake();
    renderTela(<UnidadesPage porta={porta} />, { sessao });
    const u = userEvent.setup();
    const tabela = await screen.findByRole('table');
    expect(within(tabela).getAllByRole('row')[1]).toHaveTextContent('UPA Boa Vista');

    await u.type(screen.getByLabelText('Nome'), 'UPA Pinheirinho');
    await u.type(screen.getByLabelText('Latitude'), '-25.51');
    await u.type(screen.getByLabelText('Longitude'), '-49.29');
    await u.click(screen.getByRole('button', { name: 'Criar unidade' }));
    expect(porta.criar).toHaveBeenCalledWith({ nome: 'UPA Pinheirinho', tipo: 'UPA', latitude: -25.51, longitude: -49.29 });
    expect(await screen.findByText('UPA Pinheirinho criada.')).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Editar UPA Cajuru' }));
    expect(screen.getByRole('heading', { name: 'Editar UPA Cajuru' })).toBeInTheDocument();
    await u.clear(screen.getByLabelText('Nome'));
    await u.type(screen.getByLabelText('Nome'), 'UPA Cajuru 24h');
    await u.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(porta.atualizar).toHaveBeenCalledWith('upa-02', expect.objectContaining({ nome: 'UPA Cajuru 24h' }));
  });

  it('remove em dois passos e explica o 409', async () => {
    const porta = portaFake();
    vi.mocked(porta.remover).mockRejectedValueOnce(new ErroApi({ status: 409, codigo: 'TRANSICAO_INVALIDA' }));
    renderTela(<UnidadesPage porta={porta} />, { sessao });
    const u = userEvent.setup();
    await u.click(await screen.findByRole('button', { name: 'Remover UPA Boa Vista' }));
    expect(porta.remover).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(porta.remover).toHaveBeenCalledWith('upa-01');
    expect(await screen.findByRole('alert')).toHaveTextContent(/não pode ser removida/);
  });

  it('mostra erros de validação nos campos', async () => {
    renderTela(<UnidadesPage porta={portaFake()} />, { sessao });
    await userEvent.click(await screen.findByRole('button', { name: 'Criar unidade' }));
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/de 3 a 120/)).toBeInTheDocument();
  });
});
