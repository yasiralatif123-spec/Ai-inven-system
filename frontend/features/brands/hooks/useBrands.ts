"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBrands } from "../services/brand.service";
import type { Brand } from "../types";

type UseBrandsOptions = {
  search?: string;
  active?: boolean;
  autoFetch?: boolean;
};

export function useBrands(options: UseBrandsOptions = {}) {
  const { search = "", active, autoFetch = true } = options;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [fetching, setFetching] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!autoFetch) return;

    let cancelled = false;

    async function load() {
      try {
        setFetching(true);
        const data = await fetchBrands({ search, active });
        if (!cancelled) {
          setBrands(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setBrands([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load brands. Please try again."
          );
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search, active, autoFetch, reloadToken]);

  return {
    brands,
    loading: autoFetch && fetching,
    error,
    refresh,
  };
}
