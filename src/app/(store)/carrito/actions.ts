'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrCreateCart } from '@/lib/cart'
import { prisma } from '@/lib/prisma'

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
})

export async function addToCart(_prev: { ok?: boolean; error?: string } | undefined, formData: FormData) {
  const parsed = addSchema.safeParse({
    variantId: formData.get('variantId'),
    quantity: formData.get('quantity') ?? 1,
  })

  if (!parsed.success) {
    return { error: 'Cantidad o variante inválida.' }
  }

  const variant = await prisma.productVariant.findFirst({
    where: { id: parsed.data.variantId, isActive: true, product: { status: 'ACTIVE' } },
  })

  if (!variant) {
    return { error: 'Esa variante ya no está disponible.' }
  }

  const cart = await getOrCreateCart()
  const existing = cart.items.find((item) => item.variantId === variant.id)
  const nextQty = (existing?.quantity ?? 0) + parsed.data.quantity

  if (!variant.allowBackorder && nextQty > variant.stock) {
    return { error: `Solo hay ${variant.stock} unidad(es) disponibles.` }
  }

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId: variant.id, quantity: parsed.data.quantity },
    })
  }

  revalidatePath('/carrito')
  revalidatePath('/')
  return { ok: true }
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await getOrCreateCart()
  const item = cart.items.find((entry) => entry.id === itemId)
  if (!item) return

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
  } else {
    if (!item.variant.allowBackorder && quantity > item.variant.stock) {
      return
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
  }

  revalidatePath('/carrito')
  revalidatePath('/checkout')
}

export async function removeCartItem(itemId: string) {
  const cart = await getOrCreateCart()
  const item = cart.items.find((entry) => entry.id === itemId)
  if (!item) return

  await prisma.cartItem.delete({ where: { id: itemId } })
  revalidatePath('/carrito')
  revalidatePath('/checkout')
}
