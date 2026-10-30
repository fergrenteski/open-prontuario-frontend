import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { dadosAgregados, registro } from '../../../../../test/fakes/fila';
import { renderTela, sessaoDe } from '../../../../../test/utils';
import { ErroApi } from '../../../../shared/domain/erros';
import type { DadosAgregados } from '../../../../shared/domain/agregacao';
import type { FilaPort } from '../application/ports';
import { FilaPage } from './FilaPage';

const fila = [
  registro({ id: 'r1', pacienteNome: 'João Pereira', prioridade: 'URGENTE', status: 'A_CAMINHO', horarioChegada: null, tempoEstimadoChegadaMin: 40, prontuarioAutorizado: true }),
  registro({ id: 'r2', pacienteNome: 'Maria Souza', prioridade: 'EMERGENCIA', status: 'AGUARDANDO', sintomas: ['dor no peito'] }),
  registro({ id: 'r3', pacienteNome: 'Ana Lima', status: 'EM_ATENDIMENTO' }),
];

function portaFake(dados: DadosAgregados = dadosAgregados(fila)): FilaPort {
  return {
    carregarPainel: vi.fn(async () => dados),
    confirmarChegada: vi.fn(async () => {}),
    alterarPrioridade: vi.fn(async () => {}),
    iniciarAtendimento: vi.fn(async () => {}),
    encerrar: vi.fn(async () => {}),
  };
}

const atendente = sessaoDe('usr-atendente-07', 'Carla Mendes', 'ATENDENTE');
const opcoes = { sessao: atendente, url: '/atendimento/upa-01/fila', rota: '/atendimento/:unidadeId/fila' };

describe('FilaPage', () => {
  it('mostra a fila ordenada, o placar e a distinção presente × a caminho', async () => {
    renderTela(<FilaPage porta={portaFake()} />, opcoes);

    expect(await screen.findByRole('heading', { level: 1, name: 'UPA Boa Vista' })).toBeInTheDocument();
    const espera = screen.getByRole('table', { name: /Fila de espera/ });
    const linhas = within(espera).getAllByRole('row').slice(1);
    expect(linhas[0]).toHaveTextContent('Maria Souza');
    expect(linhas[0]).toHaveTextContent('Emergência');
    expect(linhas[0]).toHaveTextContent('Presente');
    expect(linhas[1]).toHaveTextContent('João Pereira');
    expect(linhas[1]).toHaveTextContent('A caminho');
    expect(linhas[1]).toHaveClass('fila__linha--a-caminho');
    expect(within(linhas[1]).getByRole('link', { name: /Ver prontuário de João Pereira/ })).toHaveAttribute(
      'href',
      '/atendimento/upa-01/prontuario/pac-r1',
    );
    expect(screen.getByRole('table', { name: 'Pacientes em atendimento' })).toHaveTextContent('Ana Lima');
    expect(screen.getByText('Movimento moderado')).toBeInTheDocument();
  });

  it('ações de um clique chamam os casos de uso', async () => {
    const porta = portaFake();
    renderTela(<FilaPage porta={porta} />, opcoes);
    const usuario = userEvent.setup();

    await usuario.click(await screen.findByRole('button', { name: 'Confirmar chegada de João Pereira' }));
    expect(porta.confirmarChegada).toHaveBeenCalledWith('r1');
    expect(await screen.findByRole('status')).toHaveTextContent('Chegada de João Pereira confirmada.');

    await usuario.click(screen.getByRole('button', { name: 'Iniciar atendimento de Maria Souza' }));
    expect(porta.iniciarAtendimento).toHaveBeenCalledWith('r2');

    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Prioridade de João Pereira' }), 'Muito urgente');
    expect(porta.alterarPrioridade).toHaveBeenCalledWith('r1', 'MUITO_URGENTE');

    await usuario.click(screen.getByRole('button', { name: 'Encerrar: atendido — Ana Lima' }));
    expect(porta.encerrar).toHaveBeenCalledWith('r3', 'ATENDIDO');
  });

  it('filtra só quem está a caminho', async () => {
    renderTela(<FilaPage porta={portaFake()} />, opcoes);
    await userEvent.click(await screen.findByRole('radio', { name: 'A caminho' }));
    const espera = screen.getByRole('table', { name: /Fila de espera/ });
    expect(within(espera).getAllByRole('row')).toHaveLength(2);
    expect(espera).toHaveTextContent('João Pereira');
  });

  it('gestor vê a fila sem botões de ação', async () => {
    renderTela(<FilaPage porta={portaFake()} />, { ...opcoes, sessao: sessaoDe('usr-gestor-01', 'Lúcia Andrade', 'GESTOR') });
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /Confirmar chegada/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver prontuário/ })).not.toBeInTheDocument();
  });

  it('avisa degradação e fila vazia', async () => {
    const dados = dadosAgregados([], {
      visaoAgregada: null,
      meta: { ...dadosAgregados([]).meta, degraded: true, falhas: [{ fonte: 'fn-visao-agregada', motivo: 'timeout' }] },
    });
    renderTela(<FilaPage porta={portaFake(dados)} />, opcoes);
    expect(await screen.findByText(/Function Visão Agregada \(timeout\)/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ninguém aguardando agora' })).toBeInTheDocument();
    expect(screen.getByText('indisponível')).toBeInTheDocument();
  });

  it('mostra erro com tentar de novo quando a primeira carga falha', async () => {
    const porta = portaFake();
    vi.mocked(porta.carregarPainel).mockRejectedValue(new ErroApi({ status: 502, codigo: 'AGREGACAO_FALHOU' }));
    renderTela(<FilaPage porta={porta} />, opcoes);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Nenhuma fonte de dados respondeu/);
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
