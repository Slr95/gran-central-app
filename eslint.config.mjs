// eslint-config-next 16 ya publica flat config, así que se importa directo:
// no hace falta el puente FlatCompat.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
]

export default config
