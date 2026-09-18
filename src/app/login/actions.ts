'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData)
  } catch (error) {
    if (error instanceof AuthError) {
      return 'Email o contraseña incorrectos.'
    }
    // signIn lanza NEXT_REDIRECT cuando el login sale bien. Si lo tragamos acá,
    // el usuario se queda en el formulario sin entender por qué.
    throw error
  }
}
