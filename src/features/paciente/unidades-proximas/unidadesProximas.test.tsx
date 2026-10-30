import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import type { LocalizacaoPort, UnidadesProximasPort } from './application/ports';
import { useUnidadesProximas } from './application/useUnidadesProximas';
import { CENTRO_CURITIBA, formatarDistancia, ordenarPorDistancia, resumoMovimento, type UnidadeProxima } from './domain/unidadesProximas';
import { UnidadesProximasPage } from './ui/UnidadesProximasPage';

const visao = { unidadeId: 'upa-01', totalPresente: 4, totalACaminho: 2, tempoMedioEsperaMin: 34, nivelCongestionamento: 'MEDIO' as const };
const unidades: UnidadeProxima[] = [
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA', latitude: 0, longitude: 0, distanciaKm: 5.42, visaoAgregada: null },
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA', latitude: 0, longitude: 0, distanciaKm: 0.847, visaoAgregada: visao },
];

const portaFake = (): UnidadesProximasPort => ({ listarProximas: vi.fn(async () => unidades) });
const aqui: LocalizacaoPort = { obterPosicao: vi.fn(async () => ({ latitude: -25.39, longitude: -49.23 })) };
const negada: LocalizacaoPort = { obterPosicao: vi.fn().mockRejectedValue(new Error('negada')) };

describe('unidades próximas (domínio)', () => {
  it('ordena pela distância e formata em m/km', () => {
    expect(ordenarPorDistancia(unidades).map((u) => u.id)).toEqual(['upa-01', 'upa-02']);
    expect(formatarDistancia(0.847)).toBe('850 m');
    expect(formatarDistancia(5.42)).toBe('5,4 km');
    expect(formatarDistancia(1)).toBe('1,0 km');
  });

  it('resume o movimento em linguagem simples', () => {
    expect(resumoMovimento(visao)).toBe('6 pessoas na fila · espera média de 34 min');
    expect(resumoMovimento({ ...visao, totalPresente: 1, totalACaminho: 0, tempoMedioEsperaMin: 0 })).toBe('1 pessoa na fila');
    expect(resumoMovimento(null)).toBe('Movimento indisponível agora');
  });
});

describe('useUnidadesProximas', () => {
  it('usa a localização do navegador', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useUnidadesProximas(porta, aqui));
    await waitFor(() => expect(result.current.dados?.localizacaoReal).toBe(true));
    expect(porta.listarProximas).toHaveBeenCalledWith({ latitude: -25.39, longitude: -49.23 }, 20);
    expect(result.current.dados?.unidades[0].id).toBe('upa-01');
  });

  it('cai para o centro de Curitiba quando a localização é negada', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useUnidadesProximas(porta, negada));
    await act(async () => {});
    await waitFor(() => expect(result.current.dados?.localizacaoReal).toBe(false));
    expect(porta.listarProximas).toHaveBeenCalledWith(CENTRO_CURITIBA, 20);
  });
});

describe('UnidadesProximasPage', () => {
  const sessao = sessaoDe('pac-101', 'João Pereira', 'PACIENTE');

  it('lista da mais próxima para a mais distante com indicadores e ação de aviso', async () => {
    renderTela(<UnidadesProximasPage porta={portaFake()} localizacao={negada} />, { sessao });
    const lista = await screen.findByRole('list', { name: /mais próxima/ });
    const itens = lista.querySelectorAll(':scope > li');
    expect(itens[0]).toHaveTextContent('UPA Boa Vista');
    expect(itens[0]).toHaveTextContent('850 m');
    expect(itens[0]).toHaveTextContent('Movimento moderado');
    expect(itens[1]).toHaveTextContent('Movimento indisponível agora');
    expect(screen.getByText(/centro de Curitiba/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Estou indo para UPA Boa Vista' })).toHaveAttribute('href', '/paciente/unidades/upa-01/aviso');
  });

  it('estado vazio orienta a ligar para o SAMU', async () => {
    renderTela(<UnidadesProximasPage porta={{ listarProximas: vi.fn(async () => []) }} localizacao={aqui} />, { sessao });
    expect(await screen.findByRole('heading', { name: /Nenhuma unidade/ })).toBeInTheDocument();
  });
});
