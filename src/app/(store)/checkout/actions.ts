'use server'

import { Prisma, type Province } from '@prisma/client'
import { redirect, unstable_rethrow } from 'next/navigation'
import { z } from 'zod'
import { cartTotals, getCart } from '@/lib/cart'
import { requireUser } from '@/lib/guards'
import { createCheckoutPreference, isMercadoPagoConfigured } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { PROVINCE_LABELS } from '@/lib/provinces'
import { getStoreSettings } from '@/lib/settings'

const provinceEnum = z.enum(Object.keys(PROVINCE_LABELS) as [Province, ...Province[]])

const checkoutSchema = z.object({
  recipient: z.string().trim().min(2, 'Ingresá el nombre de quien recibe.'),
  phone: z.string().trim().min(8, 'Ingresá un teléfono válido.'),
  dni: z.string().trim().optional(),
  street: z.string().trim().min(2),
  number: z.string().trim().min(1),
  apartment: z.string().trim().optional(),
  city: z.string().trim().min(2),
  province: provinceEnum,
  postalCode: z.string().trim().min(4),
  notes: z.string().trim().optional(),
  shippingRateId: z.string().min(1, 'Elegí un método de envío.'),
  paymentProvider: z.enum(['BANK_TRANSFER', 'CASH_ON_PICKUP', 'MERCADO_PAGO']),
})

