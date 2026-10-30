import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { registro } from '../../../../test/fakes/fila';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi } from '../../../shared/domain/erros';
import type { AvisoChegadaPort } from './application/ports';
import { useAvisoChegada } from './application/useAvisoChegada';
import { normalizarSintomas, semErros, validarAviso } from './domain/aviso';
import { AvisoChegadaPage } from './ui/AvisoChegadaPage';

const base = { sintomas: ['febre'], autorizarProntuario: false, validadeConsentimentoDias: 3 };

describe('aviso de chegada (domínio)', () => {
  it('normaliza sintomas: apara, remove vazios e repetidos', () => {
    expect(normalizarSintomas([' Febre ', 'febre', '', 'dor  de cabeça'])).toEqual(['Febre', 'dor de cabeça']);
  });

  it('valida sintomas, minutos e validade da autorização', () => {
    expect(semErros(validarAviso(base))).toBe(true);
    expect(validarAviso({ ...base, sintomas: [' '] }).sintomas).toMatch(/pelo menos um/);
    expect(validarAviso({ ...base, sintomas: ['a'] }).sintomas).toMatch(/2 a 120/);
    expect(validarAviso({ ...base, sintomas: Array.from({ length: 21 }, (_, i) => `s${i}`) }).sintomas).toMatch(/no máximo 20/);
    expect(validarAviso({ ...base, tempoEstimadoChegadaMin: 601 }).tempoEstimadoChegadaMin).toBeDefined();
    expect(validarAviso({ ...base, tempoEstimadoChegadaMin: 1.5 }).tempoEstimadoChegadaMin).toBeDefined();
    expect(validarAviso({ ...base, autorizarProntuario: true, validadeConsentimentoDias: 366 }).validadeConsentimentoDias).toBeDefined();
    expect(validarAviso({ ...base, autorizarProntuario: false, validadeConsentimentoDias: 0 }).validadeConsentimentoDias).toBeUndefined();
  });
});

function portaFake(over: Partial<AvisoChegadaPort> = {}): AvisoChegadaPort {
  return {
    buscarUnidade: vi.fn(async () => ({ id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 })),
    avisarChegada: vi.fn(async (_u, a) =>
      registro({ id: 'r9', status: 'A_CAMINHO', horarioChegada: null, prioridade: 'MUITO_URGENTE', sintomas: a.sintomas, prontuarioAutorizado: a.autorizarProntuario, tempoEstimadoChegadaMin: a.tempoEstimadoChegadaMin }),
    ),
    ...over,
  };
}

describe('useAvisoChegada', () => {
  it('não chama a porta com dados inválidos e expõe erros por campo', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useAvisoChegada(porta, 'upa-01'));
    await act(async () => {
      await result.current.enviar.executar({ ...base, sintomas: [] });
    });
    expect(result.current.errosCampos.sintomas).toBeDefined();
    expect(porta.avisarChegada).not.toHaveBeenCalled();
  });

  it('envia sintomas normalizados', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useAvisoChegada(porta, 'upa-01'));
    await act(async () => {
      await result.current.enviar.executar({ ...base, sintomas: ['dor no peito', ' '] });
    });
    expect(porta.avisarChegada).toHaveBeenCalledWith('upa-01', { ...base, sintomas: ['dor no peito'] });
  });
});

describe('AvisoChegadaPage', () => {
  const opcoes = { sessao: sessaoDe('pac-101', 'João Pereira', 'PACIENTE'), url: '/paciente/unidades/upa-01/aviso', rota: '/paciente/unidades/:unidadeId/aviso' };

  it('avisa com sintomas, minutos e autorização e mostra a pulseira preliminar', async () => {
    const porta = portaFake();
    renderTela(<AvisoChegadaPage porta={porta} />, opcoes);
    const u = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 1, name: 'UPA Boa Vista' })).toBeInTheDocument();
    await u.click(screen.getByRole('checkbox', { name: 'dor no peito' }));
    await u.type(screen.getByLabelText('Outros sintomas'), 'suor frio');
    await u.type(screen.getByLabelText('Em quantos minutos você chega?'), '15');
    await u.click(screen.getByRole('checkbox', { name: /Autorizar meu prontuário/ }));
    await u.clear(screen.getByLabelText('Por quantos dias?'));
    await u.type(screen.getByLabelText('Por quantos dias?'), '7');
    await u.click(screen.getByRole('button', { name: 'Avisar UPA Boa Vista' }));

    expect(porta.avisarChegada).toHaveBeenCalledWith('upa-01', {
      sintomas: ['dor no peito', 'suor frio'],
      tempoEstimadoChegadaMin: 15,
      autorizarProntuario: true,
      validadeConsentimentoDias: 7,
    });
    expect(await screen.findByRole('heading', { name: /já sabe que você está a caminho/ })).toBeInTheDocument();
    expect(screen.getByText('Muito urgente')).toBeInTheDocument();
    expect(screen.getByText('Prontuário autorizado para esta unidade.')).toBeInTheDocument();
  });

  it('mostra erro de campo sem sintomas e 409 de registro duplicado', async () => {
    const porta = portaFake({ avisarChegada: vi.fn().mockRejectedValue(new ErroApi({ status: 409, codigo: 'REGISTRO_ATIVO_DUPLICADO' })) });
    renderTela(<AvisoChegadaPage porta={porta} />, opcoes);
    const u = userEvent.setup();
    const enviar = await screen.findByRole('button', { name: 'Avisar UPA Boa Vista' });

    await u.click(enviar);
    expect(screen.getByText('Informe pelo menos um sintoma.')).toBeInTheDocument();

    await u.click(screen.getByRole('checkbox', { name: 'febre' }));
    await u.click(enviar);
    expect(await screen.findByRole('alert')).toHaveTextContent('Você já está na fila desta unidade');
  });
});
