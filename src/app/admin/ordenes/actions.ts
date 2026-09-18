'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'

export async function markPaymentApproved(paymentId: string) {
  const admin = await requireAdmin()

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
    include: { order: true },
  })

  await prisma.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: 'APPROVED', status: 'CONFIRMED', confirmedAt: new Date() },
  })

  revalidatePath('/admin/ordenes')
  revalidatePath(`/admin/ordenes/${payment.orderId}`)
}
