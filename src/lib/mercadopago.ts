import MercadoPagoConfig, { Payment, Preference } from 'mercadopago'

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('Falta MP_ACCESS_TOKEN en el .env')
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } })
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

type PreferenceItem = {
  id: string
  title: string
  quantity: number
  unitPrice: number
  pictureUrl?: string | null
}

export async function createCheckoutPreference(input: {
  orderId: string
  orderNumber: number
  email: string
  items: PreferenceItem[]
  shippingTotal: number
}) {
  const preference = new Preference(client())
  const items = input.items.map((item) => ({
    id: item.id,
    title: item.title.slice(0, 120),
    quantity: item.quantity,
    unit_price: Number(item.unitPrice.toFixed(2)),
    currency_id: 'ARS',
    ...(item.pictureUrl ? { picture_url: item.pictureUrl } : {}),
  }))

  if (input.shippingTotal > 0) {
    items.push({
      id: 'shipping',
      title: 'Envío',
      quantity: 1,
      unit_price: Number(input.shippingTotal.toFixed(2)),
      currency_id: 'ARS',
    })
  }

  const origin = siteUrl()
  const thanks = `${origin}/checkout/gracias?orden=${input.orderNumber}`
  // MP descarta http/localhost y después falla auto_return: "back_url.success must be defined".
  const publicHttps = origin.startsWith('https://')

  const created = await preference.create({
    body: {
      items,
      external_reference: input.orderId,
      statement_descriptor: 'GRANCENTRAL',
      metadata: { orderNumber: input.orderNumber },
      ...(publicHttps
        ? {
            payer: { email: input.email },
            auto_return: 'approved' as const,
            back_urls: {
              success: thanks,
              pending: `${thanks}&mp=pending`,
              failure: `${thanks}&mp=failure`,
            },
            notification_url: `${origin}/api/mercadopago/webhook`,
          }
        : {}),
    },
  })

  const checkoutUrl = created.sandbox_init_point ?? created.init_point
  if (!created.id || !checkoutUrl) {
    throw new Error('Mercado Pago no devolvió la URL de pago.')
  }

  return { preferenceId: created.id, checkoutUrl }
}

export async function fetchMercadoPagoPayment(id: string) {
  const api = new Payment(client())
  return api.get({ id })
}
