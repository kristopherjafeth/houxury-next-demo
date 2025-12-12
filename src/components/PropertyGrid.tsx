import React from "react";
import type { Property } from "../data/properties";
import PropertyCard from "./PropertyCard";

type PropertyGridProps = {
  properties: Property[];
};

const PropertyGrid: React.FC<PropertyGridProps> = ({ properties }) => {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} {...property} />
      ))}
    </section>
  );
};

export default PropertyGrid;
export type { Property };
