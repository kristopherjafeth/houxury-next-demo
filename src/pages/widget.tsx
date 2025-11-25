import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { ZohoRoom } from '../lib/zoho'
import RoomCard from '../components/RoomCard'

export default function WidgetPage() {
  const router = useRouter()
  const { propertyId } = router.query
  
  const [rooms, setRooms] = useState<ZohoRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!router.isReady) return

    const fetchRooms = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (propertyId) {
          params.append('propertyId', Array.isArray(propertyId) ? propertyId[0] : propertyId)
        }

        const res = await fetch(`/api/rooms?${params.toString()}`)
        if (!res.ok) {
          throw new Error('Error al cargar las habitaciones')
        }
        const data = await res.json()
        setRooms(data.rooms)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [router.isReady, propertyId])

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <Head>
        <title>Habitaciones Disponibles</title>
      </Head>

      <main className="mx-auto max-w-7xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-800"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-sm">
            <p>No se encontraron habitaciones disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
