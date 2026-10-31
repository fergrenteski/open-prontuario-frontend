/**
 * Regras de arquitetura do frontend (Clean Architecture por feature + vertical slice).
 * Executadas em `npm test` (test/arquitetura.test.ts) e em `npm run test:arch`.
 *
 *   ui → application → domain        infrastructure → application → domain
 *   ui ✕ infrastructure              app/ = composition root (único que vê tudo)
 *   feature ✕ outra feature (só via shared/)
 */
const CAMADA = (c) => `^src/(features/[^/]+/[^/]+|shared)/${c}/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-puro',
      comment: 'domain só depende de domain: nada de application, infrastructure, ui ou app.',
      severity: 'error',
      from: { path: CAMADA('domain') },
      to: { path: ['/(application|infrastructure|ui)/', '^src/app/'] },
    },
    {
      name: 'domain-sem-bibliotecas',
      comment: 'domain não importa React, roteador, MSAL nem qualquer pacote/módulo de I/O.',
      severity: 'error',
      from: { path: CAMADA('domain') },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg', 'npm-unknown', 'core'] },
    },
    {
      name: 'application-sem-detalhes',
      comment: 'application depende só de domain (e de React para hooks); nunca de infrastructure, ui ou app.',
      severity: 'error',
      from: { path: CAMADA('application') },
      to: { path: ['/(infrastructure|ui)/', '^src/app/'] },
    },
    {
      name: 'application-sem-io',
      comment: 'application não usa bibliotecas de I/O (MSAL, roteador): só React.',
      severity: 'error',
      from: { path: CAMADA('application') },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'core'], pathNot: '^node_modules/react/' },
    },
    {
      name: 'ui-nao-conhece-infrastructure',
      severity: 'error',
      from: { path: CAMADA('ui') },
      to: { path: ['/infrastructure/', '^src/app/'] },
    },
    {
      name: 'infrastructure-nao-conhece-ui',
      severity: 'error',
      from: { path: CAMADA('infrastructure') },
      to: { path: ['/ui/', '^src/app/'] },
    },
    {
      name: 'feature-isolada',
      comment: 'Uma feature não importa de outra feature; o que é comum vai para shared/.',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/([^/]+)/' },
      to: { path: '^src/features/', pathNot: '^src/features/$1/$2/' },
    },
    {
      name: 'shared-nao-conhece-features',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: ['^src/features/', '^src/app/'] },
    },
    {
      name: 'arquivo-fora-de-camada',
      comment: 'Código de feature/shared mora numa das quatro camadas (testes ficam de fora da análise).',
      severity: 'error',
      from: { path: '^src/(features/[^/]+/[^/]+|shared)/(?!(domain|application|infrastructure|ui)/)' },
      to: {},
    },
    {
      name: 'sem-ciclos',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['\\.test\\.tsx?$', '\\.css$'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default', 'types'] },
  },
};
