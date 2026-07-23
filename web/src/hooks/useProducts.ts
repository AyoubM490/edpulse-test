import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../lib/api';
import type { PaginatedProducts, ProductQuery } from '../types/product';
import { useProductsStore } from '../store/products.store';

interface UseProductsResult {
  data: PaginatedProducts | null;
  isLoading: boolean;
  error: string | null;
  query: ProductQuery;
  /** Relance la requête courante (bouton « Réessayer »). */
  retry: () => void;
}

/**
 * Encapsule toute la logique data de la liste : lit la query du store, fetch à
 * chaque changement, annule la requête précédente (AbortController) pour éviter
 * les réponses en désordre, et expose les états loading/error/data.
 */
export function useProducts(): UseProductsResult {
  const query = useProductsStore((s) => s.query);
  const syncFromUrl = useProductsStore((s) => s.syncFromUrl);

  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incrémenté par retry() pour re-déclencher l'effet sans changer la query.
  const [reloadToken, setReloadToken] = useState(0);

  // Rejoue l'état depuis l'URL lors des navigations back/forward.
  useEffect(() => {
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    fetchProducts(query, controller.signal)
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        // Requête annulée (query obsolète) : on ignore silencieusement.
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Une erreur est survenue.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [query, reloadToken]);

  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, isLoading, error, query, retry };
}
