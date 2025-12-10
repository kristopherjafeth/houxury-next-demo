import { DEFAULT_PROPERTY_VALUES } from "../../data/properties";
import { DEFAULT_RESERVATION_VALUES } from "../../data/reservations";

export const getStringField = (
  record: Record<string, unknown>,
  ...keys: string[]
): string | null => {
  for (const k of keys) {
    const v = record[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (typeof v === "number") {
      return String(v);
    }
  }
  return null;
};

export const safeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric =
    typeof value === "string"
      ? Number(value)
      : typeof value === "number"
      ? value
      : null;
  return Number.isFinite(numeric) ? numeric : null;
};

export const formatPricePerNight = (value: number | null): string => {
  if (value === null) return DEFAULT_PROPERTY_VALUES.pricePerNight;
  try {
    const formatter = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    return `${formatter.format(value)} / noche`;
  } catch {
    return `${value} / noche`;
  }
};

export const formatReservationAmount = (value: number | null): string => {
  if (value === null) return DEFAULT_RESERVATION_VALUES.formattedTotalPrice;
  try {
    const formatter = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    return formatter.format(value);
  } catch {
    return `${value}`;
  }
};

export type LookupValue = { id: string | null; name: string | null };

export const extractLookup = (value: unknown): LookupValue => {
  if (Array.isArray(value) && value.length > 0) {
    return extractLookup(value[0]);
  }

  if (!value || typeof value !== "object") {
    return { id: null, name: null };
  }

  const candidate = value as Record<string, unknown>;
  const id = (() => {
    const raw = candidate.id;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return null;
  })();

  const name = (() => {
    const raw = candidate.name ?? candidate.Name;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
    return null;
  })();

  return { id, name };
};

export const normalizeTags = (value: unknown): string[] => {
  if (!value) {
    return [...DEFAULT_RESERVATION_VALUES.tags];
  }

  if (Array.isArray(value)) {
    const tags = value
      .map((entry) => {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
        if (entry && typeof entry === "object") {
          const candidate = entry as Record<string, unknown>;
          const raw = (candidate.name ??
            candidate.Name ??
            candidate.tag ??
            candidate.Tag) as string | undefined;
          if (raw) {
            const trimmed = raw.trim();
            return trimmed.length > 0 ? trimmed : null;
          }
        }
        return null;
      })
      .filter((tag): tag is string => tag !== null);

    return tags.length > 0 ? tags : [...DEFAULT_RESERVATION_VALUES.tags];
  }

  if (typeof value === "string") {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return tags.length > 0 ? tags : [...DEFAULT_RESERVATION_VALUES.tags];
  }

  return [...DEFAULT_RESERVATION_VALUES.tags];
};

export const normalizeImageValue = (value: unknown): string => {
  if (!value) {
    return DEFAULT_RESERVATION_VALUES.imageUrl;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_RESERVATION_VALUES.imageUrl;
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeImageValue(value[0]);
  }

  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const raw =
      candidate.url ??
      candidate.URL ??
      candidate.download_url ??
      candidate.downloadUrl;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      return trimmed.length > 0 ? trimmed : DEFAULT_RESERVATION_VALUES.imageUrl;
    }
  }

  return DEFAULT_RESERVATION_VALUES.imageUrl;
};
