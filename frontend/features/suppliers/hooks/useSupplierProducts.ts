"use client";

import { useEffect, useState } from "react";
import type { Product } from "../../../app/products/types";
import { fetchInventoryProducts } from "../../../app/inventory/services/inventory.service";

export function useSupplierProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await fetchInventoryProducts();
        if (!cancelled) setProducts(data);
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

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
