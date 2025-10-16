import Image from 'next/image'
import React from 'react'

type PropertyCardProps = {
  title: string
  location: string
  pricePerNight: string
  imageUrl: string
  description: string
  features: string[]
  type: string
}

const PropertyCard: React.FC<PropertyCardProps> = ({ type, title, location, pricePerNight, imageUrl, description, features }) => {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden">
        <Image src={imageUrl} alt={title} className="h-full w-full object-cover" />
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
        <p className="text-sm text-neutral-600">{description}</p>
        <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-700">
          {features.map((feature) => (
            <li key={feature} className="rounded-full bg-neutral-100 px-3 py-1">
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default PropertyCard
