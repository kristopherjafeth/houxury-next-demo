import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import type { Property } from '../../data/properties'
import { fetchZohoPropertyById } from '../../lib/zoho'

type PropertyPageProps = {
  property: Property
}

const formatDate = (value: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

const PropertyDetailPage: NextPage<PropertyPageProps> = ({ property }) => {
  const startLabel = formatDate(property.startOfAvailability)
  const endLabel = formatDate(property.endOfAvailability)

  return (
    <>
      <Head>
        <title>{property.title} · Houxury</title>
        <meta name="description" content={`Descubre ${property.title} en ${property.location}.`} />
      </Head>
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
          <Link href="/" className="text-sm text-[#b49a66] transition hover:text-[#9c8452]">
            ← Volver al listado
          </Link>
          <article className="overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="grid gap-6 p-6 lg:grid-cols-[3fr_2fr] lg:p-10">
              <div className="space-y-6">
                <div className="relative h-80 w-full overflow-hidden rounded-2xl">
                  <Image
                    src={property.imageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </div>
                <section className="space-y-4">
                  <header className="space-y-2">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-600">
                      {property.type}
                    </span>
                    <h1 className="text-3xl font-semibold text-neutral-900">{property.title}</h1>
                    <p className="text-neutral-500">{property.location}</p>
                    <p className="text-lg font-semibold text-[#b49a66]">{property.pricePerNight}</p>
                    {startLabel && endLabel && (
                      <p className="text-sm text-neutral-500">
                        Disponible del {startLabel} al {endLabel}
                      </p>
                    )}
                  </header>
                  <p className="text-neutral-600">{property.description}</p>
                  {property.features.length > 0 && (
                    <ul className="flex flex-wrap gap-3">
                      {property.features.map((feature) => (
                        <li key={feature} className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-700">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
              <aside className="space-y-6 rounded-2xl bg-neutral-50 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">Resumen</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-neutral-700">
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Habitaciones</p>
                      <p className="text-lg font-semibold text-neutral-900">{property.rooms ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Baños</p>
                      <p className="text-lg font-semibold text-neutral-900">{property.bathrooms ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Superficie</p>
                      <p className="text-lg font-semibold text-neutral-900">
                        {property.squareMeters ? `${property.squareMeters} m²` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-400">Disponibilidad</p>
                  <p className="mt-2 text-sm text-neutral-600">
                    {startLabel && endLabel ? (
                      <>
                        Este inmueble se encuentra disponible desde <strong>{startLabel}</strong> hasta{' '}
                        <strong>{endLabel}</strong>.
                      </>
                    ) : (
                      'Consulta con nuestro equipo para confirmar fechas disponibles.'
                    )}
                  </p>
                </div>
                <button className="w-full rounded-lg bg-[#b49a66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9c8452] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]">
                  RESERVAR
                </button>
              </aside>
            </div>
          </article>
        </div>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PropertyPageProps> = async ({ params }) => {
  const { id } = params ?? {}

  if (typeof id !== 'string' || id.trim().length === 0) {
    return { notFound: true }
  }

  try {
    const property = await fetchZohoPropertyById(id)

    if (!property) {
      return { notFound: true }
    }

    return {
      props: {
        property,
      },
    }
  } catch (error) {
    console.error('[propiedad/id] getServerSideProps', error)
    return { notFound: true }
  }
}

export default PropertyDetailPage
