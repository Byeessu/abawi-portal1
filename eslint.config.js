import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

// Patterns for files that intentionally allow unused declarations:
//   - PascalCase identifiers (component-like, often kept for symmetry)
//   - leading underscore (conventional "I know this is unused")
const UNUSED_VARS_OPTS = {
  varsIgnorePattern: '^(_|[A-Z])',
  argsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
  ignoreRestSiblings: true,
}

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'node_modules',
    '**/*_backup.*',
    '**/*_corrupted.*',
    'android/app/build/**',
  ]),

  // Browser source code (React app).
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { react, 'unused-imports': unusedImports },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Catch <Foo /> where Foo is not imported. Critical safety net.
      'react/jsx-no-undef': 'error',
      // Mark JSX-used identifiers as "used" so unused-imports stops removing them.
      'react/jsx-uses-vars': 'error',
      // The plugin variant supersedes the native rule: it adds an autofixer for
      // unused imports while preserving the same options for unused vars.
      'no-unused-vars': 'off',
      // Re-enabled now that react/jsx-uses-vars is active — JSX-only imports
      // are now correctly recognized as used.
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', UNUSED_VARS_OPTS],
      // Disable experimental react-hooks rules that require massive refactors
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Service worker — separate scope (no DOM, has WorkerGlobalScope).
  {
    files: ['public/sw.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.serviceworker, ...globals.worker },
      sourceType: 'module',
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // The plugin variant supersedes the native rule: it adds an autofixer for
      // unused imports while preserving the same options for unused vars.
      'no-unused-vars': 'off',
      // DISABLED: this plugin's autofix removes JSX-only imports because
      // ESLint base + react-hooks does NOT register `<Foo />` as a use of
      // `Foo`. To re-enable safely, first install eslint-plugin-react and
      // turn on its `react/jsx-uses-vars` rule.
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': ['warn', UNUSED_VARS_OPTS],
    },
  },

  // Node-side code: build configs, scripts, Netlify functions.
  {
    files: [
      '*.{js,mjs,cjs}',
      'scripts/**/*.{js,mjs,cjs}',
      'netlify/functions/**/*.{js,mjs,cjs}',
    ],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node, ...globals.es2022 },
      sourceType: 'module',
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // The plugin variant supersedes the native rule: it adds an autofixer for
      // unused imports while preserving the same options for unused vars.
      'no-unused-vars': 'off',
      // DISABLED: this plugin's autofix removes JSX-only imports because
      // ESLint base + react-hooks does NOT register `<Foo />` as a use of
      // `Foo`. To re-enable safely, first install eslint-plugin-react and
      // turn on its `react/jsx-uses-vars` rule.
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': ['warn', UNUSED_VARS_OPTS],
    },
  },

  // Tests — Vitest globals + Node + Browser (jsdom).
  {
    files: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/test/**/*.{js,jsx,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // The plugin variant supersedes the native rule: it adds an autofixer for
      // unused imports while preserving the same options for unused vars.
      'no-unused-vars': 'off',
      // DISABLED: this plugin's autofix removes JSX-only imports because
      // ESLint base + react-hooks does NOT register `<Foo />` as a use of
      // `Foo`. To re-enable safely, first install eslint-plugin-react and
      // turn on its `react/jsx-uses-vars` rule.
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': ['warn', UNUSED_VARS_OPTS],
    },
  },
])
