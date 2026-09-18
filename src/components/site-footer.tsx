import Link from 'next/link'
import { getStoreSettings } from '@/lib/settings'

export async function SiteFooter() {
  const settings = await getStoreSettings()
  const wa = settings.whatsapp.replace(/\D/g, '')

  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand-700">Gran Central</p>
          <p className="mt-2 text-sm text-muted">Muebles para living, dormitorio, comedor y oficina.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Comprar</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>
              <Link href="/ofertas" className="hover:text-brand-600">
                Ofertas
              </Link>
            </li>
            <li>
              <Link href="/carrito" className="hover:text-brand-600">
                Carrito
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Pago y envío</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Transferencia con {settings.transferDiscountPercent}% de descuento</li>
            <li>Tarjetas y cuotas con Mercado Pago</li>
            <li>Retiro en showroom o flete a domicilio</li>
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}`} className="hover:text-brand-600">
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  )
}
