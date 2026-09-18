import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const CART_COOKIE = 'gc_cart'

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { position: 'asc' as const }, take: 1 } },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CartInclude

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>

async function readToken() {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value
}

async function writeToken(token: string) {
  const store = await cookies()
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function getCart(): Promise<CartWithItems | null> {
  const session = await auth()
  const token = await readToken()

  if (session?.user) {
    const owned = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: cartInclude,
    })
    if (owned) return owned
  }

  if (!token) return null

  return prisma.cart.findUnique({
    where: { token },
    include: cartInclude,
  })
}

export async function getOrCreateCart(): Promise<CartWithItems> {
  const existing = await getCart()
  if (existing) {
    const session = await auth()
    if (session?.user && !existing.userId) {
      return prisma.cart.update({
        where: { id: existing.id },
        data: { userId: session.user.id },
        include: cartInclude,
      })
    }
    return existing
  }

  const session = await auth()
  const token = (await readToken()) ?? randomBytes(16).toString('hex')
  await writeToken(token)

  return prisma.cart.create({
    data: {
      token,
      userId: session?.user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
    include: cartInclude,
  })
}

export function cartTotals(cart: CartWithItems) {
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price.toString()) * item.quantity
  }, 0)

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const hasOversized = cart.items.some((item) => item.variant.isOversized)

  return { subtotal, itemCount, hasOversized }
}
