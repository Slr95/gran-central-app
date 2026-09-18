import Image from 'next/image'
import Link from 'next/link'
import { cartTotals, getCart } from '@/lib/cart'
import { formatARS } from '@/lib/utils'
import { CartItemControls } from './cart-item-controls'

export const metadata = { title: 'Carrito' }

export default async function CartPage() {
  const cart = await getCart()
  const items = cart?.items ?? []
  const { subtotal } = cart ? cartTotals(cart) : { subtotal: 0 }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Carrito</h1>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">
          El carrito está vacío.{' '}
          <Link href="/" className="text-brand-600 hover:underline">
            Seguir comprando
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-brand-100 rounded-xl border border-brand-100 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-brand-50">
                  {item.variant.product.images[0] && (
                    <Image
                      src={item.variant.product.images[0].url}
                      alt={item.variant.product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/producto/${item.variant.product.slug}`} className="font-medium hover:text-brand-600">
                    {item.variant.product.name}
                  </Link>
                  <p className="text-sm text-muted">{item.variant.name}</p>
                  <p className="mt-1 font-semibold">{formatARS(item.variant.price.toString())}</p>
                  <div className="mt-3">
                    <CartItemControls itemId={item.id} quantity={item.quantity} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-brand-100 bg-white p-5">
            <p className="text-sm text-muted">Subtotal</p>
            <p className="mt-1 text-2xl font-bold">{formatARS(subtotal)}</p>
            <p className="mt-2 text-xs text-muted">El envío y el descuento por transferencia se calculan en el checkout.</p>
            <Link
              href="/checkout"
              className="mt-6 block rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white hover:bg-brand-700"
            >
              Ir a pagar
            </Link>
          </aside>
        </div>
      )}
    </>
  )
}
