'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'

const settingsSchema = z.object({
  transferDiscountPercent: z.coerce.number().min(0).max(50),
  cbu: z.string().trim(),
  alias: z.string().trim(),
  titular: z.string().trim(),
  banco: z.string().trim(),
  whatsapp: z.string().trim(),
  freeShippingThreshold: z.coerce.number().min(0),
})

export async function saveStoreSettings(_prev: { ok?: boolean; error?: string } | undefined, formData: FormData) {
  await requireAdmin()
  const parsed = settingsSchema.safeParse({
    transferDiscountPercent: formData.get('transferDiscountPercent'),
    cbu: formData.get('cbu'),
    alias: formData.get('alias'),
    titular: formData.get('titular'),
    banco: formData.get('banco'),
    whatsapp: formData.get('whatsapp'),
    freeShippingThreshold: formData.get('freeShippingThreshold'),
  })

  if (!parsed.success) {
    return { error: 'Revisá los números. El descuento tiene que estar entre 0 y 50.' }
  }

  const rows: Array<{ key: string; value: Prisma.InputJsonValue }> = [
    { key: 'payments.transferDiscountPercent', value: parsed.data.transferDiscountPercent },
    {
      key: 'payments.bankAccount',
      value: {
        cbu: parsed.data.cbu,
        alias: parsed.data.alias,
        titular: parsed.data.titular,
        banco: parsed.data.banco,
      },
    },
    { key: 'store.whatsapp', value: parsed.data.whatsapp },
    { key: 'store.freeShippingThreshold', value: parsed.data.freeShippingThreshold },
  ]

  for (const row of rows) {
    await prisma.storeSetting.upsert({
      where: { key: row.key },
      update: { value: row.value },
      create: { key: row.key, value: row.value },
    })
  }

  revalidatePath('/admin/configuracion')
  revalidatePath('/')
  revalidatePath('/checkout')
  return { ok: true }
}
