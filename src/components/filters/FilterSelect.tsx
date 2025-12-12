import React, { memo } from "react";

type Option = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  label: string;
  value: string;
  options: Option[] | string[];
  onChange: (value: string) => void;
  placeholder?: string;
};

const FilterSelect = memo(
  ({
    label,
    value,
    options,
    onChange,
    placeholder = "Seleccionar",
  }: FilterSelectProps) => {
    return (
      <label className="flex flex-col text-sm font-medium text-[#b49a66]">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => {
            const isString = typeof opt === "string";
            const val = isString ? opt : opt.value;
            const lab = isString ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {lab}
              </option>
            );
          })}
        </select>
      </label>
    );
  }
);

FilterSelect.displayName = "FilterSelect";

export default FilterSelect;
