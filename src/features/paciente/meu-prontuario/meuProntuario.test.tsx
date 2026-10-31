import { renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../test/utils';
import { ErroApi } from '../../../shared/domain/erros';
import type { MeuProntuarioPort } from './application/ports';
import { useMeuProntuario } from './application/useMeuProntuario';
import { acessosRecentes } from '../../../shared/domain/auditoria';
import { unidadesQueAcessaram, type LogAuditoria } from './domain/meuProntuario';
import { MeuProntuarioPage } from './ui/MeuProntuarioPage';

const log = (id: string, unidadeId: string, acessadoEm: string): LogAuditoria => ({
  id, prontuarioId: 'pront-001', consentimentoId: `c-${id}`, usuarioId: 'usr-prof-03', unidadeId, acessadoEm,
});
const acessos = [log('1', 'ubs-03', '2026-06-11T14:05:00-03:00'), log('2', 'upa-01', '2026-06-14T09:00:00-03:00'), log('3', 'upa-01', '2026-06-12T09:00:00-03:00')];

function portaFake(over: Partial<MeuProntuarioPort> = {}): MeuProntuarioPort {
  return {
    consultarMeu: vi.fn(async () => ({ id: 'pront-001', pacienteId: 'pac-101', alergias: ['dipirona'], medicacoes: ['losartana 50mg'], historico: [] })),
    listarAcessos: vi.fn(async () => acessos),
    listarUnidades: vi.fn(async () => [{ id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA' as const, latitude: 0, longitude: 0 }]),
    ...over,
  };
}

describe('meu prontuário', () => {
  it('ordena acessos e conta unidades', () => {
    expect(acessosRecentes(acessos).map((a) => a.id)).toEqual(['2', '3', '1']);
    expect(unidadesQueAcessaram(acessos)).toBe(2);
  });

  it('busca a auditoria pelo id do próprio prontuário', async () => {
    const porta = portaFake();
    const { result } = renderHook(() => useMeuProntuario(porta));
    await waitFor(() => expect(result.current.dados).toBeDefined());
    expect(porta.listarAcessos).toHaveBeenCalledWith('pront-001');
    expect(result.current.dados?.acessos[0].id).toBe('2');
  });

  it('mostra ficha e quem acessou', async () => {
    renderTela(<MeuProntuarioPage porta={portaFake()} />, { sessao: sessaoDe('pac-101', 'João', 'PACIENTE') });
    expect(await screen.findByText('dipirona')).toBeInTheDocument();
    const quem = screen.getByRole('region', { name: 'Quem acessou' });
    expect(quem).toHaveTextContent('3 acessos de 2 unidades');
    expect(quem).toHaveTextContent('UPA Boa Vista');
    expect(quem).toHaveTextContent('ubs-03');
  });

  it('sem acessos e sem prontuário', async () => {
    const { unmount } = renderTela(<MeuProntuarioPage porta={portaFake({ listarAcessos: vi.fn(async () => []) })} />);
    expect(await screen.findByText('Ninguém acessou seu prontuário até agora.')).toBeInTheDocument();
    unmount();
    renderTela(<MeuProntuarioPage porta={portaFake({ consultarMeu: vi.fn().mockRejectedValue(new ErroApi({ status: 404, codigo: 'RECURSO_NAO_ENCONTRADO' })) })} />);
    expect(await screen.findByRole('heading', { name: 'Você ainda não tem prontuário' })).toBeInTheDocument();
  });
});
