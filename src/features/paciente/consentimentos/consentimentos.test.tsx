import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi, ErroValidacao } from '../../../shared/domain/erros';
import type { ConsentimentosPort } from './application/ports';
import { useConsentimentos } from './application/useConsentimentos';
import {
  agruparConsentimentos,
  diasRestantes,
  estaValido,
  situacaoConsentimento,
  unidadesSemAutorizacao,
  validarValidadeDias,
  type Consentimento,
} from './domain/consentimento';
import { ConsentimentosPage } from './ui/ConsentimentosPage';

const agora = new Date('2026-06-14T12:00:00-03:00');
const c = (over: Partial<Consentimento>): Consentimento => ({
  id: 'c',
  pacienteId: 'pac-101',
  unidadeId: 'upa-01',
  ativo: true,
  concedidoEm: '2026-06-13T12:00:00-03:00',
  expiraEm: '2026-06-16T12:00:00-03:00',
  revogadoEm: null,
  ...over,
});

describe('consentimento (domínio)', () => {
  it('ativo, expirado e revogado', () => {
    expect(situacaoConsentimento(c({}), agora)).toBe('ATIVO');
    expect(estaValido(c({}), agora)).toBe(true);
    expect(situacaoConsentimento(c({ expiraEm: '2026-06-14T11:59:00-03:00' }), agora)).toBe('EXPIRADO');
    expect(situacaoConsentimento(c({ ativo: false, revogadoEm: '2026-06-14T10:00:00-03:00' }), agora)).toBe('REVOGADO');
    expect(situacaoConsentimento(c({ ativo: false }), agora)).toBe('REVOGADO');
    expect(situacaoConsentimento(c({ ativo: false, expiraEm: '2026-06-01T00:00:00-03:00' }), agora)).toBe('EXPIRADO');
  });

  it('expira exatamente no instante de expiraEm (agora < expiraEm)', () => {
    expect(estaValido(c({ expiraEm: '2026-06-14T12:00:00-03:00' }), agora)).toBe(false);
  });

  it('dias restantes e validade 1..365', () => {
    expect(diasRestantes(c({}), agora)).toBe(2);
    expect(diasRestantes(c({ expiraEm: '2026-06-01T00:00:00-03:00' }), agora)).toBe(0);
    expect(validarValidadeDias(1)).toBeNull();
    expect(validarValidadeDias(365)).toBeNull();
    expect(validarValidadeDias(0)).toMatch(/1 a 365/);
    expect(validarValidadeDias(366)).toMatch(/1 a 365/);
    expect(validarValidadeDias(2.5)).toMatch(/1 a 365/);
  });

  it('agrupa e oferece só unidades sem autorização válida', () => {
    const lista = [c({ id: 'a' }), c({ id: 'b', unidadeId: 'upa-02', ativo: false, revogadoEm: '2026-06-14T10:00:00-03:00' })];
    const g = agruparConsentimentos(lista, agora);
    expect(g.ATIVO.map((x) => x.id)).toEqual(['a']);
    expect(g.REVOGADO.map((x) => x.id)).toEqual(['b']);
    expect(unidadesSemAutorizacao([{ id: 'upa-01' }, { id: 'upa-02' }], lista, agora)).toEqual([{ id: 'upa-02' }]);
  });
});

const unidades = [
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA' as const, latitude: 0, longitude: 0 },
];
const futuro = new Date(Date.now() + 3 * 86_400_000).toISOString();

function portaFake(): ConsentimentosPort {
  return {
    listar: vi.fn(async () => [
      c({ id: 'c1', expiraEm: futuro }),
      c({ id: 'c2', unidadeId: 'upa-02', ativo: false, revogadoEm: '2026-06-12T18:20:00-03:00', expiraEm: futuro }),
    ]),
    conceder: vi.fn(async (u, d) => c({ id: 'n', unidadeId: u, expiraEm: new Date(Date.now() + d * 864e5).toISOString() })),
    renovar: vi.fn(async (id) => c({ id })),
    revogar: vi.fn(async () => {}),
    listarUnidades: vi.fn(async () => unidades),
  };
}

describe('useConsentimentos', () => {
  it('concede, renova e revoga recarregando a lista', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useConsentimentos(porta));
    await waitFor(() => expect(result.current.dados.dados).toBeDefined());

    await act(async () => {
      await result.current.conceder('upa-02', 7);
    });
    expect(porta.conceder).toHaveBeenCalledWith('upa-02', 7);
    expect(result.current.mensagem).toBe('Autorização concedida por 7 dias.');

    await act(async () => {
      await result.current.renovar('c1', 1);
    });
    expect(porta.renovar).toHaveBeenCalledWith('c1', 1);
    expect(result.current.mensagem).toBe('Autorização renovada por 1 dia.');

    await act(async () => {
      await result.current.revogar('c1');
    });
    expect(porta.revogar).toHaveBeenCalledWith('c1');
    expect(porta.listar).toHaveBeenCalledTimes(4);
  });

  it('valida a validade antes de chamar a porta e repassa 409', async () => {
    const porta = portaFake();
    vi.mocked(porta.conceder).mockRejectedValueOnce(new ErroApi({ status: 409, codigo: 'CONSENTIMENTO_DUPLICADO' }));
    const { result } = renderHook(() => useConsentimentos(porta));
    await waitFor(() => expect(result.current.dados.dados).toBeDefined());

    await act(async () => {
      await result.current.renovar('c1', 400);
    });
    expect(result.current.acao.erro).toBeInstanceOf(ErroValidacao);
    expect(porta.renovar).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.conceder('upa-01', 3);
    });
    expect(result.current.acao.erro).toMatchObject({ codigo: 'CONSENTIMENTO_DUPLICADO' });
  });
});

describe('ConsentimentosPage', () => {
  const sessao = sessaoDe('pac-101', 'João Pereira', 'PACIENTE');

  it('lista ativas e histórico, revoga em dois passos e concede nova', async () => {
    const porta = portaFake();
    renderTela(<ConsentimentosPage porta={porta} />, { sessao });
    const u = userEvent.setup();

    const ativas = await screen.findByRole('region', { name: /Ativas/ });
    expect(ativas).toHaveTextContent('UPA Boa Vista');
    expect(screen.getByRole('region', { name: 'Histórico de autorizações' })).toHaveTextContent('Revogada');

    await u.click(within(ativas).getByRole('button', { name: 'Revogar autorização de UPA Boa Vista' }));
    expect(porta.revogar).not.toHaveBeenCalled();
    await u.click(within(ativas).getByRole('button', { name: 'Confirmar revogação' }));
    expect(porta.revogar).toHaveBeenCalledWith('c1');
    expect(await screen.findByText(/Autorização revogada/)).toBeInTheDocument();

    const nova = screen.getByRole('region', { name: 'Autorizar uma unidade' });
    expect(within(nova).getByRole('combobox', { name: 'Unidade' })).toHaveDisplayValue('UPA Cajuru');
    await u.click(within(nova).getByRole('button', { name: 'Autorizar' }));
    expect(porta.conceder).toHaveBeenCalledWith('upa-02', 3);
  });

  it('estado vazio sem autorizações ativas', async () => {
    const porta = portaFake();
    vi.mocked(porta.listar).mockResolvedValue([]);
    renderTela(<ConsentimentosPage porta={porta} />, { sessao });
    expect(await screen.findByRole('heading', { name: /Nenhuma unidade vê seu prontuário/ })).toBeInTheDocument();
  });
});
