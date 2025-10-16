import React, { useEffect, useRef, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import PropertyGrid, { Property } from "../components/PropertyGrid";

type ApiResponse = {
  properties: Property[];
};

type PropertyTypesResponse = {
  propertyTypes: string[];
};

const IndexPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    checkIn: "",
    checkOut: "",
    propertyType: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setTypesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const listingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPropertyTypes = async () => {
      try {
        setTypesLoading(true);
        const response = await fetch("/api/property-types");
        if (!response.ok) {
          throw new Error("No se pudieron obtener los tipos de propiedad");
        }
        const data: PropertyTypesResponse = await response.json();
        if (isMounted) {
          setPropertyTypes(data.propertyTypes);
        }
      } catch {
        if (isMounted) {
          setPropertyTypes([]);
        }
      } finally {
        if (isMounted) {
          setTypesLoading(false);
        }
      }
    };

    fetchPropertyTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProperties = async (currentFilters: FilterState) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const query = new URLSearchParams();
      if (currentFilters.propertyType)
        query.append("propertyType", currentFilters.propertyType);
      if (currentFilters.checkIn)
        query.append("checkIn", currentFilters.checkIn);
      if (currentFilters.checkOut)
        query.append("checkOut", currentFilters.checkOut);

      const url = query.toString()
        ? `/api/properties?${query.toString()}`
        : "/api/properties";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("No se pudieron cargar las propiedades");
      }

      const data: ApiResponse = await response.json();
        console.log("Rendering IndexPage with properties:", data);

      setProperties(data.properties);

      if (listingRef.current) {
        listingRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch  {
      setError("No se pudieron cargar las propiedades. Inténtalo más tarde.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-neutral-100">
      <section
        className="relative flex min-h-[60vh] items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.7), rgba(17,17,17,0.7)), url('https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 px-4 text-center text-white">
          <header className="max-w-3xl">
            <p className="uppercase tracking-[0.35em] text-sm text-neutral-200 familiar-font">
              Experiencias exclusivas
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl familiar-font">
              Encuentra la propiedad perfecta para tu próxima estadía
            </h1>
            <p className="mt-4 text-base text-neutral-200 sm:text-lg">
              Selecciona tus fechas y el tipo de inmueble para descubrir
              espacios que combinan lujo, privacidad y servicios personalizados.
            </p>
          </header>
          <FilterBar
            filters={filters}
            propertyTypes={propertyTypes}
            loading={loading}
            onChange={(field, value) =>
              setFilters((prev) => ({ ...prev, [field]: value }))
            }
            onSubmit={(currentFilters) => {
              fetchProperties(currentFilters);
            }}
          />
        </div>
      </section>

      <section
        ref={listingRef}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12"
      >
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {hasSearched ? (
              <>
                <h2 className="text-3xl font-semibold text-neutral-900">
                  Resultados de búsqueda
                </h2>

                <p className="text-sm text-neutral-500">
                  {loading
                    ? "Buscando propiedades…"
                    : `Encontramos ${properties.length} propiedades disponibles`}
                </p>
              </>
            ) : (
            <>
            </>
            )}
          </div>
      
        </header>
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <div className="bg-neutral-100 pb-16">
        {hasSearched ? (
          loading ? (
            <div className="mx-auto flex max-w-6xl justify-center px-4">
              <div
                className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-[#b49a66]"
                aria-label="Buscando propiedades"
              />
            </div>
          ) : properties.length ? (
            <PropertyGrid properties={properties} />
          ) : (
            <p className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-500">
              No encontramos propiedades que coincidan con tu búsqueda. Ajusta
              los filtros e inténtalo de nuevo.
            </p>
          )
        ) : (
         <>
         </>
        )}
      </div>
    </main>
  );
};

export default IndexPage;
