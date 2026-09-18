import Link from 'next/link'
import { RegistroForm } from './registro-form'

export const metadata = { title: 'Crear cuenta' }

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const redirectTo = callbackUrl ?? '/'
  const loginHref =
    redirectTo && redirectTo !== '/'
      ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/login'

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold text-brand-700">
          Gran Central
        </Link>

        <div className="mt-8 rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold">Creá tu cuenta</h1>
          <p className="mt-1 text-sm text-muted">Para comprar, ver pedidos y pagar con Mercado Pago.</p>
          <RegistroForm callbackUrl={redirectTo} />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿Ya tenés cuenta?{' '}
          <Link href={loginHref} className="font-medium text-brand-600 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </main>
  )
}
