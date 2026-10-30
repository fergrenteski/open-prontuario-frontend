import { describe, expect, it } from 'vitest';
import { agruparPersonas, criarSessao, iniciais } from './login';

const personas = [
  { id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE' as const] },
  { id: 'usr-atendente-07', nome: 'Carla Mendes', roles: ['ATENDENTE' as const] },
  { id: 'usr-prof-03', nome: 'Dr. Paulo Lima', roles: ['PROFISSIONAL' as const] },
];

describe('login (domínio)', () => {
  it('agrupa personas por área e omite grupos vazios', () => {
    const grupos = agruparPersonas(personas);
    expect(grupos.map((g) => g.titulo)).toEqual(['Paciente', 'Atendimento na unidade']);
    expect(grupos[1].personas.map((p) => p.id)).toEqual(['usr-atendente-07', 'usr-prof-03']);
  });

  it('extrai iniciais ignorando o título Dr.', () => {
    expect(iniciais('Dr. Paulo Lima')).toBe('PL');
    expect(iniciais('Lúcia Andrade')).toBe('LA');
    expect(iniciais('Ana')).toBe('A');
  });

  it('cria sessão expirando um minuto antes do token', () => {
    const s = criarSessao('tok', 3600, personas[0], 1_000);
    expect(s).toEqual({ token: 'tok', usuario: personas[0], expiraEm: 1_000 + 3540_000 });
    expect(criarSessao('tok', 30, personas[0], 0).expiraEm).toBe(0);
  });
});
