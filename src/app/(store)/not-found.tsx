import Link from 'next/link'

export default function StoreNotFound() {
  return (
    <div className="py-10 text-center">
      <h1 className="text-3xl font-bold tracking-tight">No encontramos esa página</h1>
      <p className="mt-3 text-muted">Puede que el producto se haya archivado o que el enlace esté mal.</p>
      <Link href="/" className="mt-6 inline-block font-medium text-brand-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
