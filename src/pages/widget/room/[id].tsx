import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ZohoRoom } from "../../../lib/zoho";

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
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Error al cargar la habitación");
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
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    if (room) {
      setImgSrc(room.imageUrl);
    }
  }, [room]);

  return (
    <div className="h-[700px] max-h-[700px] w-full bg-white text-neutral-900 overflow-hidden font-sans">
      <Head>
        <title>{room ? room.name : "Detalle de Habitación"}</title>
      </Head>

      <main className="h-full w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#c5b38b]"></div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <div className="rounded-xl bg-red-50 p-6 text-red-600">
              <p>{error}</p>
            </div>
          </div>
        ) : room ? (
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className="relative w-full md:w-5/12 h-48 md:h-full shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc || room.imageUrl}
                alt={room.name}
                className="h-full w-full object-cover"
                onError={() => setImgSrc("/placeholder.jpg")}
              />
            </div>

            {/* Content Section */}
            <div className="flex-1 p-5 md:p-6 lg:p-8 flex flex-col overflow-y-auto h-full">
              <div className="flex-grow">
                <div className="flex flex-row justify-between items-start gap-4 mb-6">
                  {/* Left Column: Basic Info & Price */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block rounded-sm bg-[#c5b38b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-2">
                      HABITACIÓN
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 leading-tight text-neutral-900 break-words">
                      {room.name}
                    </h1>

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                      {room.pricePerNight && (
                        <span className="text-xl font-bold text-[#c5b38b] bg-[#c5b38b]/10 px-2 py-0.5 rounded">
                          {room.pricePerNight}{" "}
                          <span className="text-xs font-normal text-neutral-500">
                            / noche
                          </span>
                        </span>
                      )}
                    </div>

                    {room.propertyName && (
                      <p className="text-sm text-neutral-500">
                        en {room.propertyName}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Key Stats */}
                  <div className="flex flex-col gap-2 shrink-0 items-end text-right min-w-[80px]">
                    {room.bathrooms && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                          Baños
                        </span>
                        <span className="text-base font-bold text-neutral-800">
                          {room.bathrooms}
                        </span>
                      </div>
                    )}
                    {room.squareMeters && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                          Superficie
                        </span>
                        <span className="text-base font-bold text-neutral-800">
                          {room.squareMeters} m²
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {room.description && (
                  <div className="mb-6 pl-3 border-l-2 border-[#c5b38b]">
                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line line-clamp-4 hover:line-clamp-none transition-all">
                      {room.description}
                    </p>
                  </div>
                )}

                {/* Characteristics */}
                {room.detailedAmenities && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5b38b] mb-3">
                      Características
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                      {(showAllAmenities
                        ? Object.entries(room.detailedAmenities)
                        : Object.entries(room.detailedAmenities).slice(0, 12)
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-xs"
                        >
                          <span className="text-neutral-500 truncate mr-1">
                            {label}
                          </span>
                          <span className="font-medium text-neutral-800 text-right shrink-0">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {Object.keys(room.detailedAmenities).length > 12 && (
                      <button
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                        className="mt-2 text-[10px] font-bold text-[#c5b38b] hover:text-[#b09e78] focus:outline-none flex items-center tracking-wider"
                      >
                        {showAllAmenities ? "VER MENOS" : "VER MÁS"}
                        <span className="ml-1 text-sm font-normal">
                          {showAllAmenities ? "−" : "+"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Features */}
                {(() => {
                  const displayFeatures = Array.from(
                    new Set([
                      ...room.features,
                      ...(room.hasTerrace ? ["Terraza"] : []),
                      ...(room.hasWasher ? ["Lavadora"] : []),
                    ])
                  ).sort();

                  if (displayFeatures.length === 0) return null;

                  return (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#c5b38b] mb-3">
                        Comodidades
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {displayFeatures.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-neutral-600 text-xs"
                          >
                            <span className="mr-2 h-1 w-1 rounded-full bg-[#c5b38b]"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-neutral-100 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={handleReserve}
                  className="w-full cursor-pointer rounded bg-[#c5b38b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#b09e78] hover:-translate-y-0.5 shadow-lg shadow-[#c5b38b]/20 focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]"
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
