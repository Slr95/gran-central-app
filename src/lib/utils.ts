import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

/**
 * Los importes salen de Prisma como Decimal, que no se puede serializar de un
 * server component a un client component. Siempre formatear o convertir antes
 * de cruzar ese límite.
 */
export function formatARS(amount: number | string): string {
  return currencyFormatter.format(Number(amount))
}

export function discountPercent(price: number | string, compareAt: number | string): number {
  const p = Number(price)
  const c = Number(compareAt)
  if (!c || c <= p) return 0
  return Math.round(((c - p) / c) * 100)
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
