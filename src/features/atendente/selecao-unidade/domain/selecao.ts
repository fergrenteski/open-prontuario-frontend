import type { Unidade } from '../../../../shared/domain/tipos';

/** UPAs primeiro (pronto atendimento é o caso mais urgente do balcão), depois por nome. */
export function ordenarUnidades(unidades: Unidade[]): Unidade[] {
  return [...unidades].sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome, 'pt-BR') : a.tipo === 'UPA' ? -1 : 1));
}
