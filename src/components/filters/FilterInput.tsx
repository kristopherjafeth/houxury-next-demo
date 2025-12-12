import React, { memo } from "react";

type FilterInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
  min?: string;
  placeholder?: string;
};

const FilterInput = memo(
  ({
    label,
    value,
    onChange,
    type = "text",
    min,
    placeholder,
  }: FilterInputProps) => {
    return (
      <label className="flex flex-col text-sm font-medium text-[#b49a66]">
        {label}
        <input
          type={type}
          value={value}
          min={min}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 h-12 rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-base text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
        />
      </label>
    );
  }
);

FilterInput.displayName = "FilterInput";

export default FilterInput;
