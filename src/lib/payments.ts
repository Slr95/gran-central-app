import { Prisma, type PaymentStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { fetchMercadoPagoPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'

function mapMpStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case 'approved':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CANCELLED'
    case 'refunded':
      return 'REFUNDED'
    case 'charged_back':
      return 'CHARGED_BACK'
    case 'in_process':
    case 'in_mediation':
    case 'authorized':
      return 'IN_PROCESS'
    default:
      return 'PENDING'
  }
}

function feeTotal(details: Array<{ amount?: number }> | undefined) {
  if (!details?.length) return null
  return details.reduce((sum, fee) => sum + (fee.amount ?? 0), 0)
}

async function restoreStock(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } })
  for (const item of items) {
    if (!item.variantId) continue
    await prisma.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    })
    await prisma.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        type: 'CANCELLATION',
        quantity: item.quantity,
        orderId,
        reason: 'Pago Mercado Pago no acreditado',
      },
    })
  }
}

/**
 * Fuente de verdad: la API de Mercado Pago, no el body del webhook.
 * Se puede llamar muchas veces: si el estado ya está aplicado, no toca stock.
 */
export async function applyMercadoPagoPayment(mpPaymentId: string, expectedOrderId?: string) {
  const mp = await fetchMercadoPagoPayment(mpPaymentId)
  const orderId = mp.external_reference
  if (!orderId) {
    throw new Error('El pago de Mercado Pago no trae external_reference.')
  }
  if (expectedOrderId && expectedOrderId !== orderId) {
    throw new Error('El pago no corresponde a este pedido.')
  }

  const nextStatus = mapMpStatus(mp.status)
  const feeAmount = feeTotal(mp.fee_details)
  const netAmount =
    typeof mp.transaction_amount === 'number' && feeAmount !== null
      ? mp.transaction_amount - feeAmount
      : (mp.transaction_details?.net_received_amount ?? null)

  const payment = await prisma.payment.findFirst({
    where: { orderId, provider: 'MERCADO_PAGO' },
    include: { order: { include: { items: true } } },
  })

  if (!payment) {
    throw new Error(`No hay un pago de Mercado Pago para la orden ${orderId}.`)
  }

  const previous = payment.status

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: nextStatus,
      externalId: String(mp.id),
      paymentMethod: mp.payment_type_id ?? mp.payment_method_id,
      installments: mp.installments ?? null,
      feeAmount: feeAmount === null ? null : new Prisma.Decimal(feeAmount.toFixed(2)),
      netAmount: netAmount === null ? null : new Prisma.Decimal(Number(netAmount).toFixed(2)),
      rawPayload: mp as unknown as Prisma.InputJsonValue,
    },
  })

  if (previous === nextStatus) {
    return { orderId, status: nextStatus }
  }

  if (nextStatus === 'APPROVED') {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'APPROVED', status: 'CONFIRMED', confirmedAt: new Date() },
    })
  } else if (nextStatus === 'IN_PROCESS' || nextStatus === 'PENDING') {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus, status: 'PENDING' },
    })
  } else if (nextStatus === 'REJECTED' || nextStatus === 'CANCELLED') {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus, status: 'CANCELLED', cancelledAt: new Date() },
    })
    if (previous !== 'REJECTED' && previous !== 'CANCELLED' && previous !== 'APPROVED') {
      await restoreStock(orderId)
    }
  } else if (nextStatus === 'REFUNDED' || nextStatus === 'CHARGED_BACK') {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus, status: 'REFUNDED' },
    })
  }

  revalidatePath(`/checkout/gracias`)
  revalidatePath('/mi-cuenta')
  revalidatePath('/admin/ordenes')
  revalidatePath(`/admin/ordenes/${orderId}`)

  return { orderId, status: nextStatus }
}
