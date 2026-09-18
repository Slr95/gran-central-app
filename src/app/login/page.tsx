import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata = { title: 'Ingresar' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const redirectTo = callbackUrl ?? '/'
  const registerHref =
    redirectTo && redirectTo !== '/'
      ? `/registro?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/registro'

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold text-brand-700">
          Gran Central
        </Link>

        <div className="mt-8 rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold">Ingresá a tu cuenta</h1>
          <LoginForm callbackUrl={redirectTo} />
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tenés cuenta?{' '}
          <Link href={registerHref} className="font-medium text-brand-600 hover:underline">
            Creá una
          </Link>
        </p>
      </div>
    </main>
  )
}
