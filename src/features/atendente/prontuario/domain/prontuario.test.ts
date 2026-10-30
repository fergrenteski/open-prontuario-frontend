import { describe, expect, it } from 'vitest';
import { ErroApi } from '../../../../shared/domain/erros';
import { historicoRecente } from '../../../../shared/domain/prontuario';
import { motivoBloqueio, validarDescricao } from './prontuario';

describe('prontuário (domínio)', () => {
  it('valida a descrição do atendimento', () => {
    expect(validarDescricao('  ok ')).toMatch(/pelo menos 3/);
    expect(validarDescricao('x'.repeat(2001))).toMatch(/no máximo 2000/);
    expect(validarDescricao('Paciente estável, orientado.')).toBeNull();
  });

  it('traduz a recusa do BFF em motivo de bloqueio', () => {
    const e = (status: number, codigo: string) => new ErroApi({ status, codigo });
    expect(motivoBloqueio(e(403, 'CONSENTIMENTO_AUSENTE'))).toBe('sem-consentimento');
    expect(motivoBloqueio(e(403, 'SEM_PERMISSAO'))).toBe('sem-lotacao');
    expect(motivoBloqueio(e(503, 'DEPENDENCIA_INDISPONIVEL'))).toBe('auditoria-indisponivel');
    expect(motivoBloqueio(e(404, 'RECURSO_NAO_ENCONTRADO'))).toBe('sem-prontuario');
    expect(motivoBloqueio(e(500, 'ERRO_DESCONHECIDO'))).toBeNull();
    expect(motivoBloqueio(undefined)).toBeNull();
  });

  it('ordena o histórico do mais recente, respeitando fusos', () => {
    const h = historicoRecente([
      { id: 'a', prontuarioId: 'p', unidadeId: 'u', descricao: 'a', data: '2026-06-14T10:30:00-03:00' },
      { id: 'b', prontuarioId: 'p', unidadeId: 'u', descricao: 'b', data: '2026-06-14T13:00:00Z' },
    ]);
    // 10:30-03:00 = 13:30Z, mais recente que 13:00Z (comparação de texto erraria).
    expect(h.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
