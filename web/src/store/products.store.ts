import { create } from 'zustand';
import type { ProductQuery, StockStatus } from '../types/product';
import { queryFromSearchParams, searchParamsFromQuery } from '../lib/url-state';

interface ProductsState {
  query: ProductQuery;
  /** Aller à une page (bornée en amont par les contrôles de pagination). */
  setPage: (page: number) => void;
  /** Changer le filtre catégorie ; remet la page à 1. */
  setCategory: (category: string | undefined) => void;
  /** Changer le filtre statut ; remet la page à 1. */
  setStockStatus: (status: StockStatus | undefined) => void;
  /** Réinitialiser les filtres (et la page). */
  reset: () => void;
  /** Resynchroniser l'état depuis l'URL (navigation back/forward). */
  syncFromUrl: () => void;
}

/** Pousse l'état courant dans l'URL sans recharger la page (partage/refresh). */
function pushToUrl(query: ProductQuery): void {
  const qs = searchParamsFromQuery(query);
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  query: queryFromSearchParams(window.location.search),

  setPage: (page) => {
    const query = { ...get().query, page };
    pushToUrl(query);
    set({ query });
  },

  setCategory: (category) => {
    const query = { ...get().query, category, page: 1 };
    pushToUrl(query);
    set({ query });
  },

  setStockStatus: (stock_status) => {
    const query = { ...get().query, stock_status, page: 1 };
    pushToUrl(query);
    set({ query });
  },

  reset: () => {
    const query: ProductQuery = {
      ...get().query,
      category: undefined,
      stock_status: undefined,
      page: 1,
    };
    pushToUrl(query);
    set({ query });
  },

  syncFromUrl: () => {
    set({ query: queryFromSearchParams(window.location.search) });
  },
}));
