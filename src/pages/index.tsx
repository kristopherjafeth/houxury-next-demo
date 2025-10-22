import React, { useEffect, useRef, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import PropertyGrid, { Property } from "../components/PropertyGrid";
import { fetchReservations, ReservationFilters } from '../lib/api/reservationsClient';
import { Reservation } from "@/data/reservations";

type ApiResponse = {
  properties: Property[];
  availableTypes?: string[];
};

type PropertyTypesResponse = {
  propertyTypes: string[];
};

const INITIAL_FILTERS: FilterState = {
  checkIn: "",
  checkOut: "",
  propertyType: "",
  location: "",
};

const IndexPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(() => ({ ...INITIAL_FILTERS }));
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const listingRef = useRef<HTMLDivElement>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch("/api/property-types");
        if (!response.ok) {
          throw new Error("No se pudieron obtener los tipos de propiedad");
        }
        const data: PropertyTypesResponse = await response.json();
        if (isMounted) {
          console.log('[IndexPage] fetched property types:', data.propertyTypes);
          setPropertyTypes(data.propertyTypes);
        }
      } catch {
        if (isMounted) {
          setPropertyTypes([]);
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
      if (currentFilters.location)
        query.append("location", currentFilters.location);

      const url = query.toString()
        ? `/api/properties?${query.toString()}`
        : "/api/properties";
      const response = await fetch(url);
      const data: ApiResponse & { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar las propiedades");
      }
      console.log("[IndexPage] fetched properties:", data.properties);

      setProperties(data.properties);
      if (data.availableTypes?.length) {
        setPropertyTypes(data.availableTypes);
        setFilters((prev) =>
          prev.propertyType && !data.availableTypes?.includes(prev.propertyType)
            ? { ...prev, propertyType: "" }
            : prev,
        );
      }

      if (listingRef.current) {
        listingRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudieron cargar las propiedades. Inténtalo más tarde.";
      setError(message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
    setProperties([]);
    setError(null);
    setHasSearched(false);
  };



const fetchReservationsWithState = async (currentFilters: ReservationFilters) => {
  try {
    setLoading(true);
    setError(null);

    const { reservations } = await fetchReservations(currentFilters);
    setReservations(reservations);
  } catch (fetchError) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : 'No se pudieron cargar las reservaciones. Inténtalo más tarde.';
    setError(message);
    setReservations([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchReservationsWithState({});
}, []);

useEffect(() => {
  console.log("Current reservations:", reservations);
}, [reservations]);

  return (
    <main className="min-h-screen bg-neutral-100">
      <section
        className="relative flex lg:h-[600px] lg:max-h-[600px] items-center justify-center overflow-hidden"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://www.houxury.es/wp-content/uploads/Houxury-Web-Intro-1-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 px-4 text-center text-white">
          <div className="h-64">
          
          </div>
          <FilterBar
            filters={filters}
            propertyTypes={propertyTypes}
            loading={loading}
            onChange={(field, value) =>
              setFilters((prev) => {
                if (field === "checkIn") {
                  const nextCheckOut = prev.checkOut && value && prev.checkOut <= value ? "" : prev.checkOut;
                  return { ...prev, checkIn: value, checkOut: nextCheckOut };
                }

                if (field === "checkOut") {
                  return { ...prev, checkOut: value };
                }

                return { ...prev, [field]: value };
              })
            }
            onSubmit={(currentFilters) => {
              fetchProperties(currentFilters);
            }}
            onReset={handleResetFilters}
          />
        </div>
      </section>

      <section
        ref={listingRef}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12"
      >
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {hasSearched && (
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
          ) : error ? null : (
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
