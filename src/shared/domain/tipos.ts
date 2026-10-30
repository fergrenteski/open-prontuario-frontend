// Tipos compartilhados pelo contrato do BFF (bff.openapi.yaml). Domínio puro: sem React nem I/O.

export const PERFIS = ['PACIENTE', 'ATENDENTE', 'PROFISSIONAL', 'GESTOR'] as const;
export type Perfil = (typeof PERFIS)[number];

export interface Usuario {
  id: string;
  nome: string;
  roles: Perfil[];
}

export interface Sessao {
  token: string;
  usuario: Usuario;
  /** epoch ms */
  expiraEm: number;
}

export type TipoUnidade = 'UBS' | 'UPA';

export interface Unidade {
  id: string;
  nome: string;
  tipo: TipoUnidade;
  latitude: number;
  longitude: number;
}

export type NivelCongestionamento = 'BAIXO' | 'MEDIO' | 'ALTO';

export interface VisaoAgregada {
  unidadeId: string;
  totalPresente: number;
  totalACaminho: number;
  tempoMedioEsperaMin: number;
  nivelCongestionamento: NivelCongestionamento;
  atualizadoEm?: string | null;
}

export type StatusFila = 'A_CAMINHO' | 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO';
export type MotivoSaida = 'ATENDIDO' | 'DESISTENCIA' | 'ENCAMINHADO';

export function rotuloTipoUnidade(tipo: TipoUnidade): string {
  return tipo === 'UPA' ? 'Unidade de Pronto Atendimento' : 'Unidade Básica de Saúde';
}

/** Função id → nome para listas que só trazem unidadeId. */
export function nomesDeUnidades(unidades: Unidade[] | undefined): (id: string) => string {
  const mapa = new Map((unidades ?? []).map((u) => [u.id, u.nome]));
  return (id) => mapa.get(id) ?? id;
}
