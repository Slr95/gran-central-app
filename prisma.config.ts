import 'dotenv/config'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Las migraciones tienen que ir por la conexión directa de Neon, no por el
    // pooler: el pooler no soporta los comandos DDL que usa el schema engine.
    url: env('DIRECT_URL'),
  },
})
