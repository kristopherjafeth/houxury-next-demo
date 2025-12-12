import React, { useCallback } from "react";
import { IoReload } from "react-icons/io5";
import FilterInput from "./filters/FilterInput";
import FilterSelect from "./filters/FilterSelect";

export type FilterState = {
  checkIn: string;
  checkOut: string;
  propertyType: string;
  location: string;
};

type FilterBarProps = {
  filters: FilterState;
  propertyTypes: string[];
  onChange: (field: keyof FilterState, value: string) => void;
  onSubmit: (filters: FilterState) => void;
  onReset: () => void;
  loading?: boolean;
};

const LOCATIONS = [
  { value: "Barcelona", label: "Barcelona" },
  { value: "Madrid", label: "Madrid" },
];

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  propertyTypes,
  onChange,
  onSubmit,
  onReset,
  loading = false,
}) => {
  const handleCheckInChange = useCallback(
    (value: string) => {
      onChange("checkIn", value);
    },
    [onChange]
  );

  const handleCheckOutChange = useCallback(
    (value: string) => {
      onChange("checkOut", value);
    },
    [onChange]
  );

  const handlePropertyTypeChange = useCallback(
    (value: string) => {
      onChange("propertyType", value);
    },
    [onChange]
  );

  const handleLocationChange = useCallback(
    (value: string) => {
      onChange("location", value);
    },
    [onChange]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(filters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-xl bg-transparent p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] md:items-end">
        <FilterInput
          label="Fecha de entrada"
          type="date"
          value={filters.checkIn}
          onChange={handleCheckInChange}
        />

        <FilterInput
          label="Fecha de salida"
          type="date"
          value={filters.checkOut}
          min={filters.checkIn || undefined}
          onChange={handleCheckOutChange}
        />

        <FilterSelect
          label="Tipo de inmueble"
          value={filters.propertyType}
          options={propertyTypes}
          onChange={handlePropertyTypeChange}
          placeholder="Todos"
        />

        <FilterSelect
          label="Ubicación"
          value={filters.location}
          options={LOCATIONS}
          onChange={handleLocationChange}
          placeholder="Todas"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg cursor-pointer bg-[#b49a66] px-6 text-base font-semibold text-white transition hover:bg-[#9c8452] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac] disabled:cursor-not-allowed disabled:bg-[#c7b897]"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="h-12 rounded-lg border border-[#b49a66] px-6 text-base font-semibold text-[#b49a66] transition hover:bg-[#f3ede0] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac] disabled:cursor-not-allowed disabled:border-[#c7b897] disabled:text-[#c7b897]"
        >
          <IoReload className="inline-block text-lg -mt-1 cursor-pointer" />
        </button>
      </div>
    </form>
  );
};

export default FilterBar;
