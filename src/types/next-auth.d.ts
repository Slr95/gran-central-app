import type { Role } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role: Role
  }
}

// Ojo: hay que ampliar '@auth/core/jwt', no 'next-auth/jwt'. Este último solo
// re-exporta el módulo, así que ampliarlo crea una interfaz nueva sin efecto.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
