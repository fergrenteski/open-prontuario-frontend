import type { ReactNode } from 'react';

// Ícones próprios em SVG (traço 2px), sem biblioteca. Decorativos por padrão (aria-hidden).
const ICONES = {
  cruz: <path d="M8.5 1.5h7v7h7v7h-7v7h-7v-7h-7v-7h7z" fill="currentColor" stroke="none" />,
  triangulo: <path d="M12 2.5 22.5 21h-21z" fill="currentColor" stroke="none" />,
  losango: <path d="M12 1.5 22.5 12 12 22.5 1.5 12z" fill="currentColor" stroke="none" />,
  quadrado: <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill="currentColor" stroke="none" />,
  circulo: <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />,
  presente: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
      <path d="m8.5 11.5 2.5 2.5 4.5-5" />
      <path d="M2 21h20" />
    </>
  ),
  caminho: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="m9 21 2.5-6 3 3V22" />
      <path d="M7 12.5 9.5 9l4-1 2.5 3.5 3 1" />
      <path d="m11.5 15-1-4" />
    </>
  ),
  atendimento: (
    <>
      <path d="M5 3v6a5 5 0 0 0 10 0V3" />
      <path d="M10 14v2a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="12" r="2" />
    </>
  ),
  cadeado: (
    <>
      <rect x="4" y="10.5" width="16" height="11" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  cadeadoAberto: (
    <>
      <rect x="4" y="10.5" width="16" height="11" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 7.6-1.7" />
      <path d="m3 3 18 18" />
    </>
  ),
  local: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  alerta: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v6M12 16.5v.5" />
    </>
  ),
  ok: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m7.5 12 3 3 6-6" />
    </>
  ),
  atualizar: (
    <>
      <path d="M20 11a8 8 0 0 0-14.7-4.3L4 8.5" />
      <path d="M4 3.5v5h5" />
      <path d="M4 13a8 8 0 0 0 14.7 4.3l1.3-1.8" />
      <path d="M20 20.5v-5h-5" />
    </>
  ),
  sair: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  ficha: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10v-6z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  banco: (
    <>
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  raio: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  relogio: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  mais: <path d="M12 5v14M5 12h14" />,
  lixeira: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4h6v3" />
    </>
  ),
  editar: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  unidade: (
    <>
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M10 13h4M12 11v4M9 21v-4h6v4" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.7.8 3 2.5 3.5 5.2" />
    </>
  ),
  grafico: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15v3M12 10v8M17 6v12" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof ICONES;

interface Props {
  nome: NomeIcone;
  tamanho?: number;
  rotulo?: string;
  className?: string;
}

export function Icone({ nome, tamanho = 18, rotulo, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
    >
      {ICONES[nome]}
    </svg>
  );
}
