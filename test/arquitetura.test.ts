// Teste de arquitetura: roda o dependency-cruiser com as regras de .dependency-cruiser.cjs
// e verifica por varredura de código que `fetch` e APIs do navegador ficam fora do domínio.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(import.meta.dirname, '..');
const SRC = join(RAIZ, 'src');

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? arquivos(join(dir, e.name)) : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

const codigo = arquivos(SRC).map((f) => ({ caminho: relative(RAIZ, f), texto: readFileSync(f, 'utf8') }));

describe('arquitetura', () => {
  it('respeita as regras de camadas e de isolamento de features (dependency-cruiser)', () => {
    let saida: string;
    try {
      saida = execFileSync(
        process.execPath,
        [join(RAIZ, 'node_modules/dependency-cruiser/bin/dependency-cruise.mjs'), 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'],
        { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
    } catch (e) {
      saida = (e as { stdout: string }).stdout;
    }
    const { summary } = JSON.parse(saida) as {
      summary: { violations: { rule: { name: string }; from: string; to: string }[]; totalCruised: number };
    };
    const violacoes = summary.violations.map((v) => `${v.rule.name}: ${v.from} → ${v.to}`);
    expect(summary.totalCruised).toBeGreaterThan(50);
    expect(violacoes).toEqual([]);
  }, 60_000);

  it('fetch só existe em shared/infrastructure/httpClient.ts', () => {
    const usos = codigo.filter((a) => /\bfetch\s*\(/.test(a.texto)).map((a) => a.caminho);
    expect(usos).toEqual(['src/shared/infrastructure/httpClient.ts']);
  });

  it('domain não usa APIs do navegador nem React', () => {
    const proibido = /\b(fetch|window|document|navigator|localStorage|sessionStorage|XMLHttpRequest|useState|useEffect)\b/;
    const violacoes = codigo
      .filter((a) => /\/domain\//.test(a.caminho))
      .filter((a) => proibido.test(a.texto.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')))
      .map((a) => a.caminho);
    expect(violacoes).toEqual([]);
  });

  it('cada feature tem as quatro camadas', () => {
    const features = readdirSync(join(SRC, 'features')).flatMap((area) =>
      readdirSync(join(SRC, 'features', area)).map((f) => join(SRC, 'features', area, f)),
    );
    expect(features.length).toBeGreaterThanOrEqual(12);
    for (const f of features) {
      expect(readdirSync(f).filter((d) => ['domain', 'application', 'infrastructure', 'ui'].includes(d)).sort(), relative(SRC, f)).toEqual([
        'application',
        'domain',
        'infrastructure',
        'ui',
      ]);
    }
  });
});
