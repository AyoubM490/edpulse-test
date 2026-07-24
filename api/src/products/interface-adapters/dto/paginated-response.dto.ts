import { ApiProperty } from '@nestjs/swagger';
import { Product, StockStatus } from '../../core/entities/product';

/** Métadonnées de pagination renvoyées avec chaque page. */
export class PaginationMeta {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 10 }) limit!: number;
  @ApiProperty({ example: 72, description: 'Total d’éléments après filtrage' })
  total!: number;
  @ApiProperty({ example: 8 }) totalPages!: number;
  @ApiProperty({ example: true }) hasNext!: boolean;
  @ApiProperty({ example: false }) hasPrev!: boolean;
}

/** Représentation d'un produit exposée par l'API (documentée pour Swagger). */
export class ProductDto implements Product {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Casque Bluetooth Aura X' }) name!: string;
  @ApiProperty({ example: 'Electronics' }) category!: string;
  @ApiProperty({ example: 129.99 }) price!: number;
  @ApiProperty({ enum: StockStatus, example: StockStatus.IN_STOCK })
  stock_status!: StockStatus;
}

/** Enveloppe générique `{ data, meta }` de la réponse paginée. */
export class PaginatedProductsResponse {
  @ApiProperty({ type: [ProductDto] })
  data!: Product[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
