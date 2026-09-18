'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
})

export async function createCategory(_prev: { error?: string } | undefined, formData: FormData) {
  await requireAdmin()
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) return { error: 'Completá el nombre de la categoría.' }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name)
  const last = await prisma.category.findFirst({ orderBy: { position: 'desc' } })

  try {
    await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        position: (last?.position ?? 0) + 1,
      },
    })
  } catch {
    return { error: 'Ya existe una categoría con ese slug.' }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
}

export async function toggleCategory(id: string, isActive: boolean) {
  await requireAdmin()
  await prisma.category.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/categorias')
  revalidatePath('/')
}
