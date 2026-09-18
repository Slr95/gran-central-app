import { LayoutDashboard, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { cartTotals, getCart } from '@/lib/cart'
import { prisma } from '@/lib/prisma'

export async function SiteHeader() {
  const [session, categories, cart] = await Promise.all([
    auth(),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { position: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    getCart(),
  ])
  const itemCount = cart ? cartTotals(cart).itemCount : 0

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          Gran Central
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="transition-colors hover:text-brand-600"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/ofertas" className="font-semibold text-brand-600">
            Ofertas
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {session?.user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-700"
            >
              <LayoutDashboard className="size-4" />
              Panel
            </Link>
          )}
          <Link href={session ? '/mi-cuenta' : '/login'} className="flex items-center gap-1.5 text-muted hover:text-brand-600">
            <User className="size-5" />
            <span className="hidden sm:inline">{session?.user.name ?? 'Ingresar'}</span>
          </Link>
          <Link href="/carrito" className="relative text-muted hover:text-brand-600">
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
