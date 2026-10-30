import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderTela } from '../../../../test/utils';
import type { Unidade } from '../../../shared/domain/tipos';
import { ordenarUnidades } from './domain/selecao';
import { SelecaoUnidadePage } from './ui/SelecaoUnidadePage';

const unidades: Unidade[] = [
  { id: 'ubs-03', nome: 'UBS Mãe Curitibana', tipo: 'UBS', latitude: 0, longitude: 0 },
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA', latitude: 0, longitude: 0 },
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA', latitude: 0, longitude: 0 },
];

describe('seleção de unidade', () => {
  it('ordena UPAs primeiro e por nome', () => {
    expect(ordenarUnidades(unidades).map((u) => u.id)).toEqual(['upa-01', 'upa-02', 'ubs-03']);
  });

  it('lista as unidades do usuário com link para a fila', async () => {
    renderTela(<SelecaoUnidadePage porta={{ listarMinhasUnidades: vi.fn(async () => unidades) }} />);
    const link = await screen.findByRole('link', { name: /UPA Boa Vista/ });
    expect(link).toHaveAttribute('href', '/atendimento/upa-01/fila');
  });

  it('estado vazio quando não há lotação', async () => {
    renderTela(<SelecaoUnidadePage porta={{ listarMinhasUnidades: vi.fn(async () => []) }} />);
    expect(await screen.findByRole('heading', { name: /não está lotado/ })).toBeInTheDocument();
  });
});
