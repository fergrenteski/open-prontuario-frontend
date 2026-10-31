// Formatação de datas sempre no fuso de Curitiba, independente do dispositivo.
const FUSO = 'America/Sao_Paulo';

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO });
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSO,
});

export function formatarHora(iso: string): string {
  return hora.format(new Date(iso));
}

export function formatarDataHora(iso: string): string {
  return dataHora.format(new Date(iso));
}

export function minutosEntre(inicioIso: string, agora: Date): number {
  return Math.max(0, Math.floor((agora.getTime() - new Date(inicioIso).getTime()) / 60000));
}

// Espaço não separável entre número e unidade (não quebra "34 / min" em duas linhas).
const NB = '\u00a0';

export function formatarDuracao(min: number): string {
  if (min < 60) return `${min}${NB}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}${NB}h` : `${h}${NB}h ${m}${NB}min`;
}
