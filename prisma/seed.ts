import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Province } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
})

// Credenciales de demo para quien clone el repo. No son de un comercio real.
// En un deploy propio, cambiá la clave por SEED_ADMIN_PASSWORD o desde el panel.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@grancentral.com.ar'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'DemoAdmin2026!'

const BED_SIZES = [
  { key: '80', label: '1 plaza 80 × 190 cm', lengthCm: 190, widthCm: 80, factor: 0.62 },
  { key: '100', label: '1½ plaza 100 × 190 cm', lengthCm: 190, widthCm: 100, factor: 0.78 },
  { key: '140', label: '2 plazas 140 × 190 cm', lengthCm: 190, widthCm: 140, factor: 1 },
  { key: '160', label: 'Queen 160 × 200 cm', lengthCm: 200, widthCm: 160, factor: 1.18 },
  { key: '180', label: 'King 180 × 200 cm', lengthCm: 200, widthCm: 180, factor: 1.35 },
] as const

function money(base: number, factor = 1) {
  return (Math.round((base * factor) / 1000) * 1000).toFixed(2)
}

function bedVariants(
  skuPrefix: string,
  basePrice: number,
  compareAt: number | null,
  opts: {
    heightCm: number
    weightBase: number
    stock?: Partial<Record<(typeof BED_SIZES)[number]['key'], number>>
    requiresAssembly?: boolean
  },
) {
  return BED_SIZES.map((size) => ({
    sku: `${skuPrefix}-${size.key}`,
    name: size.label,
    price: money(basePrice, size.factor),
    compareAtPrice: compareAt ? money(compareAt, size.factor) : null,
    stock: opts.stock?.[size.key] ?? 6,
    isOversized: true,
    requiresAssembly: opts.requiresAssembly ?? false,
    allowBackorder: true,
    weightKg: (opts.weightBase * size.factor).toFixed(2),
    lengthCm: size.lengthCm,
    widthCm: size.widthCm,
    heightCm: opts.heightCm,
  }))
}

