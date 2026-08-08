// Generic fetch hook with loading/error states for dashboard panels.

import { useEffect, useState } from "react";

export type FetchState<T> = { data: T | null; loading: boolean; error: string | null };

export function useFetch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setState({ data: null, loading: true, error: null });
    });
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
        if (!cancelled) setState({ data: json, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Fetch error",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
