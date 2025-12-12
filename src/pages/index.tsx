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

const ITEMS_PER_PAGE = 12;

const IndexPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
  }));
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
  }));
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [extraFilters, setExtraFilters] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listingRef = useRef<HTMLDivElement>(null);

  const fetchProperties = async (
    currentFilters: FilterState,
    isInitial = false
  ) => {
    // Cuando buscamos, actualizamos los filtros aplicados para que la UI de resultados coincida
    setAppliedFilters(currentFilters);

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

  !filters.propertyType && !filters.location;

  const filteredProperties = properties.filter((p) => {
    if (extraFilters.length === 0) return true;
    return extraFilters.every((filter) => {
      // Logic for each specific extra filter
      if (filter === "Terraza") return p.hasTerrace === true;
      if (filter === "Lavadora") return p.hasWasher === true;
      if (filter === "Cantidad de Baños") return (p.bathrooms ?? 0) > 0;
      // Default fallback
      return true;
    });
  });

  const finalFilteredProperties = filteredProperties.filter((p) => {
    if (selectedRooms !== null) {
      // Check exact match of rooms
      return p.rooms === selectedRooms;
    }
    return true;
  });

  // Derived available options for "Nº habitaciones"
  const availableRoomCounts = Array.from(
    new Set(
      properties
        .map((p) => p.rooms)
        .filter((r): r is number => r !== null && r > 0)
    )
  ).sort((a, b) => a - b);

  // Calculate pages based on filtered list
  const totalPages = Math.ceil(finalFilteredProperties.length / ITEMS_PER_PAGE);

  const visibleProperties = finalFilteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isDefaultFilters =
    !filters.checkIn &&
    !filters.checkOut &&
    !filters.propertyType &&
    !filters.location;

  const isDefaultAppliedFilters =
    !appliedFilters.checkIn &&
    !appliedFilters.checkOut &&
    !appliedFilters.propertyType &&
    !appliedFilters.location;

  return (
    <main className="min-h-screen bg-black text-white">
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
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2 py-12"
      >
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {hasSearched && (
              <>
                {appliedFilters.propertyType ? (
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-semibold text-white">
                      {appliedFilters.propertyType === "Corporativo"
                        ? "Resultados de Apartamentos Corporativos"
                        : appliedFilters.propertyType === "Coliving"
                        ? "Resultados de Coliving"
                        : `Resultados de ${appliedFilters.propertyType}`}
                    </h2>
                    {(appliedFilters.propertyType === "Corporativo" ||
                      appliedFilters.propertyType === "Coliving") && (
                      <p className="text-lg text-neutral-300">
                        {appliedFilters.propertyType === "Corporativo"
                          ? "Alquiler de Apartamentos Completos (privacidad y exclusividad)"
                          : "Alquiler de Habitaciones Privadas con Zonas Comunes Compartidas"}
                      </p>
                    )}

                    {(appliedFilters.propertyType === "Corporativo" ||
                      appliedFilters.propertyType === "Coliving") && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {/* Select for Number of Rooms - only for Corporativo */}
                        {appliedFilters.propertyType === "Corporativo" && (
                          <div className="relative">
                            <select
                              value={selectedRooms ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedRooms(val ? Number(val) : null);
                                setCurrentPage(1);
                              }}
                              className="appearance-none rounded-full border border-neutral-200 bg-white pl-4 pr-10 py-2 text-sm text-neutral-600 focus:border-[#b49a66] focus:outline-none focus:ring-1 focus:ring-[#b49a66]"
                            >
                              <option value="">Nº habitaciones</option>
                              {availableRoomCounts.map((count) => (
                                <option key={count} value={count}>
                                  {count}{" "}
                                  {count === 1 ? "habitación" : "habitaciones"}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                              <svg
                                className="h-4 w-4 text-neutral-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                        {(appliedFilters.propertyType === "Corporativo"
                          ? ["Terraza", "Lavadora"]
                          : ["Terraza", "Cantidad de Baños"]
                        ).map((filter) => (
                          <label
                            key={filter}
                            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
                          >
                            <input
                              type="checkbox"
                              checked={extraFilters.includes(filter)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setExtraFilters((prev) =>
                                  checked
                                    ? [...prev, filter]
                                    : prev.filter((f) => f !== filter)
                                );
                                setCurrentPage(1); // Reset to first page on filter change
                              }}
                              className="h-4 w-4 rounded border-neutral-300 text-[#b49a66] focus:ring-[#b49a66]"
                            />
                            {filter}
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 h-px w-full bg-neutral-800" />
                    <p className="mt-2 text-sm text-neutral-400">
                      {loading
                        ? "Buscando propiedades…"
                        : `Mostrando ${visibleProperties.length} de ${finalFilteredProperties.length} propiedades disponibles`}
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-semibold text-white">
                      {isDefaultAppliedFilters
                        ? "Propiedades Destacadas"
                        : "Resultados de búsqueda"}
                    </h2>

                    <p className="text-sm text-neutral-200">
                      {loading
                        ? "Buscando propiedades…"
                        : `Mostrando ${visibleProperties.length} de ${finalFilteredProperties.length} propiedades disponibles`}
                    </p>
                  </>
                )}
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

      <div className="bg-black pb-16">
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
            <p className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-400">
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
