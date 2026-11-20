"use client";

import { useEffect, useState } from "react";
import { fetchInventoryProducts } from "../../../app/inventory/services/inventory.service";
import type { Product } from "../../../app/products/types";

export function useProductLookup() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchInventoryProducts();
        if (!cancelled) {
          setProducts(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Products could not be loaded."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