export async function placeOrder(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser()
  const email = user.email
  if (!email) {
    return { error: 'Tu cuenta no tiene email. Cerrá sesión y volvé a ingresar.' }
  }

  const parsed = checkoutSchema.safeParse({
    recipient: formData.get('recipient'),
    phone: formData.get('phone'),
    dni: formData.get('dni') || undefined,
    street: formData.get('street'),
    number: formData.get('number'),
    apartment: formData.get('apartment') || undefined,
    city: formData.get('city'),
    province: formData.get('province'),
    postalCode: formData.get('postalCode'),
    notes: formData.get('notes') || undefined,
    shippingRateId: formData.get('shippingRateId'),
    paymentProvider: formData.get('paymentProvider'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos del envío.' }
  }

  const cart = await getCart()
  if (!cart || cart.items.length === 0) {
    return { error: 'El carrito está vacío.' }
  }

  const { hasOversized, subtotal } = cartTotals(cart)
  const settings = await getStoreSettings()

  const rate = await prisma.shippingRate.findFirst({
    where: { id: parsed.data.shippingRateId, isActive: true, zone: { isActive: true } },
    include: { zone: true },
  })

  if (!rate) {
    return { error: 'Ese método de envío ya no está disponible.' }
  }

  if (hasOversized && !rate.allowsOversized) {
    return { error: 'El carrito tiene un mueble grande que no entra en ese envío.' }
  }

  if (parsed.data.paymentProvider === 'CASH_ON_PICKUP' && rate.methodType !== 'PICKUP') {
    return { error: 'El pago en efectivo solo aplica al retiro en showroom.' }
  }

  if (parsed.data.paymentProvider === 'MERCADO_PAGO' && !isMercadoPagoConfigured()) {
    return {
      error:
        'Mercado Pago no está configurado. Pedile al admin que cargue MP_ACCESS_TOKEN en el .env (credenciales de prueba del panel de desarrolladores).',
    }
  }

  const shippingNumber = Number(rate.price.toString())
  const shippingTotal =
    rate.methodType === 'PICKUP' ||
    (rate.freeOverAmount && subtotal >= Number(rate.freeOverAmount.toString()))
      ? 0
      : shippingNumber

  const discountTotal =
    parsed.data.paymentProvider === 'BANK_TRANSFER'
      ? Math.round((subtotal * settings.transferDiscountPercent) / 100)
      : 0

  const total = subtotal - discountTotal + shippingTotal

  let orderNumber: number | undefined
  let mpRedirect: string | undefined
  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } })
        if (!variant.allowBackorder && variant.stock < item.quantity) {
          throw new Error(`STOCK:${variant.sku}`)
        }
      }

      const created = await tx.order.create({
        data: {
          userId: user.id,
          email,
          phone: parsed.data.phone,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          discountTotal: new Prisma.Decimal(discountTotal.toFixed(2)),
          shippingTotal: new Prisma.Decimal(shippingTotal.toFixed(2)),
          total: new Prisma.Decimal(total.toFixed(2)),
          customerNote: parsed.data.notes,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              imageUrl: item.variant.product.images[0]?.url,
              unitPrice: item.variant.price,
              quantity: item.quantity,
              lineTotal: new Prisma.Decimal(
                (Number(item.variant.price.toString()) * item.quantity).toFixed(2),
              ),
            })),
          },
          addresses: {
            create: {
              kind: 'SHIPPING',
              recipient: parsed.data.recipient,
              phone: parsed.data.phone,
              dni: parsed.data.dni,
              street: parsed.data.street,
              number: parsed.data.number,
              apartment: parsed.data.apartment,
              city: parsed.data.city,
              province: parsed.data.province,
              postalCode: parsed.data.postalCode,
              notes: parsed.data.notes,
            },
          },
          payments: {
            create: {
              provider: parsed.data.paymentProvider,
              status: 'PENDING',
              amount: new Prisma.Decimal(total.toFixed(2)),
            },
          },
          shipment: {
            create: {
              methodType: rate.methodType,
              methodName: rate.name,
              cost: new Prisma.Decimal(shippingTotal.toFixed(2)),
            },
          },
        },
      })

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: 'SALE',
            quantity: -item.quantity,
            orderId: created.id,
            reason: `Orden #${created.number}`,
          },
        })
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      return created
    })
    orderNumber = order.number

    if (parsed.data.paymentProvider === 'MERCADO_PAGO') {
      const preference = await createCheckoutPreference({
        orderId: order.id,
        orderNumber: order.number,
        email,
        shippingTotal,
        items: cart.items.map((item) => ({
          id: item.variant.sku,
          title: `${item.variant.product.name} · ${item.variant.name}`,
          quantity: item.quantity,
          unitPrice: Number(item.variant.price.toString()),
          pictureUrl: item.variant.product.images[0]?.url,
        })),
      })

      await prisma.payment.updateMany({
        where: { orderId: order.id, provider: 'MERCADO_PAGO' },
        data: { preferenceId: preference.preferenceId },
      })

      mpRedirect = preference.checkoutUrl
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('STOCK:')) {
      return { error: `No hay stock suficiente de ${error.message.slice(6)}.` }
    }
    if (parsed.data.paymentProvider === 'MERCADO_PAGO' && orderNumber) {
      redirect(`/checkout/gracias?orden=${orderNumber}&mp=error`)
    }
    throw error
  }

  if (mpRedirect) {
    redirect(mpRedirect)
  }

  redirect(`/checkout/gracias?orden=${orderNumber}`)
}

export async function resumeMercadoPagoPayment(orderId: string) {
  const user = await requireUser()
  if (!isMercadoPagoConfigured()) {
    return { error: 'Mercado Pago no está configurado.' }
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true, payments: true },
  })

  if (!order || !user.email) {
    return { error: 'No encontramos ese pedido.' }
  }

  const payment = order.payments.find((entry) => entry.provider === 'MERCADO_PAGO')
  if (!payment || payment.status === 'APPROVED') {
    return { error: 'Ese pedido no tiene un pago de Mercado Pago pendiente.' }
  }

  try {
    const preference = await createCheckoutPreference({
      orderId: order.id,
      orderNumber: order.number,
      email: user.email,
      shippingTotal: Number(order.shippingTotal.toString()),
      items: order.items.map((item) => ({
        id: item.sku,
        title: `${item.productName} · ${item.variantName}`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toString()),
        pictureUrl: item.imageUrl,
      })),
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { preferenceId: preference.preferenceId },
    })

    redirect(preference.checkoutUrl)
  } catch (error) {
    unstable_rethrow(error)
    console.error('resume Mercado Pago', error)
    redirect(`/checkout/gracias?orden=${order.number}&mp=error`)
  }
}
