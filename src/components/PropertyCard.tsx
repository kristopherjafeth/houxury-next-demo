import Image from "next/image";
import React from "react";
import { DEFAULT_PROPERTY_VALUES, type Property } from "../data/properties";

type PropertyCardProps = Property;

const PropertyCard: React.FC<PropertyCardProps> = ({
  type,
  title,
  city,
  imageUrl,
  description,
  features,
  bathrooms,
  rooms,
  squareMeters,
  startOfAvailability,
  endOfAvailability,
  slugWordpress,
}) => {
  const [info, setInfo] = React.useState({
    imgSrc: imageUrl,
    errored: false,
  });

  const handleImageError = () => {
    if (!info.errored) {
      setInfo({
        imgSrc: DEFAULT_PROPERTY_VALUES.imageUrl,
        errored: true,
      });
    }
  };

  const stats: Array<{ label: string; value: string | null }> = [
    { label: "Habitaciones", value: rooms !== null ? `${rooms}` : null },
    { label: "Baños", value: bathrooms !== null ? `${bathrooms}` : null },
    {
      label: "Superficie",
      value: squareMeters !== null ? `${squareMeters} m²` : null,
    },
  ];
  const hasStats = stats.some((stat) => stat.value);
  const hasFeatures = features.length > 0;

  const formatDate = (value: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  };

  const startLabel = formatDate(startOfAvailability);
  const endLabel = formatDate(endOfAvailability);

  let availabilityLabel: string | null = null;
  if (startLabel && endLabel) {
    availabilityLabel = `Disponible del ${startLabel} al ${endLabel}`;
  } else if (startLabel) {
    availabilityLabel = `Disponible a partir del ${startLabel}`;
  } else if (endLabel) {
    availabilityLabel = `Disponible hasta el ${endLabel}`;
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-[#1c1c1c] text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={info.imgSrc}
          alt={title}
          className="h-full w-full object-cover"
          width={600}
          height={400}
          onError={handleImageError}
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="flex flex-col gap-2">
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          <div className="flex items-center gap-3">
            <span className="rounded-sm bg-[#d9d9d9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              {type}
            </span>
            <span className="text-sm font-bold text-white">{city}</span>
          </div>
        </header>

        {description && (
          <p className="text-xs text-neutral-300 line-clamp-2">{description}</p>
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
          {slugWordpress && (
            <button
              onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}/propiedad/${slugWordpress}`;
                const target = window.top ?? window;
                try {
                  target.location.href = url;
                } catch {
                  window.location.href = url;
                }
              }}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded bg-[#c5b38b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#b09e78] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac]"
            >
              Ver propiedad
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
