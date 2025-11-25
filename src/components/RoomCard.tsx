import React from 'react'
import Image from 'next/image'
import type { ZohoRoom } from '../lib/zoho'

type RoomCardProps = {
  room: ZohoRoom
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const stats: Array<{ label: string; value: string | null }> = [
    { label: 'Baños', value: room.bathrooms !== null ? `${room.bathrooms}` : null },
    {
      label: 'Superficie',
      value: room.squareMeters !== null ? `${room.squareMeters} m²` : null,
    },
  ]
  const hasStats = stats.some((stat) => stat.value)
  const hasFeatures = room.features.length > 0

  const handleReserve = () => {
    // Aquí puedes agregar la lógica de reserva
    console.log('Reservar habitación:', room.id)
    // Por ejemplo, redirigir a una página de reserva o abrir un modal
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={room.imageUrl}
          alt={room.name}
          className="h-full w-full object-cover"
          width={400}
          height={300}
        />
        <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
          {room.pricePerNight}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <header>
          <h3 className="text-xl font-semibold text-neutral-900">{room.name}</h3>
          {room.propertyName && (
            <div className="mt-1 text-sm text-neutral-500">
              en <span className="font-medium text-neutral-700">{room.propertyName}</span>
            </div>
          )}
        </header>

        {room.description && (
          <p className="line-clamp-3 text-sm text-neutral-600">{room.description}</p>
        )}

        {hasStats && (
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
            {stats.map((stat) =>
              stat.value ? (
                <div
                  key={stat.label}
                  className="rounded-lg bg-neutral-50 px-3 py-2 text-center"
                >
                  <p className="text-xs uppercase tracking-wide text-neutral-400">
                    {stat.label}
                  </p>
                  <p className="font-semibold text-neutral-900">{stat.value}</p>
                </div>
              ) : null
            )}
          </div>
        )}

        {hasFeatures && (
          <ul className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-700">
            {room.features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="rounded-full bg-neutral-100 px-3 py-1"
              >
                {feature}
              </li>
            ))}
            {room.features.length > 4 && (
              <li className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-500">
                +{room.features.length - 4} más
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto">
          <button
            onClick={handleReserve}
            className="inline-flex cursor-pointer w-full items-center justify-center rounded-lg bg-[#b49a66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9c8452] focus:outline-none"
          >
            Reservar habitación
          </button>
        </div>
      </div>
    </article>
  )
}

export default RoomCard
