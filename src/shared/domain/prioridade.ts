// Cinco níveis inspirados no protocolo de Manchester (CONVENCOES §5, arc42 §8.5).
// Cada nível tem cor, forma e rótulo: a cor nunca é o único sinal.

export const PRIORIDADES = ['EMERGENCIA', 'MUITO_URGENTE', 'URGENTE', 'POUCO_URGENTE', 'NAO_URGENTE'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export type FormaPrioridade = 'cruz' | 'triangulo' | 'losango' | 'quadrado' | 'circulo';

export interface InfoPrioridade {
  rotulo: string;
  cor: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
  forma: FormaPrioridade;
  /** Tempo-alvo de referência do protocolo, para leitura humana. */
  tempoAlvo: string;
}

const INFO: Record<Prioridade, InfoPrioridade> = {
  EMERGENCIA: { rotulo: 'Emergência', cor: 'vermelho', forma: 'cruz', tempoAlvo: 'imediato' },
  MUITO_URGENTE: { rotulo: 'Muito urgente', cor: 'laranja', forma: 'triangulo', tempoAlvo: 'até 10 min' },
  URGENTE: { rotulo: 'Urgente', cor: 'amarelo', forma: 'losango', tempoAlvo: 'até 60 min' },
  POUCO_URGENTE: { rotulo: 'Pouco urgente', cor: 'verde', forma: 'quadrado', tempoAlvo: 'até 120 min' },
  NAO_URGENTE: { rotulo: 'Não urgente', cor: 'azul', forma: 'circulo', tempoAlvo: 'até 240 min' },
};

export function infoPrioridade(p: Prioridade): InfoPrioridade {
  return INFO[p];
}

/** 0 = mais grave. */
export function gravidade(p: Prioridade): number {
  return PRIORIDADES.indexOf(p);
}
