import { describe, expect, it } from 'vitest';
import { rotuloCongestionamento, segmentosCongestionamento } from './congestionamento';
import { formatarDataHora, formatarDuracao, formatarHora, minutosEntre } from './datas';
import { ErroApi, ErroValidacao, codigoPorStatus, mensagemDeErro, temCodigo } from './erros';
import { rotaInicial, rotuloPerfil, temPerfil } from './perfis';
import { PRIORIDADES, gravidade, infoPrioridade } from './prioridade';
import type { Usuario } from './tipos';

describe('prioridade (Manchester)', () => {
  it('ordena os cinco níveis do mais grave ao menos grave', () => {
    expect(PRIORIDADES.map(gravidade)).toEqual([0, 1, 2, 3, 4]);
    expect(gravidade('EMERGENCIA')).toBeLessThan(gravidade('NAO_URGENTE'));
  });

  it('cada nível tem rótulo, cor e forma distintos (nunca só cor)', () => {
    const infos = PRIORIDADES.map(infoPrioridade);
    expect(new Set(infos.map((i) => i.rotulo)).size).toBe(5);
    expect(new Set(infos.map((i) => i.cor)).size).toBe(5);
    expect(new Set(infos.map((i) => i.forma)).size).toBe(5);
    expect(infoPrioridade('EMERGENCIA')).toMatchObject({ rotulo: 'Emergência', cor: 'vermelho', forma: 'cruz' });
    expect(infoPrioridade('NAO_URGENTE').cor).toBe('azul');
  });
});

describe('congestionamento', () => {
  it('rótulo e segmentos por nível', () => {
    expect(rotuloCongestionamento('ALTO')).toBe('Muito cheia');
    expect(rotuloCongestionamento('BAIXO')).toBe('Movimento baixo');
    expect(rotuloCongestionamento('MEDIO')).toBe('Movimento moderado');
    expect([segmentosCongestionamento('BAIXO'), segmentosCongestionamento('MEDIO'), segmentosCongestionamento('ALTO')]).toEqual([1, 2, 3]);
  });
});

describe('erros', () => {
  it('usa a mensagem do codigo do problem+json', () => {
    const e = new ErroApi({ status: 403, codigo: 'CONSENTIMENTO_AUSENTE', correlationId: 'c-1' });
    expect(mensagemDeErro(e)).toMatch(/não autorizou o compartilhamento/);
    expect(temCodigo(e, 'CONSENTIMENTO_AUSENTE')).toBe(true);
    expect(temCodigo(new Error('x'), 'CONSENTIMENTO_AUSENTE')).toBe(false);
  });

  it('cai para a mensagem do status quando o codigo é desconhecido', () => {
    expect(mensagemDeErro(new ErroApi({ status: 503, codigo: 'OUTRO' }))).toMatch(/fora do ar/);
    expect(mensagemDeErro(new Error('qualquer'))).toMatch(/Algo deu errado/);
    expect(mensagemDeErro(new ErroValidacao('Informe o nome.'))).toBe('Informe o nome.');
  });

  it('mapeia status HTTP para codigo', () => {
    expect([400, 401, 403, 404, 409, 502, 503, 504, 500].map(codigoPorStatus)).toEqual([
      'REQUISICAO_INVALIDA',
      'NAO_AUTENTICADO',
      'SEM_PERMISSAO',
      'RECURSO_NAO_ENCONTRADO',
      'TRANSICAO_INVALIDA',
      'AGREGACAO_FALHOU',
      'DEPENDENCIA_INDISPONIVEL',
      'DEPENDENCIA_INDISPONIVEL',
      'ERRO_DESCONHECIDO',
    ]);
  });
});

describe('perfis', () => {
  const u = (...roles: Usuario['roles']): Usuario => ({ id: 'x', nome: 'X', roles });

  it('redireciona cada perfil para a sua área', () => {
    expect(rotaInicial(u('PACIENTE'))).toBe('/paciente/unidades');
    expect(rotaInicial(u('ATENDENTE'))).toBe('/atendimento');
    expect(rotaInicial(u('PROFISSIONAL'))).toBe('/atendimento');
    expect(rotaInicial(u('GESTOR'))).toBe('/gestao/indicadores');
    expect(rotaInicial(u())).toBe('/entrar');
  });

  it('verifica perfis e rótulos', () => {
    expect(temPerfil(u('GESTOR'), 'GESTOR', 'ATENDENTE')).toBe(true);
    expect(temPerfil(u('PACIENTE'), 'GESTOR')).toBe(false);
    expect(temPerfil(null, 'GESTOR')).toBe(false);
    expect(rotuloPerfil('PROFISSIONAL')).toBe('Profissional de saúde');
  });
});

describe('datas', () => {
  it('formata no fuso de Curitiba', () => {
    expect(formatarHora('2026-06-14T10:30:00-03:00')).toBe('10:30');
    expect(formatarDataHora('2026-06-14T10:30:00-03:00')).toBe('14/06/2026, 10:30');
  });

  it('calcula minutos decorridos sem negativos', () => {
    const agora = new Date('2026-06-14T11:00:00-03:00');
    expect(minutosEntre('2026-06-14T10:30:00-03:00', agora)).toBe(30);
    expect(minutosEntre('2026-06-14T12:00:00-03:00', agora)).toBe(0);
  });

  it('formata duração', () => {
    expect(formatarDuracao(45)).toBe('45\u00a0min');
    expect(formatarDuracao(120)).toBe('2\u00a0h');
    expect(formatarDuracao(135)).toBe('2\u00a0h 15\u00a0min');
  });
});
