import Image from 'next/image'
import React from 'react'
import type { Property } from '../data/properties'

type PropertyCardProps = Property

const PropertyCard: React.FC<PropertyCardProps> = ({
  type,
  title,
  location,
  pricePerNight,
  imageUrl,
  features,
  bathrooms,
  rooms,
  squareMeters,
}) => {
  const stats: Array<{ label: string; value: string | null }> = [
    { label: 'Habitaciones', value: rooms !== null ? `${rooms}` : null },
    { label: 'Baños', value: bathrooms !== null ? `${bathrooms}` : null },
    { label: 'Superficie', value: squareMeters !== null ? `${squareMeters} m²` : null },
  ]
  const hasStats = stats.some((stat) => stat.value)
  const hasFeatures = features.length > 0

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
          <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-700">
            {features.map((feature) => (
              <li key={feature} className="rounded-full bg-neutral-100 px-3 py-1">
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default PropertyCard
