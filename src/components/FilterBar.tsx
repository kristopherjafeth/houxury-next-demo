import React from 'react'
import { IoReload } from "react-icons/io5";

export type FilterState = {
  checkIn: string
  checkOut: string
  propertyType: string
  location: string
}

type FilterBarProps = {
  filters: FilterState
  propertyTypes: string[]
  onChange: (field: keyof FilterState, value: string) => void
  onSubmit: (filters: FilterState) => void
  onReset: () => void
  loading?: boolean
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, propertyTypes, onChange, onSubmit, onReset, loading = false }) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(filters)
      }}
      className="w-full rounded-xl bg-transparent p-4 "
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] md:items-end">
        <label className="flex flex-col text-sm font-medium text-[#b49a66]">
          Fecha de entrada
          <input
            type="date"
            value={filters.checkIn}
            
            onChange={(event) => onChange('checkIn', event.target.value)}
            className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-[#b49a66]">
          Fecha de salida
          <input
            type="date"
            value={filters.checkOut}
            
            min={filters.checkIn || undefined}
            onChange={(event) => onChange('checkOut', event.target.value)}
            className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-[#b49a66]">
          Tipo de inmueble
          <select
            value={filters.propertyType}
            onChange={(event) => onChange('propertyType', event.target.value)}
            className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="">Todos</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium text-[#b49a66]">
          Ubicación
          <select
            value={filters.location}
            onChange={(event) => onChange('location', event.target.value)}
            className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="">Todas</option>
            <option value="Barcelona">Barcelona</option>
            <option value="Madrid">Madrid</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg cursor-pointer bg-[#b49a66] px-6 text-base font-semibold text-white transition hover:bg-[#9c8452] focus:outline-none focus:ring-2 focus:ring-[#e7d6ac] disabled:cursor-not-allowed disabled:bg-[#c7b897]"
        >
          {loading ? 'Buscando…' : 'Buscar'}
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
  )
}

export default FilterBar
