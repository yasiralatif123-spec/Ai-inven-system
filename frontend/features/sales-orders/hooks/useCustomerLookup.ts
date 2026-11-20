"use client";

import { useEffect, useState } from "react";
import { fetchCustomers } from "../../customers/services/customer.service";
import type { Customer } from "../../customers/types";

export function useCustomerLookup() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchCustomers();
        if (!cancelled) {
          setCustomers(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Saved customers could not be loaded."
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

  return { customers, loading, error };
}
