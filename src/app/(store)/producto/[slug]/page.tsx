import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { isOnSale } from '@/lib/catalog'
import { prisma } from '@/lib/prisma'
import { discountPercent, formatARS } from '@/lib/utils'
import { AddToCartForm } from './add-to-cart-form'

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Producto' }

  const variant = product.variants[0]
  const title = product.metaTitle || product.name
  const description =
    product.metaDescription ||
    product.shortDescription ||
    (variant
      ? `${product.name} a ${formatARS(variant.price.toString())}`
      : product.description?.slice(0, 160))

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.name }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product || product.variants.length === 0) notFound()

  const cheapest = product.variants[0]
  const onSale = isOnSale(cheapest.price, cheapest.compareAtPrice)
  const off = onSale
    ? discountPercent(cheapest.price.toString(), cheapest.compareAtPrice!.toString())
    : 0

  return (
    <article className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-brand-50">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Sin foto</div>
          )}
          {off > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-sm font-bold text-white">
              {off}% OFF
            </span>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.slice(1).map((image) => (
              <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                <Image
                  src={image.url}
                  alt={image.alt ?? product.name}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.category && (
          <p className="text-sm font-medium text-brand-600">{product.category.name}</p>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold">{formatARS(cheapest.price.toString())}</span>
          {onSale && cheapest.compareAtPrice && (
            <span className="text-lg text-muted line-through">
              {formatARS(cheapest.compareAtPrice.toString())}
            </span>
          )}
        </div>
        {product.variants.some((variant) => variant.isOversized) && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Este mueble es voluminoso: el envío se cotiza con flete propio o retiro en showroom.
          </p>
        )}
        {product.description && (
          <p className="mt-6 whitespace-pre-line text-muted">{product.description}</p>
        )}

        <AddToCartForm
          variants={product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price.toString(),
            compareAtPrice: variant.compareAtPrice?.toString() ?? null,
            stock: variant.stock,
            allowBackorder: variant.allowBackorder,
            isOversized: variant.isOversized,
            requiresAssembly: variant.requiresAssembly,
          }))}
        />
      </div>
    </article>
  )
}
