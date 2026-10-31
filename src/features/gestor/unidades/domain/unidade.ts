// CRUD de unidades pelo gestor (UnidadeRequest do MS Fila). Domínio puro.
import type { TipoUnidade, Unidade } from '../../../../shared/domain/tipos';

export interface UnidadeRequest {
  nome: string;
  tipo: TipoUnidade;
  latitude: number;
  longitude: number;
}

/** Valores do formulário, como digitados. */
export interface FormUnidade {
  nome: string;
  tipo: TipoUnidade;
  latitude: string;
  longitude: string;
}

export type ErrosUnidade = Partial<Record<keyof FormUnidade, string>>;

export const FORM_VAZIO: FormUnidade = { nome: '', tipo: 'UPA', latitude: '', longitude: '' };

export function formDe(u: Unidade): FormUnidade {
  return { nome: u.nome, tipo: u.tipo, latitude: String(u.latitude), longitude: String(u.longitude) };
}

function numero(v: string): number {
  return v.trim() === '' ? NaN : Number(v.replace(',', '.'));
}

/** Valida nas mesmas faixas do contrato e devolve o corpo pronto para envio. */
export function validarUnidade(f: FormUnidade): { req?: UnidadeRequest; erros: ErrosUnidade } {
  const erros: ErrosUnidade = {};
  const nome = f.nome.trim();
  const latitude = numero(f.latitude);
  const longitude = numero(f.longitude);
  if (nome.length < 3 || nome.length > 120) erros.nome = 'O nome deve ter de 3 a 120 caracteres.';
  if (f.tipo !== 'UBS' && f.tipo !== 'UPA') erros.tipo = 'Escolha UBS ou UPA.';
  if (!(latitude >= -90 && latitude <= 90)) erros.latitude = 'Latitude entre -90 e 90 (ex.: -25.4284).';
  if (!(longitude >= -180 && longitude <= 180)) erros.longitude = 'Longitude entre -180 e 180 (ex.: -49.2733).';
  return Object.keys(erros).length ? { erros } : { req: { nome, tipo: f.tipo, latitude, longitude }, erros };
}

export function ordenarPorNome(unidades: Unidade[]): Unidade[] {
  return [...unidades].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
