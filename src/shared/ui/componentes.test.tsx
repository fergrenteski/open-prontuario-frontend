import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErroApi } from '../domain/erros';
import { AlertaErro, Carregando, Vazio } from './Estados';
import { Medidor } from './Medidor';
import { Pulseira } from './Pulseira';

describe('componentes compartilhados', () => {
  it('pulseira mostra rótulo textual além da cor', () => {
    render(<Pulseira prioridade="MUITO_URGENTE" comTempo />);
    expect(screen.getByText('Muito urgente')).toBeInTheDocument();
    expect(screen.getByText(/até 10 min/)).toBeInTheDocument();
  });

  it('medidor descreve o nível em texto', () => {
    render(<Medidor nivel="ALTO" />);
    expect(screen.getByText('Muito cheia')).toBeInTheDocument();
  });

  it('estados de carregando, vazio e erro são anunciados', async () => {
    const tentar = vi.fn();
    render(
      <>
        <Carregando />
        <Vazio titulo="Nada aqui" />
        <AlertaErro erro={new ErroApi({ status: 503, codigo: 'DEPENDENCIA_INDISPONIVEL', correlationId: 'abc' })} aoTentarDeNovo={tentar} />
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/fora do ar/);
    expect(screen.getByText(/abc/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(tentar).toHaveBeenCalledOnce();
  });
});
