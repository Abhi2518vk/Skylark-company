import js from '@eslint/js';
import globals from 'globals';
export default [js.configs.recommended, { files: ['**/*.js', '**/*.mjs'], languageOptions: { globals: { ...globals.browser, ...globals.node } } }, { ignores: ['dist/**', 'node_modules/**', 'artifacts/**'] }];
