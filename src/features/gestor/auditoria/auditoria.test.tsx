import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi, ErroValidacao } from '../../../shared/domain/erros';
import type { AuditoriaPort } from './application/ports';
import { useAuditoria } from './application/useAuditoria';
import { montarConsulta } from './domain/auditoria';
import { AuditoriaPage } from './ui/AuditoriaPage';

const acessos = [
  { id: 'a1', prontuarioId: 'pront-001', consentimentoId: 'c-3', usuarioId: 'usr-prof-03', unidadeId: 'upa-01', acessadoEm: '2026-06-11T14:05:00-03:00' },
  { id: 'a2', prontuarioId: 'pront-001', consentimentoId: 'c-4', usuarioId: 'usr-prof-03', unidadeId: 'upa-01', acessadoEm: '2026-06-12T09:00:00-03:00' },
];

function portaFake(over: Partial<AuditoriaPort> = {}): AuditoriaPort {
  return {
    listar: vi.fn(async () => acessos),
    listarUnidades: vi.fn(async () => [{ id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 }]),
    ...over,
  };
}

describe('auditoria (domínio)', () => {
  it('exige prontuário, converte datas e valida o intervalo', () => {
    expect(montarConsulta({ prontuarioId: ' ' }).erro).toMatch(/Informe/);
    expect(montarConsulta({ prontuarioId: ' pront-001 ' }).consulta).toEqual({ prontuarioId: 'pront-001', dataInicio: undefined, dataFim: undefined });
    const ok = montarConsulta({ prontuarioId: 'p', de: '2026-06-01T00:00', ate: '2026-06-30T23:59' }).consulta;
    expect(ok?.dataInicio).toBe(new Date('2026-06-01T00:00').toISOString());
    expect(montarConsulta({ prontuarioId: 'p', de: '2026-06-30T00:00', ate: '2026-06-01T00:00' }).erro).toMatch(/anterior/);
  });
});

describe('useAuditoria', () => {
  it('consulta e ordena do mais recente; filtro inválido não chama a porta', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useAuditoria(porta));
    await act(async () => {
      await result.current.consultar.executar({ prontuarioId: '' });
    });
    expect(result.current.consultar.erro).toBeInstanceOf(ErroValidacao);
    expect(porta.listar).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.consultar.executar({ prontuarioId: 'pront-001' });
    });
    expect(porta.listar).toHaveBeenCalledWith({ prontuarioId: 'pront-001', dataInicio: undefined, dataFim: undefined });
    expect(result.current.resultado?.acessos.map((a) => a.id)).toEqual(['a2', 'a1']);
  });
});

describe('AuditoriaPage', () => {
  const sessao = sessaoDe('usr-gestor-01', 'Lúcia Andrade', 'GESTOR');

  it('lista os acessos do prontuário', async () => {
    renderTela(<AuditoriaPage porta={portaFake()} />, { sessao });
    await userEvent.type(screen.getByLabelText('Prontuário'), 'pront-001');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar acessos' }));
    const tabela = await screen.findByRole('table');
    expect(tabela).toHaveTextContent('UPA Boa Vista');
    expect(tabela).toHaveTextContent('usr-prof-03');
    expect(screen.getByRole('heading', { name: /2 acessos/ })).toBeInTheDocument();
  });

  it('403 e lista vazia', async () => {
    const porta = portaFake({ listar: vi.fn().mockRejectedValueOnce(new ErroApi({ status: 403, codigo: 'SEM_PERMISSAO' })).mockResolvedValueOnce([]) });
    renderTela(<AuditoriaPage porta={porta} />, { sessao });
    await userEvent.type(screen.getByLabelText('Prontuário'), 'pront-002');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar acessos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/unidades em que você é gestor/);
    await userEvent.click(screen.getByRole('button', { name: 'Consultar acessos' }));
    expect(await screen.findByRole('heading', { name: 'Nenhum acesso no período' })).toBeInTheDocument();
  });
});
