import Image from 'next/image'
import Link from 'next/link'
import { cartTotals, getCart } from '@/lib/cart'
import { requireUser } from '@/lib/guards'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { getStoreSettings } from '@/lib/settings'
import { formatARS } from '@/lib/utils'
import { CheckoutForm } from './checkout-form'

export const metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  await requireUser()
  const [cart, settings] = await Promise.all([getCart(), getStoreSettings()])
  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-6 text-muted">
          No hay nada para pagar.{' '}
          <Link href="/carrito" className="text-brand-600 hover:underline">
            Volver al carrito
          </Link>
        </p>
      </>
    )
  }

  const { subtotal, hasOversized } = cartTotals(cart!)
  const rates = await prisma.shippingRate.findMany({
    where: {
      isActive: true,
      zone: { isActive: true },
      ...(hasOversized ? { allowsOversized: true } : {}),
    },
    include: { zone: true },
    orderBy: { price: 'asc' },
  })

  const transferDiscount = Math.round((subtotal * settings.transferDiscountPercent) / 100)

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <CheckoutForm
          rates={rates.map((rate) => ({
            id: rate.id,
            name: `${rate.name} · ${rate.zone.name}`,
            methodType: rate.methodType,
            price: rate.price.toString(),
            freeOverAmount: rate.freeOverAmount?.toString() ?? null,
            estimatedDaysMin: rate.estimatedDaysMin,
            estimatedDaysMax: rate.estimatedDaysMax,
            allowsOversized: rate.allowsOversized,
          }))}
          hasOversized={hasOversized}
          transferDiscountPercent={settings.transferDiscountPercent}
          subtotal={subtotal}
          mercadoPagoReady={isMercadoPagoConfigured()}
        />

        <aside className="h-fit rounded-xl border border-brand-100 bg-white p-5">
          <h2 className="font-semibold">Resumen</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <div className="relative size-12 shrink-0 overflow-hidden rounded bg-brand-50">
                  {item.variant.product.images[0] && (
                    <Image
                      src={item.variant.product.images[0].url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.variant.product.name}</p>
                  <p className="text-muted">
                    {item.quantity} × {formatARS(item.variant.price.toString())}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatARS(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-emerald-700">
              <dt>Si transferís (−{settings.transferDiscountPercent}%)</dt>
              <dd>−{formatARS(transferDiscount)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </>
  )
}
