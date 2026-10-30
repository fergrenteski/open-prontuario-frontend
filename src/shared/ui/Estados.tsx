import type { ReactNode } from 'react';
import { ErroApi, mensagemDeErro } from '../domain/erros';
import { Icone } from './Icone';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <span className="carregando__pulso" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="estado">
      <h3>{titulo}</h3>
      {children}
    </div>
  );
}

interface AlertaErroProps {
  erro: unknown;
  /** Mensagem específica da tela; se ausente usa a mensagem por `codigo`. */
  mensagem?: string;
  aoTentarDeNovo?: () => void;
}

export function AlertaErro({ erro, mensagem, aoTentarDeNovo }: AlertaErroProps) {
  const rastreio = erro instanceof ErroApi ? erro.correlationId : undefined;
  return (
    <div className="alerta" role="alert">
      <Icone nome="alerta" />
      <div className="alerta__corpo">
        <p>{mensagem ?? mensagemDeErro(erro)}</p>
        {rastreio && <p className="alerta__rastreio">Código de rastreio: {rastreio}</p>}
        {aoTentarDeNovo && (
          <div>
            <button type="button" className="btn btn--compacto" onClick={aoTentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Alerta({ tipo, children }: { tipo: 'aviso' | 'sucesso'; children: ReactNode }) {
  return (
    <div className={`alerta alerta--${tipo}`} role="status">
      <Icone nome={tipo === 'sucesso' ? 'ok' : 'alerta'} />
      <div className="alerta__corpo">{children}</div>
    </div>
  );
}
