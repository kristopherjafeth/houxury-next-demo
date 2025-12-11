import React, { useEffect, useRef, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import PropertyGrid, { Property } from "../components/PropertyGrid";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

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

const ITEMS_PER_PAGE = 6;

const IndexPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
  }));
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const listingRef = useRef<HTMLDivElement>(null);

  const fetchProperties = async (
    currentFilters: FilterState,
    isInitial = false
  ) => {
    try {
      setLoading(true);
      setError(null);

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
        throw new Error(
          data.message ?? "No se pudieron cargar las propiedades"
        );
      }

      setProperties(data.properties);
      setHasSearched(true);
      setCurrentPage(1);

      if (data.availableTypes?.length) {
        setPropertyTypes(data.availableTypes);
        setFilters((prev) =>
          prev.propertyType && !data.availableTypes?.includes(prev.propertyType)
            ? { ...prev, propertyType: "" }
            : prev
        );
      }

      if (!isInitial && listingRef.current) {
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
          setPropertyTypes(data.propertyTypes);
        }
      } catch {
        if (isMounted) {
          setPropertyTypes([]);
        }
      }
    };

    fetchPropertyTypes();
    fetchProperties(INITIAL_FILTERS, true);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
    // Fetch initial properties again instead of clearing
    fetchProperties(INITIAL_FILTERS);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (listingRef.current) {
      listingRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const visibleProperties = properties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isDefaultFilters =
    !filters.checkIn &&
    !filters.checkOut &&
    !filters.propertyType &&
    !filters.location;

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="relative flex lg:h-[600px] lg:max-h-[600px] items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10 px-4 text-center text-white">
          <div className="h-64"></div>
          <FilterBar
            filters={filters}
            propertyTypes={propertyTypes}
            loading={loading}
            onChange={(field, value) =>
              setFilters((prev) => {
                if (field === "checkIn") {
                  const nextCheckOut =
                    prev.checkOut && value && prev.checkOut <= value
                      ? ""
                      : prev.checkOut;
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
                  {isDefaultFilters
                    ? "Propiedades Destacadas"
                    : "Resultados de búsqueda"}
                </h2>

                <p className="text-sm text-neutral-500">
                  {loading
                    ? "Buscando propiedades…"
                    : `Mostrando ${visibleProperties.length} de ${properties.length} propiedades disponibles`}
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
            <>
              <PropertyGrid properties={visibleProperties} />

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                          currentPage === page
                            ? "bg-[#b49a66] text-white shadow-md"
                            : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          ) : error ? null : (
            <p className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-500">
              No encontramos propiedades que coincidan con tu búsqueda. Ajusta
              los filtros e inténtalo de nuevo.
            </p>
          )
        ) : (
          <></>
        )}
      </div>
    </main>
  );
};

export default IndexPage;
