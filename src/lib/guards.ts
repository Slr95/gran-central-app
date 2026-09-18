import { redirect } from 'next/navigation'
import { auth } from '@/auth'

/**
 * El proxy ya bloquea /admin, pero eso protege la navegación, no los datos.
 * Toda page o server action del panel tiene que volver a verificar acá:
 * si mañana alguien agrega una ruta fuera del matcher, no queda expuesta.
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return session.user
}

export async function requireUser() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return session.user
}
