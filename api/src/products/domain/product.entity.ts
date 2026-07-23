/**
 * Statuts de stock possibles. Enum TS = source de vérité partagée par le
 * repository, le DTO de validation et Swagger.
 */
export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Modèle métier d'un produit. Volontairement minimal (conforme à l'énoncé).
 */
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_status: StockStatus;
}
