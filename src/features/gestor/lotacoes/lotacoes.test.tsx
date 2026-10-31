import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi, ErroValidacao } from '../../../shared/domain/erros';
import type { LotacoesPort } from './application/ports';
import { useLotacoes } from './application/useLotacoes';
import { ordenarLotacoes, rotuloLotacao, validarLotacao, type Lotacao } from './domain/lotacao';
import { LotacoesPage } from './ui/LotacoesPage';

const lotacoes: Lotacao[] = [
  { id: 'lot-4', usuarioId: 'usr-gestor-01', unidadeId: 'upa-01', perfil: 'GESTOR' },
  { id: 'lot-3', usuarioId: 'usr-prof-03', unidadeId: 'upa-01', perfil: 'PROFISSIONAL' },
  { id: 'lot-1', usuarioId: 'usr-atendente-07', unidadeId: 'upa-01', perfil: 'ATENDENTE' },
];
const unidades = [
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
];

function portaFake(): LotacoesPort {
  return {
    listarUnidades: vi.fn(async () => unidades),
    listar: vi.fn(async () => lotacoes),
    criar: vi.fn(async (d) => ({ id: 'n', ...d })),
    remover: vi.fn(async () => {}),
  };
}

describe('lotação (domínio)', () => {
  it('valida usuário e perfil', () => {
    expect(validarLotacao('usr-prof-03', 'PROFISSIONAL')).toBeNull();
    expect(validarLotacao('a b', 'ATENDENTE')).toMatch(/sem espaços/);
    expect(validarLotacao('usr-x', 'PACIENTE')).toMatch(/atendente, profissional ou gestor/);
  });

  it('ordena por perfil e rotula', () => {
    expect(ordenarLotacoes(lotacoes).map((l) => l.id)).toEqual(['lot-1', 'lot-3', 'lot-4']);
    expect(rotuloLotacao(lotacoes[1])).toBe('usr-prof-03 (Profissional de saúde)');
  });
});

describe('useLotacoes', () => {
  it('lista pela primeira unidade, cria e remove', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useLotacoes(porta, null));
    await waitFor(() => expect(result.current.lotacoes.dados).toHaveLength(3));
    expect(porta.listar).toHaveBeenCalledWith('upa-01');

    await act(async () => {
      await result.current.criar.executar(' usr-novo-09 ', 'ATENDENTE');
    });
    expect(porta.criar).toHaveBeenCalledWith({ usuarioId: 'usr-novo-09', unidadeId: 'upa-01', perfil: 'ATENDENTE' });

    await act(async () => {
      await result.current.remover.executar(lotacoes[0]);
    });
    expect(porta.remover).toHaveBeenCalledWith('lot-4');
    expect(result.current.mensagem).toBe('Lotação de usr-gestor-01 removida.');
  });

  it('valida antes de chamar a porta e repassa 409', async () => {
    const porta = portaFake();
    vi.mocked(porta.criar).mockRejectedValueOnce(new ErroApi({ status: 409, codigo: 'REQUISICAO_INVALIDA' }));
    const { result } = renderHook(() => useLotacoes(porta, 'upa-02'));
    await waitFor(() => expect(result.current.lotacoes.dados).toBeDefined());
    await act(async () => {
      await result.current.criar.executar('', 'ATENDENTE');
    });
    expect(result.current.criar.erro).toBeInstanceOf(ErroValidacao);
    await act(async () => {
      await result.current.criar.executar('usr-x1', 'GESTOR');
    });
    expect(result.current.criar.erro).toBeInstanceOf(ErroApi);
  });
});

describe('LotacoesPage', () => {
  it('lista por unidade, troca de unidade e cria lotação', async () => {
    const porta = portaFake();
    renderTela(<LotacoesPage porta={porta} />, { sessao: sessaoDe('usr-gestor-01', 'Lúcia', 'GESTOR'), url: '/gestao/lotacoes' });
    const u = userEvent.setup();
    expect(await screen.findByRole('heading', { name: 'Lotados em UPA Boa Vista' })).toBeInTheDocument();
    expect(await screen.findByRole('table')).toHaveTextContent('usr-prof-03');

    await u.selectOptions(screen.getByLabelText('Unidade'), 'upa-02');
    await waitFor(() => expect(porta.listar).toHaveBeenLastCalledWith('upa-02'));

    await u.type(screen.getByLabelText('Usuário'), 'usr-novo-09');
    await u.selectOptions(screen.getByLabelText('Perfil'), 'PROFISSIONAL');
    await u.click(screen.getByRole('button', { name: 'Lotar na unidade' }));
    expect(porta.criar).toHaveBeenCalledWith({ usuarioId: 'usr-novo-09', unidadeId: 'upa-02', perfil: 'PROFISSIONAL' });

    await u.click(await screen.findByRole('button', { name: 'Remover lotação de usr-atendente-07' }));
    expect(porta.remover).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(porta.remover).toHaveBeenCalledWith('lot-1');
  });
});
