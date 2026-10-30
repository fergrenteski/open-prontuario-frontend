import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // fetch só existe no httpClient (regra de arquitetura também verificada em teste).
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Use shared/infrastructure/httpClient.ts.' }],
    },
  },
  {
    files: ['src/shared/infrastructure/httpClient.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    // Testes não passam por Fast Refresh.
    files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
);
