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

      try {
        const [customerData, linkedOrders, allOrders] = await Promise.all([
          fetchCustomer(customerId),
          fetchSaleOrders(customerId),
          fetchSaleOrders(),
        ]);

        if (cancelled) return;

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
        // Financial totals come from the backend customer record; the orders
        // below are only the transaction ledger shown in the profile tabs.
        setCustomer(customerData);
        setOrders(customerOrders);
      } catch (loadError) {
        if (!cancelled) {
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
