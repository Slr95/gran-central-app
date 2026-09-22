import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { isCloudinaryConfigured } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Editar producto' }

/** Decimal y null no cruzan a un client component: se pasan como string. */
function decimalToInput(value: { toString(): string } | null) {
  return value === null ? '' : value.toString()
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!product) notFound()

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-muted hover:text-brand-600">
        ← Volver a productos
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{product.name}</h1>

      <div className="mt-8">
        <ProductForm
          categories={categories}
          cloudinaryReady={isCloudinaryConfigured()}
          initialValues={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description ?? '',
            shortDescription: product.shortDescription ?? '',
            categoryId: product.categoryId ?? '',
            brand: product.brand ?? '',
            status: product.status,
            isFeatured: product.isFeatured,
            metaTitle: product.metaTitle ?? '',
            metaDescription: product.metaDescription ?? '',
            images: product.images.map((image) => ({
              url: image.url,
              publicId: image.publicId,
              alt: image.alt,
            })),
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              name: variant.name,
              price: decimalToInput(variant.price),
              compareAtPrice: decimalToInput(variant.compareAtPrice),
              stock: String(variant.stock),
              allowBackorder: variant.allowBackorder,
              isActive: variant.isActive,
              weightKg: decimalToInput(variant.weightKg),
              lengthCm: variant.lengthCm === null ? '' : String(variant.lengthCm),
              widthCm: variant.widthCm === null ? '' : String(variant.widthCm),
              heightCm: variant.heightCm === null ? '' : String(variant.heightCm),
              isOversized: variant.isOversized,
              requiresAssembly: variant.requiresAssembly,
            })),
          }}
        />
      </div>
    </div>
  )
}
