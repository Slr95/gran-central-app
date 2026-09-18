'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { registerCustomer } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Creando cuenta…' : 'Crear cuenta'}
    </button>
  )
}

export function RegistroForm({ callbackUrl }: { callbackUrl: string }) {
  const [errorMessage, formAction] = useActionState(registerCustomer, undefined)

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="redirectTo" value={callbackUrl} />

      <Field label="Nombre" name="name" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        label="Repetí la contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  autoComplete,
  minLength,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </div>
  )
}
