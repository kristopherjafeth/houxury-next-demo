import React, { useState } from "react";
import Image from "next/image";
import type { ZohoRoom } from "../lib/zoho";
import { DEFAULT_PROPERTY_VALUES } from "../data/properties";

type RoomCardProps = {
  room: ZohoRoom;
};

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const [imgSrc, setImgSrc] = useState(room.imageUrl);
  const [errored, setErrored] = useState(false);

  const handleImageError = () => {
    if (!errored) {
      setImgSrc(DEFAULT_PROPERTY_VALUES.imageUrl);
      setErrored(true);
    }
  };

  const stats: Array<{ label: string; value: string | null }> = [
    {
      label: "Baños",
      value: room.bathrooms !== null ? `${room.bathrooms}` : null,
    },
    {
      label: "Superficie",
      value: room.squareMeters !== null ? `${room.squareMeters} m²` : null,
    },
  ];
  const hasStats = stats.some((stat) => stat.value);

  const handleReserve = () => {
    // Send message to parent window (WordPress) to open modal
    const message = {
      action: "OPEN_RESERVATION_MODAL",
      room: {
        id: room.id,
        name: room.name,
        propertyName: room.propertyName,
      },
    };

    console.log("Sending message to parent:", message);
    window.parent.postMessage(message, "*");
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-[#242424] text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={room.name}
          className="h-full w-full object-cover"
          width={600}
          height={400}
          onError={handleImageError}
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="flex flex-col gap-2">
          <h3 className="text-lg font-bold leading-tight">{room.name}</h3>
          <div className="flex items-center gap-3">
            <span className="rounded-sm bg-[#d9d9d9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              HABITACIÓN
            </span>
            {room.propertyName && (
              <span className="text-sm font-bold text-white">
                {room.propertyName}
              </span>
            )}
          </div>
        </header>

        {room.description && (
          <p className="text-xs text-neutral-300 line-clamp-2">
            {room.description}
          </p>
        )}

        {hasStats && (
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-neutral-700 pt-4">
            {stats.map((stat) =>
              stat.value ? (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center"
                >
                  <span className="text-[12px] font-medium text-white">
                    {stat.label}
                  </span>
                  <span className="text-[12px] font-bold text-white">
                    {stat.value.replace(" m²", "m2")}
                  </span>
                </div>
              ) : null
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={handleReserve}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-[#c5b38b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#b09e78] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]"
          >
            Reservar habitación
          </button>
        </div>
      </div>
    </article>
  );
};

export default RoomCard;
