'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { CLOUDINARY_FOLDER, destroyImage, isCloudinaryConfigured, signUpload } from '@/lib/cloudinary'
import { requireAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'
import { productSchema } from '@/lib/validations/product'

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

function refreshProductViews(slug?: string) {
  revalidatePath('/admin/productos')
  revalidatePath('/')
  if (slug) revalidatePath(`/producto/${slug}`)
}

/** El navegador pide la firma acá y sube el archivo directo a Cloudinary. */
export async function createUploadSignature() {
  await requireAdmin()

  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary no está configurado. Completá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el .env',
    )
  }

  const timestamp = Math.round(Date.now() / 1000)

  return {
    timestamp,
    signature: signUpload(timestamp),
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: CLOUDINARY_FOLDER,
  }
}

// Recibe `unknown` a propósito: lo que manda el navegador no es confiable y el
// contrato real lo define el schema de zod, no el tipo de TypeScript.
export async function saveProduct(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    const flat = z_flatten(parsed.error)
    return { ok: false, error: 'Revisá los campos marcados.', fieldErrors: flat }
  }

  const data = parsed.data
  const { images, variants, id, ...productFields } = data

  try {
    const productId = await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({
            where: { id },
            data: {
              ...productFields,
              archivedAt: productFields.status === 'ARCHIVED' ? new Date() : null,
            },
          })
        : await tx.product.create({
            data: {
              ...productFields,
              archivedAt: productFields.status === 'ARCHIVED' ? new Date() : null,
            },
          })

      // Imágenes: se reemplaza la lista completa. Las que el admin sacó hay que
      // borrarlas también de Cloudinary, si no quedan pagando storage.
      const previous = await tx.productImage.findMany({ where: { productId: product.id } })
      const keptUrls = new Set(images.map((image) => image.url))
      const removed = previous.filter((image) => !keptUrls.has(image.url))

      await tx.productImage.deleteMany({ where: { productId: product.id } })
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: product.id,
            url: image.url,
            publicId: image.publicId,
            alt: image.alt ?? product.name,
            position: index,
          })),
        })
      }

      for (const variant of variants) {
        const payload = {
          sku: variant.sku,
          name: variant.name,
          price: new Prisma.Decimal(variant.price.toFixed(2)),
          compareAtPrice:
            variant.compareAtPrice === null
              ? null
              : new Prisma.Decimal(variant.compareAtPrice.toFixed(2)),
          stock: variant.stock,
          allowBackorder: variant.allowBackorder,
          isActive: variant.isActive,
          weightKg: variant.weightKg === null ? null : new Prisma.Decimal(variant.weightKg.toFixed(2)),
          lengthCm: variant.lengthCm,
          widthCm: variant.widthCm,
          heightCm: variant.heightCm,
          isOversized: variant.isOversized,
          requiresAssembly: variant.requiresAssembly,
        }

        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id }, data: payload })
        } else {
          await tx.productVariant.create({ data: { ...payload, productId: product.id } })
        }
      }

      // Variantes que el admin sacó del form.
      const submittedIds = variants.map((variant) => variant.id).filter(Boolean) as string[]
      const orphans = await tx.productVariant.findMany({
        where: { productId: product.id, id: { notIn: submittedIds.length ? submittedIds : ['-'] } },
        include: { _count: { select: { orderItems: true } } },
      })

      for (const orphan of orphans) {
        // Si ya se vendió, se desactiva en vez de borrar: hay órdenes apuntando
        // a esa variante y no queremos romper el historial.
        if (orphan._count.orderItems > 0) {
          await tx.productVariant.update({ where: { id: orphan.id }, data: { isActive: false } })
        } else {
          await tx.productVariant.delete({ where: { id: orphan.id } })
        }
      }

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: id ? 'product.update' : 'product.create',
          entity: 'Product',
          entityId: product.id,
          changes: { name: product.name, status: product.status } as Prisma.InputJsonValue,
        },
      })

      return { id: product.id, slug: product.slug, removed }
    })

    // Fuera de la transacción: si Cloudinary falla no queremos deshacer el guardado.
    for (const image of productId.removed) {
      if (image.publicId) {
        await destroyImage(image.publicId).catch(() => undefined)
      }
    }

    refreshProductViews(productId.slug)
    return { ok: true, id: productId.id }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined)?.join(', ') ?? ''
      if (target.includes('sku')) {
        return { ok: false, error: 'Ya existe una variante con ese SKU.' }
      }
      return { ok: false, error: 'Ya existe un producto con ese slug.' }
    }

    console.error('saveProduct', error)
    return { ok: false, error: 'No se pudo guardar el producto.' }
  }
}

export async function setProductStatus(id: string, status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') {
  const admin = await requireAdmin()

  const product = await prisma.product.update({
    where: { id },
    data: { status, archivedAt: status === 'ARCHIVED' ? new Date() : null },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'product.status',
      entity: 'Product',
      entityId: id,
      changes: { status } as Prisma.InputJsonValue,
    },
  })

  refreshProductViews(product.slug)
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  await requireAdmin()
  const product = await prisma.product.update({ where: { id }, data: { isFeatured } })
  refreshProductViews(product.slug)
}

/** zod 4 devuelve el árbol de errores anidado; acá lo aplanamos a campo -> mensajes. */
function z_flatten(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const result: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form'
    result[key] = [...(result[key] ?? []), issue.message]
  }
  return result
}
