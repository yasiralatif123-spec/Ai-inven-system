"use client";

import { useEffect, useState } from "react";
import { fetchInventoryProducts } from "../../../app/inventory/services/inventory.service";
import type { Product } from "../../../app/products/types";
import { fetchSuppliers } from "../../suppliers/services/supplier.service";
import type { Supplier } from "../../suppliers/types";

export function usePurchaseLookups() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSuppliers() {
      try {
        const data = await fetchSuppliers();
        if (!cancelled) {
          setSuppliers(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Suppliers could not be loaded."
          );
        }
      } finally {
        if (!cancelled) setSuppliersLoading(false);
      }
    }

    async function loadProducts() {
      try {
        const data = await fetchInventoryProducts();
        if (!cancelled) setProducts(data);
      } catch {
        // The item table allows manual entry when the catalog is unavailable.
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }

    loadSuppliers();
    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    suppliers,
    products,
    suppliersLoading,
    productsLoading,
    error,
  };
}
