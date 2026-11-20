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
        const [customerData, allOrders] = await Promise.all([
          fetchCustomer(customerId),
          fetchSaleOrders(),
        ]);

        if (cancelled) return;

        const customerOrders = allOrders.filter((order) =>
          customerMatchesOrder(customerData, order)
        );
        const orderOutstanding = customerOrders.reduce(
          (sum, order) => sum + Math.max(order.financials.outstanding, 0),
          0
        );

        setCustomer({
          ...customerData,
          orders: customerOrders.length,
          totalPurchases: customerOrders.reduce(
            (sum, order) => sum + Math.max(order.financials.total, 0),
            0
          ),
          outstanding: Number(customerData.openingBalance || 0) + orderOutstanding,
        });
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
