import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ZohoRoom } from "../../../lib/zoho";
import RoomCard from "../../../components/RoomCard";

export default function RoomWidgetPage() {
  const router = useRouter();
  const { id } = router.query;

  const [room, setRoom] = useState<ZohoRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const fetchRoom = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/rooms?id=${id}`);
        if (!res.ok) {
          throw new Error("Error al cargar la habitación");
        }
        const data = await res.json();
        if (data.rooms && data.rooms.length > 0) {
          setRoom(data.rooms[0]);
        } else {
          setError("Habitación no encontrada");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [router.isReady, id]);

  const handleReserve = () => {
    if (!room) return;
    // Send message to parent window (WordPress) to open modal
    const message = {
      action: "OPEN_RESERVATION_MODAL",
      roomId: room.id,
    };

    console.log("Sending message to parent:", message);
    window.parent.postMessage(message, "*");
  };

  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    if (room) {
      setImgSrc(room.imageUrl);
    }
  }, [room]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Head>
        <title>{room ? room.name : "Detalle de Habitación"}</title>
      </Head>

      <main className="w-full">
        {loading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#c5b38b]"></div>
          </div>
        ) : error ? (
          <div className="flex h-screen items-center justify-center p-4 text-center">
            <div className="rounded-xl bg-red-50 p-6 text-red-600">
              <p>{error}</p>
            </div>
          </div>
        ) : room ? (
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Image Section */}
            <div className="relative w-full md:w-1/2 h-64 md:h-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc || room.imageUrl}
                alt={room.name}
                className="h-full w-full object-cover"
                onError={() => setImgSrc("/placeholder.jpg")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/50" />
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 md:p-10 lg:p-14 flex flex-col overflow-y-auto">
              <div>
                <span className="inline-block rounded-sm bg-[#c5b38b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-3">
                  HABITACIÓN
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight text-neutral-900">
                  {room.name}
                </h1>
                {room.propertyName && (
                  <p className="text-lg text-neutral-500 mb-6">
                    en {room.propertyName}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 border-y border-neutral-100 py-6">
                  {room.bathrooms && (
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-400 uppercase tracking-widest mb-1">
                        Baños
                      </span>
                      <span className="text-xl font-bold text-neutral-800">
                        {room.bathrooms}
                      </span>
                    </div>
                  )}
                  {room.squareMeters && (
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-400 uppercase tracking-widest mb-1">
                        Superficie
                      </span>
                      <span className="text-xl font-bold text-neutral-800">
                        {room.squareMeters} m²
                      </span>
                    </div>
                  )}
                  {room.pricePerNight && (
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-400 uppercase tracking-widest mb-1">
                        Precio / Noche
                      </span>
                      <span className="text-xl font-bold text-neutral-800">
                        {room.pricePerNight}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {room.description && (
                  <div className="mb-8 pl-4 border-l-2 border-[#c5b38b]">
                    <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                      {room.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                {(room.features.length > 0 ||
                  room.hasTerrace ||
                  room.hasWasher) && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#c5b38b] mb-4">
                      Comodidades
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {room.hasTerrace && (
                        <li className="flex items-center text-neutral-600 text-sm">
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#c5b38b]"></span>
                          Terraza/Balcón
                        </li>
                      )}
                      {room.hasWasher && (
                        <li className="flex items-center text-neutral-600 text-sm">
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#c5b38b]"></span>
                          Lavadora
                        </li>
                      )}
                      {room.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-neutral-600 text-sm"
                        >
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#c5b38b]"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-auto pt-8">
                <button
                  onClick={handleReserve}
                  className="w-full md:w-auto min-w-[200px] cursor-pointer rounded bg-[#c5b38b] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#b09e78] hover:-translate-y-0.5 shadow-xl shadow-[#c5b38b]/30 focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]"
                >
                  Reservar habitación
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
