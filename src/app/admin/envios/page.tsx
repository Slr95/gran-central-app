import { prisma } from '@/lib/prisma'
import { PROVINCE_LABELS } from '@/lib/provinces'
import { formatARS } from '@/lib/utils'

export const metadata = { title: 'Envíos' }

const methodLabel = {
  CARRIER: 'Correo',
  OWN_DELIVERY: 'Flete propio',
  PICKUP: 'Retiro',
} as const

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({
    include: { rates: { orderBy: { price: 'asc' } } },
    orderBy: { position: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Envíos</h1>
      <p className="mt-1 text-sm text-muted">
        Las zonas y tarifas salen del seed. El editor visual queda para un siguiente paso; por ahora se
        ajustan acá o en Prisma Studio.
      </p>

      <div className="mt-8 space-y-6">
        {zones.map((zone) => (
          <section key={zone.id} className="rounded-xl border border-brand-100 bg-white p-5">
            <h2 className="font-semibold">{zone.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {zone.provinces.map((province) => PROVINCE_LABELS[province]).join(', ')}
              {zone.postalCodes.length > 0 ? ` · CP ${zone.postalCodes.join(', ')}` : ''}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {zone.rates.map((rate) => (
                <li key={rate.id} className="flex justify-between gap-4">
                  <span>
                    {rate.name} · {methodLabel[rate.methodType]}
                    {rate.allowsOversized ? ' · acepta bultos grandes' : ''}
                  </span>
                  <span className="font-medium">{formatARS(rate.price.toString())}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
