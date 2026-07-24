/**
 * Anneau ENTITIES (Enterprise Business Rules) — le centre du Clean.
 * Ne dépend de RIEN : ni framework, ni use case, ni infrastructure.
 * C'est le code le plus stable ; tout pointe vers lui, il ne pointe vers rien.
 *
 * Volontairement une structure de données : ce domaine (catalogue en lecture
 * seule) n'a aucune règle métier d'entreprise à encapsuler. On n'invente pas
 * de comportement (isAvailable(), etc.) que personne n'appelle — ce serait du
 * cargo-cult. Le jour où un vrai invariant apparaît (prix >= 0, transition de
 * stock…), il vit ICI, et nulle part ailleurs.
 */

/**
 * Statuts de stock possibles. Enum TS = source de vérité partagée par le
 * repository, le DTO de validation et Swagger.
 */
export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

/** Modèle métier d'un produit. Volontairement minimal (conforme à l'énoncé). */
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_status: StockStatus;
}