async function main() {
  // Todo el seed usa upsert por slug/email para que se pueda volver a correr
  // sin duplicar nada.
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      name: 'Administrador',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    },
  })

  await prisma.category.updateMany({
    where: { slug: { in: ['living', 'dormitorio', 'comedor', 'oficina'] } },
    data: { isActive: false },
  })

  const categories = [
    {
      name: 'Colchones',
      slug: 'colchones',
      description: 'Espuma, resortes y viscoelástico, en todas las medidas.',
      position: 1,
      isActive: true,
    },
    {
      name: 'Sommiers',
      slug: 'sommiers',
      description: 'Bases tapizadas, con y sin cajones, listas para el colchón.',
      position: 2,
      isActive: true,
    },
    {
      name: 'Almohadas',
      slug: 'almohadas',
      description: 'Espuma, viscoelástica y vellón siliconado.',
      position: 3,
      isActive: true,
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  const colchones = await prisma.category.findUniqueOrThrow({ where: { slug: 'colchones' } })
  const sommiers = await prisma.category.findUniqueOrThrow({ where: { slug: 'sommiers' } })
  const almohadas = await prisma.category.findUniqueOrThrow({ where: { slug: 'almohadas' } })

  const furnitureSlugs = ['sillon-bariloche-3-cuerpos', 'mesa-ratona-nordica', 'cama-queen-con-cajones']
  await prisma.product.updateMany({
    where: { slug: { in: furnitureSlugs } },
    data: { status: 'ARCHIVED', isFeatured: false, archivedAt: new Date() },
  })

  const products = [
    {
      name: 'Colchón de espuma alta densidad GC 28',
      slug: 'colchon-espuma-alta-densidad-gc-28',
      categoryId: colchones.id,
      brand: 'Gran Central',
      shortDescription: 'Espuma de 28 kg/m³, altura 20 cm. Ideal para uso diario a buen precio.',
      description:
        'Colchón de espuma de alta densidad (28 kg/m³) con funda quilt de algodón y cierre perimetral para lavar. Núcleo firme, sin resortes: no hace ruido y no transfiere movimiento.\n\nAltura total 20 cm. Se entrega al vacío; conviene dejarlo airear 24 horas antes de usar. Garantía de 5 años sobre el núcleo.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
      variants: bedVariants('COL-ESP-28', 289000, null, {
        heightCm: 20,
        weightBase: 18,
        stock: { '80': 10, '100': 8, '140': 7, '160': 5, '180': 3 },
      }),
    },
    {
      name: 'Colchón de resortes continuos GC Classic',
      slug: 'colchon-resortes-continuos-gc-classic',
      categoryId: colchones.id,
      brand: 'Gran Central',
      shortDescription: 'Resorte continuo Bonnel, 25 cm de altura, con pillow top suave.',
      description:
        'Colchón de resortes continuos tipo Bonnel con marco perimetral de acero y capas de espuma que aislan el metal. El pillow top da una primera sensación más suave sin perder sostén.\n\nAltura 25 cm. Recomendado para quienes duermen de panza o cambian de postura. Rotar cabeza-pie cada tres meses alarga la vida útil.',
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
      variants: bedVariants('COL-BON-CL', 419000, 489000, {
        heightCm: 25,
        weightBase: 28,
        stock: { '80': 6, '100': 5, '140': 8, '160': 6, '180': 2 },
      }),
    },
    {
      name: 'Colchón pocket independiente GC Dual',
      slug: 'colchon-pocket-independiente-gc-dual',
      categoryId: colchones.id,
      brand: 'Gran Central',
      shortDescription: 'Resortes embolsados uno a uno: menos transferencia de movimiento.',
      description:
        'Cada resorte va en su propia bolsa de tela, así el movimiento de un lado de la cama casi no se siente del otro. Encima, una placa de espuma de 30 kg/m³ y una capa viscoelástica de 3 cm.\n\nAltura 28 cm. Buena opción para parejas o para quienes se dan vuelta mucho. Funda con cierre y doble quilt.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80',
      variants: bedVariants('COL-PKT-DU', 629000, 749000, {
        heightCm: 28,
        weightBase: 34,
        stock: { '80': 4, '100': 4, '140': 6, '160': 5, '180': 3 },
      }),
    },
    {
      name: 'Colchón viscoelástico GC Cloud',
      slug: 'colchon-viscoelastico-gc-cloud',
      categoryId: colchones.id,
      brand: 'Gran Central',
      shortDescription: 'Capa visco de 6 cm sobre base de alta densidad. Se adapta al cuerpo.',
      description:
        'Colchón de espuma con 6 cm de viscoelástica que se ablanda con el calor del cuerpo y vuelve a su forma al levantarse. La base de 32 kg/m³ evita que se hunda en el centro.\n\nAltura 26 cm. Sensación envolvente, útil si dormís de costado. No usar plancha ni secador sobre la funda.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
      variants: bedVariants('COL-VIS-CL', 549000, null, {
        heightCm: 26,
        weightBase: 24,
        stock: { '80': 5, '100': 4, '140': 5, '160': 4, '180': 2 },
      }),
    },
    {
      name: 'Sommier tapizado GC Base',
      slug: 'sommier-tapizado-gc-base',
      categoryId: sommiers.id,
      brand: 'Gran Central',
      shortDescription: 'Base de madera con patas y tapizado en tela. Lista para el colchón.',
      description:
        'Sommier de estructura de pino con somier de listones, tapizado en tela resistida y patas de 15 cm desmontables. No incluye colchón.\n\nAltura de la base 32 cm. Entra el colchón de cualquier línea GC. Se entrega parcialmente desarmado: patas y cabezal se colocan en destino.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
      variants: bedVariants('SOM-TAP-BS', 259000, null, {
        heightCm: 32,
        weightBase: 22,
        requiresAssembly: true,
        stock: { '80': 8, '100': 6, '140': 7, '160': 5, '180': 3 },
      }),
    },
    {
      name: 'Sommier con cajonera GC Storage',
      slug: 'sommier-cajonera-gc-storage',
      categoryId: sommiers.id,
      brand: 'Gran Central',
      shortDescription: 'Cuatro cajones laterales para guardar ropa de cama.',
      description:
        'Misma estructura que el sommier tapizado, con cuatro cajones sobre correderas (dos por lado). Útil en departamentos chicos donde no hay placard de resto.\n\nLos cajones no restan altura al colchón. Patas de 12 cm. No incluye colchón. Requiere armado de patas y cajones en el domicilio.',
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      variants: bedVariants('SOM-CAJ-ST', 389000, 449000, {
        heightCm: 38,
        weightBase: 38,
        requiresAssembly: true,
        stock: { '80': 3, '100': 3, '140': 5, '160': 4, '180': 2 },
      }),
    },
    {
      name: 'Sommier Queen GC Comfort',
      slug: 'sommier-queen-gc-comfort',
      categoryId: sommiers.id,
      brand: 'Gran Central',
      shortDescription: 'Base reforzada 160 × 200, tapizado premium y patas de madera.',
      description:
        'Sommier pensado para colchón Queen. Refuerzo central extra para que no baje con el tiempo y tapizado más denso que la línea Base.\n\nMedida única 160 × 200 cm. Combinarlo con el colchón pocket o el viscoelástico de la misma medida. Patas de paraíso de 15 cm.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
      variants: [
        {
          sku: 'SOM-QUE-CM-160',
          name: 'Queen 160 × 200 cm',
          price: '345000.00',
          compareAtPrice: null,
          stock: 6,
          isOversized: true,
          requiresAssembly: true,
          allowBackorder: true,
          weightKg: '28.00',
          lengthCm: 200,
          widthCm: 160,
          heightCm: 34,
        },
      ],
    },
    {
      name: 'Sommier King GC Extra',
      slug: 'sommier-king-gc-extra',
      categoryId: sommiers.id,
      brand: 'Gran Central',
      shortDescription: 'Base 180 × 200 con doble refuerzo. Para colchones King.',
      description:
        'Sommier King con doble viga central y tapizado resistente. Pensado para colchones de 180 × 200 cm y para personas de más de 100 kg por lado.\n\nSe entrega en dos módulos para que entre por pasillos angostos. Armado incluido si el flete es propio.',
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=1200&q=80',
      variants: [
        {
          sku: 'SOM-KIN-EX-180',
          name: 'King 180 × 200 cm',
          price: '419000.00',
          compareAtPrice: '479000.00',
          stock: 3,
          isOversized: true,
          requiresAssembly: true,
          allowBackorder: true,
          weightKg: '36.00',
          lengthCm: 200,
          widthCm: 180,
          heightCm: 34,
        },
      ],
    },
    {
      name: 'Almohada de espuma GC Soft',
      slug: 'almohada-espuma-gc-soft',
      categoryId: almohadas.id,
      brand: 'Gran Central',
      shortDescription: 'Espuma suave 50 × 70. Funda de algodón lavable.',
      description:
        'Almohada de espuma de baja densidad, sensación suave. Medida estándar 50 × 70 cm, altura 14 cm. Funda extraíble a 30 °C.\n\nSirve como almohada de todos los días o de invitado. No es cervical: si necesitás sostén de cuello, mirá la viscoelástica.',
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1200&q=80',
      variants: [
        {
          sku: 'ALM-ESP-SF-5070',
          name: '50 × 70 cm',
          price: '28900.00',
          compareAtPrice: null,
          stock: 40,
          isOversized: false,
          requiresAssembly: false,
          allowBackorder: false,
          weightKg: '0.70',
          lengthCm: 70,
          widthCm: 50,
          heightCm: 14,
        },
      ],
    },
    {
      name: 'Almohada viscoelástica cervical GC Neck',
      slug: 'almohada-viscoelastica-cervical-gc-neck',
      categoryId: almohadas.id,
      brand: 'Gran Central',
      shortDescription: 'Perfil cervical de memory foam. Alivia nuca y hombros.',
      description:
        'Almohada con forma de ola: el borde bajo queda bajo el cuello y el alto sostiene la cabeza. Viscoelástica que se adapta en unos segundos.\n\nMedida 40 × 60 cm. Funda con cierre. Las primeras noches puede sentirse rara; es normal hasta que el cuello se acostumbra.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&q=80',
      variants: [
        {
          sku: 'ALM-VIS-NK-4060',
          name: 'Cervical 40 × 60 cm',
          price: '54900.00',
          compareAtPrice: '64900.00',
          stock: 22,
          isOversized: false,
          requiresAssembly: false,
          allowBackorder: false,
          weightKg: '1.10',
          lengthCm: 60,
          widthCm: 40,
          heightCm: 12,
        },
      ],
    },
    {
      name: 'Almohada de vellón siliconado GC Nube',
      slug: 'almohada-vellon-siliconado-gc-nube',
      categoryId: almohadas.id,
      brand: 'Gran Central',
      shortDescription: 'Fibra hueca siliconada, liviana y lavable completa.',
      description:
        'Rellena con vellón de fibra hueca siliconada: queda esponjosa, se puede lavar entera y seca rápido. Más liviana que la de espuma.\n\nMedida 50 × 70 cm. Si se achata, un rato al sol y un sacudón le devuelven el volumen. Hipoalergénica.',
      isFeatured: false,
      image: 'https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=1200&q=80',
      variants: [
        {
          sku: 'ALM-VEL-NB-5070',
          name: '50 × 70 cm',
          price: '32900.00',
          compareAtPrice: null,
          stock: 35,
          isOversized: false,
          requiresAssembly: false,
          allowBackorder: false,
          weightKg: '0.55',
          lengthCm: 70,
          widthCm: 50,
          heightCm: 16,
        },
      ],
    },
    {
      name: 'Pack 2 almohadas GC Duo',
      slug: 'pack-2-almohadas-gc-duo',
      categoryId: almohadas.id,
      brand: 'Gran Central',
      shortDescription: 'Dos almohadas de espuma 50 × 70. Precio de pack.',
      description:
        'Dos almohadas de espuma GC Soft en un solo paquete, con descuento respecto de comprarlas sueltas. Misma funda de algodón lavable.\n\nPensado para cama de dos plazas o Queen. Si querés una cervical y una suave, conviene comprarlas por separado.',
      isFeatured: true,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80',
      variants: [
        {
          sku: 'ALM-PCK-DU-2',
          name: 'Pack x2 — 50 × 70 cm',
          price: '49900.00',
          compareAtPrice: '57800.00',
          stock: 18,
          isOversized: false,
          requiresAssembly: false,
          allowBackorder: false,
          weightKg: '1.40',
          lengthCm: 70,
          widthCm: 50,
          heightCm: 28,
        },
      ],
    },
  ]

  for (const { variants, image, ...product } of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, status: 'ACTIVE' },
      create: { ...product, status: 'ACTIVE' },
    })

    await prisma.productImage.deleteMany({ where: { productId: created.id } })
    await prisma.productImage.create({
      data: { productId: created.id, url: image, alt: product.name, position: 0 },
    })

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { ...variant, productId: created.id },
        create: { ...variant, productId: created.id },
      })
    }
  }

  // Zonas de envío. Colchones y sommiers no entran en correo: van por flete
  // propio o retiro. Las almohadas sí pueden ir por carrier.
  const existingZones = await prisma.shippingZone.count()
  if (existingZones === 0) {
    await prisma.shippingZone.create({
      data: {
        name: 'Rosario y alrededores',
        provinces: [Province.SANTA_FE],
        postalCodes: ['2000', '2001', '2002'],
        position: 1,
        rates: {
          create: [
            {
              name: 'Retiro en showroom',
              methodType: 'PICKUP',
              price: '0.00',
              allowsOversized: true,
              estimatedDaysMin: 1,
              estimatedDaysMax: 2,
            },
            {
              name: 'Flete propio con armado',
              methodType: 'OWN_DELIVERY',
              price: '35000.00',
              freeOverAmount: '900000.00',
              allowsOversized: true,
              includesAssembly: true,
              estimatedDaysMin: 3,
              estimatedDaysMax: 7,
            },
          ],
        },
      },
    })

    await prisma.shippingZone.create({
      data: {
        name: 'Resto del país',
        provinces: Object.values(Province),
        postalCodes: [],
        position: 2,
        rates: {
          create: [
            {
              name: 'Envío por correo',
              methodType: 'CARRIER',
              price: '48000.00',
              maxWeightKg: '30.00',
              allowsOversized: false,
              estimatedDaysMin: 5,
              estimatedDaysMax: 12,
            },
          ],
        },
      },
    })
  }

  const settings: Array<{ key: string; value: unknown }> = [
    // Con comisión de Mercado Pago en 6,29% + IVA (~7,6%), cualquier descuento
    // por transferencia debajo de ese número mejora el margen.
    { key: 'payments.transferDiscountPercent', value: 7 },
    { key: 'payments.bankAccount', value: { cbu: '', alias: '', titular: '', banco: '' } },
    { key: 'store.whatsapp', value: '' },
    { key: 'store.freeShippingThreshold', value: 900000 },
  ]

  for (const setting of settings) {
    await prisma.storeSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value as never },
    })
  }

  console.log(`Admin de demo: ${admin.email}`)
  console.log('Clave: SEED_ADMIN_PASSWORD o la del README. El seed no pisa la clave si el usuario ya existe.')
  console.log('Seed completo.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
