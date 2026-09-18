import { Prisma } from '@prisma/client'
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago'
import { NextRequest } from 'next/server'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import { applyMercadoPagoPayment } from '@/lib/payments'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function paymentIdFrom(request: NextRequest, body: unknown) {
  const topic = request.nextUrl.searchParams.get('topic') ?? request.nextUrl.searchParams.get('type')
  const queryId =
    request.nextUrl.searchParams.get('data.id') ??
    request.nextUrl.searchParams.get('id')

  if (topic === 'merchant_order') {
    return null
  }

  if (body && typeof body === 'object') {
    const payload = body as { type?: string; topic?: string; data?: { id?: string }; action?: string }
    if (payload.type === 'merchant_order' || payload.topic === 'merchant_order') {
      return null
    }
    if (payload.type === 'payment' || payload.topic === 'payment' || payload.action?.startsWith('payment.')) {
      return payload.data?.id ?? queryId
    }
  }

  return topic === 'payment' ? queryId : (queryId ?? payloadId(body))
}

function payloadId(body: unknown) {
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data?: { id?: string } }).data
    return data?.id ?? null
  }
  return null
}

function verifySignature(request: NextRequest, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Falta MP_WEBHOOK_SECRET')
    }
    return
  }

  WebhookSignatureValidator.validate({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId,
    secret,
    toleranceSeconds: 300,
  })
}

async function handle(request: NextRequest, body: unknown) {
  if (!isMercadoPagoConfigured()) {
    return Response.json({ error: 'Mercado Pago no está configurado' }, { status: 503 })
  }

  const mpPaymentId = paymentIdFrom(request, body)
  if (!mpPaymentId) {
    return new Response(null, { status: 200 })
  }

  try {
    verifySignature(request, mpPaymentId)
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return new Response(null, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Webhook inválido'
    return Response.json({ error: message }, { status: 503 })
  }

  await prisma.webhookEvent.upsert({
    where: {
      provider_externalId_type: {
        provider: 'mercadopago',
        externalId: mpPaymentId,
        type: 'payment',
      },
    },
    create: {
      provider: 'mercadopago',
      externalId: mpPaymentId,
      type: 'payment',
      payload: (body ?? { query: Object.fromEntries(request.nextUrl.searchParams) }) as Prisma.InputJsonValue,
    },
    update: {
      payload: (body ?? { query: Object.fromEntries(request.nextUrl.searchParams) }) as Prisma.InputJsonValue,
      error: null,
    },
  })

  try {
    await applyMercadoPagoPayment(mpPaymentId)
    await prisma.webhookEvent.update({
      where: {
        provider_externalId_type: {
          provider: 'mercadopago',
          externalId: mpPaymentId,
          type: 'payment',
        },
      },
      data: { processedAt: new Date(), error: null },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al aplicar el pago'
    await prisma.webhookEvent.update({
      where: {
        provider_externalId_type: {
          provider: 'mercadopago',
          externalId: mpPaymentId,
          type: 'payment',
        },
      },
      data: { error: message },
    })
    console.error('mercadopago webhook', error)
    return Response.json({ error: message }, { status: 500 })
  }

  return new Response(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  return handle(request, body)
}

export async function GET(request: NextRequest) {
  return handle(request, null)
}
