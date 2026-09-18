import type { NextAuthConfig } from 'next-auth'

/**
 * Configuración sin dependencias de base de datos. La usa `proxy.ts` para leer
 * la sesión sin arrastrar Prisma ni bcrypt al interceptor de requests.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  // next start en local no setea AUTH_URL. Sin esto Auth.js rechaza el host.
  trustHost: true,
  // Obligatorio con el provider de credenciales: no soporta sesiones en base.
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
