/**
 * Abstraction d'un cache clé/valeur générique.
 *
 * SOLID / DIP : le service consomme cette interface, pas une implémentation.
 * On peut substituer l'impl in-memory par Redis (même contrat) sans toucher
 * au use case. Générique en <T> pour rester agnostique du type stocké.
 */
export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  /** Vide entièrement le cache (utile en test / invalidation manuelle). */
  clear(): void;
}

export const CACHE_STORE = Symbol('CACHE_STORE');
