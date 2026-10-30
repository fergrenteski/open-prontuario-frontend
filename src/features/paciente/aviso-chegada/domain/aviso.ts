// RF03/RF04/RF05: aviso de chegada com sintomas e autorização opcional do prontuário. Domínio puro.
import type { RegistroFila } from '../../../../shared/domain/fila';

export const SINTOMAS_COMUNS = [
  'febre',
  'dor de cabeça',
  'dor no peito',
  'falta de ar',
  'tosse',
  'vômito',
  'dor abdominal',
  'tontura',
] as const;

export const VALIDADE_PADRAO_DIAS = 3;

export interface AvisoChegada {
  sintomas: string[];
  tempoEstimadoChegadaMin?: number;
  autorizarProntuario: boolean;
  validadeConsentimentoDias: number;
}

export type RegistroAviso = RegistroFila & { avisos?: string[] };

/** Remove espaços extras e repetidos (sem diferenciar maiúsculas). */
export function normalizarSintomas(sintomas: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const s of sintomas) {
    const t = s.trim().replace(/\s+/g, ' ');
    const chave = t.toLocaleLowerCase('pt-BR');
    if (t && !vistos.has(chave)) {
      vistos.add(chave);
      saida.push(t);
    }
  }
  return saida;
}

export type ErrosAviso = Partial<Record<'sintomas' | 'tempoEstimadoChegadaMin' | 'validadeConsentimentoDias', string>>;

/** Mesmas faixas do contrato (AvisoChegadaRequest + validade do consentimento). */
export function validarAviso(a: AvisoChegada): ErrosAviso {
  const erros: ErrosAviso = {};
  const sintomas = normalizarSintomas(a.sintomas);
  if (sintomas.length === 0) erros.sintomas = 'Informe pelo menos um sintoma.';
  else if (sintomas.length > 20) erros.sintomas = 'Informe no máximo 20 sintomas.';
  else if (sintomas.some((s) => s.length < 2 || s.length > 120)) erros.sintomas = 'Cada sintoma deve ter de 2 a 120 caracteres.';

  const t = a.tempoEstimadoChegadaMin;
  if (t !== undefined && (!Number.isInteger(t) || t < 0 || t > 600)) {
    erros.tempoEstimadoChegadaMin = 'Use um número inteiro de minutos entre 0 e 600.';
  }
  const v = a.validadeConsentimentoDias;
  if (a.autorizarProntuario && (!Number.isInteger(v) || v < 1 || v > 365)) {
    erros.validadeConsentimentoDias = 'A autorização vale de 1 a 365 dias.';
  }
  return erros;
}

export function semErros(e: ErrosAviso): boolean {
  return Object.keys(e).length === 0;
}
