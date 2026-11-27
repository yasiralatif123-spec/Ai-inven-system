"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSaleOrders } from "../../sales-orders/services/sale-order.service";
import type { SalesOrder } from "../../sales-orders/types";
import { fetchCustomer } from "../services/customer.service";
import type { Customer } from "../types";
import { customerMatchesOrder } from "../utils";

export function useCustomerProfile(customerId: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCustomer(null);
      setOrders([]);

      try {
        // Financial cards are backed by the customer API. Load and show them
        // independently of the sale-order ledger so a ledger failure cannot
        // hide Total Purchases, Opening Balance or Current Outstanding.
        const customerData = await fetchCustomer(customerId);
        if (cancelled) return;

        // Never render a response for a different row after a route change.
        if (customerData.id !== customerId) {
          throw new Error("Loaded customer does not match the selected customer.");
        }

        setCustomer(customerData);
        setLoading(false);

        const [linkedResult, allResult] = await Promise.allSettled([
          fetchSaleOrders(customerId),
          fetchSaleOrders(),
        ]);
        if (cancelled) return;

        const linkedOrders = linkedResult.status === "fulfilled" ? linkedResult.value : [];
        const allOrders = allResult.status === "fulfilled" ? allResult.value : [];
        // Linked orders come from the backend customerId filter. Include legacy
        // orders that predate the link by matching phone or exact name.
        const legacyOrders = allOrders.filter(
          (order) => !order.customerId && customerMatchesOrder(customerData, order)
        );
        const seen = new Set<string>();
        const customerOrders = [...linkedOrders, ...legacyOrders].filter((order) => {
          if (seen.has(order.id)) return false;
          seen.add(order.id);
          return true;
        });
        setOrders(customerOrders);
      } catch (loadError) {
        if (!cancelled) {
          setCustomer(null);
          setOrders([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load customer profile. Please try again."
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
  }, [customerId, reloadToken]);

  return { customer, orders, loading, error, reload, setCustomer };
}
