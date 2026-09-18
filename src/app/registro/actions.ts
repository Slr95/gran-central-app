'use server'

import { AuthError } from 'next-auth'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signIn } from '@/auth'
import { prisma } from '@/lib/prisma'

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá tu nombre.'),
    email: z.email('Ingresá un email válido.').transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8, 'La contraseña tiene que tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
    redirectTo: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

function safeRedirect(path: string | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

export async function registerCustomer(_prev: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    redirectTo: formData.get('redirectTo') || undefined,
  })

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Revisá los datos.'
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: 'CUSTOMER',
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'Ya hay una cuenta con ese email. Ingresá o usá otro.'
    }
    throw error
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirect(parsed.data.redirectTo),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return 'La cuenta se creó, pero no pudimos iniciar sesión. Probá ingresar.'
    }
    throw error
  }
}
