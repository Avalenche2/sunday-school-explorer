import { useEffect, useState } from "react";

/**
 * Renvoie la valeur après `delay` ms sans nouvelle modification.
 * Utile pour limiter les recalculs / requêtes à chaque frappe.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
