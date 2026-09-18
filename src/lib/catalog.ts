import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const productCardInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 1 },
  variants: { where: { isActive: true }, orderBy: { price: 'asc' as const }, take: 1 },
} satisfies Prisma.ProductInclude

export function isOnSale(price: { toString(): string }, compareAt: { toString(): string } | null) {
  if (!compareAt) return false
  return Number(compareAt.toString()) > Number(price.toString())
}

export async function listActiveProducts(where: Prisma.ProductWhereInput = {}, take?: number) {
  return prisma.product.findMany({
    where: { status: 'ACTIVE', ...where },
    include: productCardInclude,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take,
  })
}

export async function listSaleProducts() {
  const products = await listActiveProducts({
    variants: { some: { isActive: true, compareAtPrice: { not: null } } },
  })

  return products.filter((product) => {
    const variant = product.variants[0]
    return variant ? isOnSale(variant.price, variant.compareAtPrice) : false
  })
}
