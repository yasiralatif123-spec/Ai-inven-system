"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSnapshot } from "../services/dashboard.service";
import type { DashboardSnapshot } from "../types";

export function useDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardSnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard data. Please try again."
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
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { snapshot, loading, error, reload };
}
