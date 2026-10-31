import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { dadosAgregados, registro } from '../../../../test/fakes/fila';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi } from '../../../shared/domain/erros';
import type { IndicadoresPort } from './application/ports';
import { useIndicadores } from './application/useIndicadores';
import { distribuicaoPrioridade, estadoDasFontes, taxaAutorizacao } from './domain/indicadores';
import { IndicadoresPage } from './ui/IndicadoresPage';

const fila = [
  registro({ id: '1', prioridade: 'EMERGENCIA', prontuarioAutorizado: true }),
  registro({ id: '2', prioridade: 'URGENTE', prontuarioAutorizado: false }),
  registro({ id: '3', prioridade: 'URGENTE', prontuarioAutorizado: null }),
  registro({ id: '4', prioridade: 'URGENTE', status: 'FINALIZADO' }),
];
const unidades = [
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
];

describe('indicadores (domínio)', () => {
  it('estado das três fontes com duração relativa e falhas', () => {
    const base = dadosAgregados([]).meta;
    expect(estadoDasFontes(base).map((f) => [f.nome, f.status, f.proporcao])).toEqual([
      ['ms-fila-sql', 'ok', 35],
      ['ms-prontuario-mongo', 'ok', 29],
      ['fn-visao-agregada', 'ok', 100],
    ]);
    const degradada = {
      ...base,
      degraded: true,
      fontes: base.fontes.filter((f) => f.nome !== 'fn-visao-agregada'),
      falhas: [{ fonte: 'fn-visao-agregada', motivo: 'timeout' }],
    };
    expect(estadoDasFontes(degradada)[2]).toEqual({ nome: 'fn-visao-agregada', status: 'falha', duracaoMs: null, motivo: 'timeout', proporcao: 0 });
    expect(estadoDasFontes({ ...base, fontes: [], falhas: [] })[0].status).toBe('sem-resposta');
  });

  it('distribuição por prioridade ignora finalizados', () => {
    expect(distribuicaoPrioridade(fila)).toEqual([
      { prioridade: 'EMERGENCIA', total: 1 },
      { prioridade: 'MUITO_URGENTE', total: 0 },
      { prioridade: 'URGENTE', total: 2 },
      { prioridade: 'POUCO_URGENTE', total: 0 },
      { prioridade: 'NAO_URGENTE', total: 0 },
    ]);
  });

  it('taxa de autorização considera só valores conhecidos', () => {
    expect(taxaAutorizacao(fila)).toBe(50);
    expect(taxaAutorizacao([])).toBeNull();
  });
});

function portaFake(): IndicadoresPort {
  return { listarMinhasUnidades: vi.fn(async () => unidades), carregar: vi.fn(async () => dadosAgregados(fila)) };
}

describe('useIndicadores', () => {
  it('usa a primeira unidade do gestor quando nenhuma foi escolhida', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useIndicadores(porta, null));
    await waitFor(() => expect(result.current.agregado.dados).toBeTruthy());
    expect(porta.carregar).toHaveBeenCalledWith('upa-01');
  });

  it('sem unidades não consulta o agregado', async () => {
    const porta = { ...portaFake(), listarMinhasUnidades: vi.fn(async () => []) };
    const { result } = renderHook(() => useIndicadores(porta, null));
    await act(async () => {});
    await waitFor(() => expect(result.current.agregado.dados).toBeNull());
    expect(porta.carregar).not.toHaveBeenCalled();
  });
});

describe('IndicadoresPage', () => {
  const sessao = sessaoDe('usr-gestor-01', 'Lúcia Andrade', 'GESTOR');

  it('evidencia as três fontes, KPIs e o JSON único', async () => {
    const porta = portaFake();
    renderTela(<IndicadoresPage porta={porta} />, { sessao, url: '/gestao/indicadores?unidadeId=upa-02' });
    const origem = await screen.findByRole('region', { name: 'Uma chamada, três fontes' });
    expect(porta.carregar).toHaveBeenCalledWith('upa-02');
    expect(origem).toHaveTextContent('GET /api/aggregated-data?unidadeId=upa-02');
    expect(origem).toHaveTextContent('MS Fila');
    expect(origem).toHaveTextContent('Azure SQL');
    expect(origem).toHaveTextContent('MongoDB');
    expect(origem).toHaveTextContent('Azure Functions');
    expect(origem).toHaveTextContent('120 ms');
    expect(origem).toHaveTextContent('corr-1');
    expect(screen.getByRole('region', { name: 'Agora na unidade' })).toHaveTextContent('25 min');
    expect(screen.getByText('Ver o JSON único devolvido pelo BFF')).toBeInTheDocument();
  });

  it('troca de unidade pelo seletor e mostra degradação', async () => {
    const porta = portaFake();
    vi.mocked(porta.carregar).mockResolvedValue(
      dadosAgregados(fila, {
        visaoAgregada: null,
        meta: { ...dadosAgregados([]).meta, degraded: true, fontes: dadosAgregados([]).meta.fontes.slice(0, 2), falhas: [{ fonte: 'fn-visao-agregada', motivo: 'timeout' }] },
      }),
    );
    renderTela(<IndicadoresPage porta={porta} />, { sessao, url: '/gestao/indicadores' });
    const origem = await screen.findByRole('region', { name: 'Uma chamada, três fontes' });
    expect(origem).toHaveTextContent('Resposta degradada');
    expect(within(origem).getByText('timeout')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visão agregada indisponível' })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Unidade'), 'upa-02');
    await waitFor(() => expect(porta.carregar).toHaveBeenLastCalledWith('upa-02'));
  });

  it('502 quando todas as fontes falham', async () => {
    const porta = portaFake();
    vi.mocked(porta.carregar).mockRejectedValue(new ErroApi({ status: 502, codigo: 'AGREGACAO_FALHOU' }));
    renderTela(<IndicadoresPage porta={porta} />, { sessao });
    expect(await screen.findByRole('alert')).toHaveTextContent('Nenhuma fonte de dados respondeu');
  });
});
