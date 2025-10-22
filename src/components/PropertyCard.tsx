import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import type { Property } from '../data/properties'
import { WORDPRESS_BASE_URL_PUBLIC } from '@/lib/utils'

type PropertyCardProps = Property

const PropertyCard: React.FC<PropertyCardProps> = ({
  type,
  title,
  location,
  pricePerNight,
  imageUrl,
  description,
  features,
  bathrooms,
  rooms,
  squareMeters,
  startOfAvailability,
  endOfAvailability,
  slugWordpress
}) => {
  const stats: Array<{ label: string; value: string | null }> = [
    { label: 'Habitaciones', value: rooms !== null ? `${rooms}` : null },
    { label: 'Baños', value: bathrooms !== null ? `${bathrooms}` : null },
    { label: 'Superficie', value: squareMeters !== null ? `${squareMeters} m²` : null },
  ]
  const hasStats = stats.some((stat) => stat.value)
  const hasFeatures = features.length > 0

  const formatDate = (value: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed)
  }

  const startLabel = formatDate(startOfAvailability)
  const endLabel = formatDate(endOfAvailability)

  let availabilityLabel: string | null = null
  if (startLabel && endLabel) {
    availabilityLabel = `Disponible del ${startLabel} al ${endLabel}`
  } else if (startLabel) {
    availabilityLabel = `Disponible a partir del ${startLabel}`
  } else if (endLabel) {
    availabilityLabel = `Disponible hasta el ${endLabel}`
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden">
        <Image src={imageUrl} alt={title} className="h-full w-full object-cover"  width={400} height={300} />
        <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
          {pricePerNight}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <header>
          <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {type}
            </span>
            <span>{location}</span>
          </div>
        </header>
        {availabilityLabel && <p className="text-sm text-neutral-500">{availabilityLabel}</p>}
        {description && <p className="text-sm text-neutral-600">{description}</p>}
        {hasStats && (
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700 sm:grid-cols-3">
            {stats.map((stat) =>
              stat.value ? (
                <div key={stat.label} className="rounded-lg bg-neutral-50 px-3 py-2 text-center">
                  <p className="text-xs uppercase tracking-wide text-neutral-400">{stat.label}</p>
                  <p className="font-semibold text-neutral-900">{stat.value}</p>
                </div>
              ) : null,
            )}
          </div>
        )}
        {hasFeatures && (
          <ul className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-700">
            {features.map((feature) => (
              <li key={feature} className="rounded-full bg-neutral-100 px-3 py-1">
                {feature}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto">
        <Link
          href={
            slugWordpress
              ? `${WORDPRESS_BASE_URL_PUBLIC}/propiedad/${slugWordpress}`
              : '#'
          }
          passHref
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#b49a66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9c8452] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]"
          >
            Ver propiedad
          </a>
        </Link>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
