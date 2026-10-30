import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderTela, sessaoDe } from '../../../../../test/utils';
import { ErroApi } from '../../../../shared/domain/erros';
import type { ProntuarioPort } from '../application/ports';
import { ProntuarioPage } from './ProntuarioPage';

const pront = {
  id: 'pront-001',
  pacienteId: 'pac-101',
  alergias: ['dipirona'],
  medicacoes: ['losartana 50mg'],
  historico: [{ id: 'atd-900', prontuarioId: 'pront-001', unidadeId: 'ubs-03', descricao: 'Consulta de rotina - hipertensão controlada', data: '2026-06-14T10:30:00-03:00' }],
};

const opcoes = (perfil: 'ATENDENTE' | 'PROFISSIONAL') => ({
  sessao: sessaoDe('u', 'U', perfil),
  url: '/atendimento/upa-01/prontuario/pac-101',
  rota: '/atendimento/:unidadeId/prontuario/:pacienteId',
});

function portaFake(over: Partial<ProntuarioPort> = {}): ProntuarioPort {
  return {
    consultar: vi.fn(async () => pront),
    registrarAtendimento: vi.fn(async (_p, d) => ({ id: 'atd-1', prontuarioId: 'pront-001', data: '2026-06-14T15:00:00-03:00', ...d })),
    ...over,
  };
}

describe('ProntuarioPage', () => {
  it('mostra alergias, medicações e histórico; atendente não registra atendimento', async () => {
    renderTela(<ProntuarioPage porta={portaFake()} />, opcoes('ATENDENTE'));
    expect(await screen.findByRole('region', { name: /Alergias/ })).toHaveTextContent('dipirona');
    expect(screen.getByRole('region', { name: 'Medicações em uso' })).toHaveTextContent('losartana 50mg');
    expect(screen.getByText(/hipertensão controlada/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar atendimento' })).not.toBeInTheDocument();
  });

  it('403 sem consentimento mostra mensagem clara e nenhum dado clínico', async () => {
    const porta = portaFake({ consultar: vi.fn().mockRejectedValue(new ErroApi({ status: 403, codigo: 'CONSENTIMENTO_AUSENTE' })) });
    renderTela(<ProntuarioPage porta={porta} />, opcoes('ATENDENTE'));
    expect(await screen.findByRole('alert')).toHaveTextContent('O paciente não autorizou esta unidade');
    expect(screen.queryByText('dipirona')).not.toBeInTheDocument();
  });

  it('profissional registra atendimento', async () => {
    const porta = portaFake();
    renderTela(<ProntuarioPage porta={porta} />, opcoes('PROFISSIONAL'));
    await userEvent.type(await screen.findByLabelText('Descrição do atendimento'), 'Dor torácica descartada.');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar atendimento' }));
    expect(porta.registrarAtendimento).toHaveBeenCalledWith('pac-101', { unidadeId: 'upa-01', descricao: 'Dor torácica descartada.' });
    expect(await screen.findByText('Atendimento registrado no prontuário.')).toBeInTheDocument();
    expect(screen.getByText('Dor torácica descartada.')).toBeInTheDocument();
  });

  it('profissional vê erro de validação', async () => {
    renderTela(<ProntuarioPage porta={portaFake()} />, opcoes('PROFISSIONAL'));
    await userEvent.type(await screen.findByLabelText('Descrição do atendimento'), 'a');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar atendimento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/pelo menos 3/);
  });
});
