import Image from 'next/image'
import Link from 'next/link'
import { isOnSale } from '@/lib/catalog'
import { discountPercent, formatARS } from '@/lib/utils'

type ProductCardProduct = {
  id: string
  name: string
  slug: string
  images: Array<{ url: string; alt: string | null }>
  variants: Array<{
    price: { toString(): string }
    compareAtPrice: { toString(): string } | null
  }>
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const variant = product.variants[0]
  if (!variant) return null

  const off = isOnSale(variant.price, variant.compareAtPrice)
    ? discountPercent(variant.price.toString(), variant.compareAtPrice!.toString())
    : 0

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group overflow-hidden rounded-xl border border-brand-100 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-4/3 bg-brand-50">
        {product.images[0] && (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
            {off}% OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatARS(variant.price.toString())}</span>
          {off > 0 && variant.compareAtPrice && (
            <span className="text-sm text-muted line-through">
              {formatARS(variant.compareAtPrice.toString())}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
