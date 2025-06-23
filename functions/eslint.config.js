// functions/eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // Ajoute ici tes règles personnalisées si besoin
    }
  }
]
