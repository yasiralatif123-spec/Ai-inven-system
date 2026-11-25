"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchBrands } from "../services/brand.service";
import type { Brand } from "../types";

export const BRAND_SEARCH_LIMIT = 20;
const DEFAULT_DEBOUNCE_MS = 250;

type UseBrandSearchOptions = {
  active?: boolean;
  limit?: number;
  debounceMs?: number;
};

function dedupeBrands(brands: Brand[]): Brand[] {
  const seen = new Set<string>();
  return brands.filter((brand) => {
    if (!brand._id || seen.has(brand._id)) return false;
    seen.add(brand._id);
    return true;
  });
}

/**
 * Server-filtered brand lookup for type-ahead selectors.
 * Typing is debounced, results are bounded, and stale responses are ignored.
 */
export function useBrandSearch(options: UseBrandSearchOptions = {}) {
  const {
    active = true,
    limit = BRAND_SEARCH_LIMIT,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedInput(input), debounceMs);
    return () => window.clearTimeout(timeout);
  }, [input, debounceMs]);

  const load = useCallback(
    (requestedPage: number, search: string) => {
      const requestId = ++latestRequest.current;
      // State updates stay in deferred callbacks so starting a fetch from an
      // effect never causes a synchronous cascading render.
      queueMicrotask(() => {
        if (requestId === latestRequest.current) setLoading(true);
      });

      return searchBrands({ search, active, limit, page: requestedPage })
        .then((result) => {
          if (requestId !== latestRequest.current) return;

          setBrands((current) =>
            dedupeBrands(
              requestedPage === 1 ? result.brands : [...current, ...result.brands]
            )
          );
          setTotal(result.total);
          setPage(requestedPage);
          setError(null);
        })
        .catch((loadError: unknown) => {
          if (requestId !== latestRequest.current) return;

          if (requestedPage === 1) setBrands([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load brands. Please try again."
          );
        })
        .finally(() => {
          if (requestId === latestRequest.current) setLoading(false);
        });
    },
    [active, limit]
  );

  useEffect(() => {
    void load(1, debouncedInput);
  }, [debouncedInput, load]);

  const hasMore = brands.length < total;
  const searching = loading || input !== debouncedInput;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    void load(page + 1, debouncedInput);
  }, [loading, hasMore, load, page, debouncedInput]);

  return {
    input,
    setInput,
    brands,
    total,
    loading,
    searching,
    error,
    hasMore,
    loadMore,
  };
}
