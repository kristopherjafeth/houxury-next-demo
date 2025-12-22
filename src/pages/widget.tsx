import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import type { ZohoRoom } from "../lib/zoho";
import RoomCard from "../components/RoomCard";

export default function WidgetPage() {
  const router = useRouter();
  const { propertyId, slug } = router.query;

  const [rooms, setRooms] = useState<ZohoRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemsPerPage = 2;

  useEffect(() => {
    if (!router.isReady) return;

    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (propertyId) {
          params.append(
            "propertyId",
            Array.isArray(propertyId) ? propertyId[0] : propertyId
          );
        }
        if (slug) {
          params.append("slug", Array.isArray(slug) ? slug[0] : slug);
        }

        const res = await fetch(`/api/rooms?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Error al cargar las habitaciones");
        }
        const data = await res.json();
        setRooms(data.rooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router.isReady, propertyId, slug]);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + itemsPerPage;
      return nextIndex >= rooms.length ? 0 : nextIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const prevIndex = prev - itemsPerPage;
      if (prevIndex < 0) {
        const remainder = rooms.length % itemsPerPage;
        const lastIndex =
          rooms.length - (remainder === 0 ? itemsPerPage : remainder);
        return lastIndex;
      }
      return prevIndex;
    });
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8">
      <Head>
        <title>Habitaciones Disponibles</title>
      </Head>

      <main className="mx-auto max-w-7xl relative">
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
          <div className="relative group px-4">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${
                    currentIndex * (100 / itemsPerPage)
                  }%)`,
                }}
              >
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="min-w-[50%] px-2"
                    style={{ flex: `0 0 ${100 / itemsPerPage}%` }}
                  >
                    <RoomCard room={room} />
                  </div>
                ))}
              </div>
            </div>

            {rooms.length > itemsPerPage && (
              <>
                <button
                  onClick={prevSlide}
                  className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-3 shadow-lg transition hover:bg-white text-neutral-800 focus:outline-none"
                  aria-label="Anterior"
                >
                  <FaChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-3 shadow-lg transition hover:bg-white text-neutral-800 focus:outline-none"
                  aria-label="Siguiente"
                >
                  <FaChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
