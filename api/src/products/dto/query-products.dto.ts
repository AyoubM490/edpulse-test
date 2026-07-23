import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { StockStatus } from '../domain/product.entity';

/**
 * Params de query validés et typés de GET /products.
 *
 * `@Type(() => Number)` + `enableImplicitConversion` convertissent les strings
 * d'URL en nombres avant validation. Les bornes (Min/Max) garantissent une
 * pagination saine et renvoient 400 sinon (via le ValidationPipe global).
 */
export class QueryProductsDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Numéro de page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page doit être un entier' })
  @Min(1, { message: 'page doit être >= 1' })
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Nombre d’éléments par page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit doit être un entier' })
  @Min(1, { message: 'limit doit être >= 1' })
  @Max(100, { message: 'limit doit être <= 100' })
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Filtre par catégorie (insensible à la casse)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: StockStatus,
    description: 'Filtre par statut de stock',
  })
  @IsOptional()
  @IsEnum(StockStatus, {
    message: `stock_status doit être l'un de: ${Object.values(StockStatus).join(', ')}`,
  })
  stock_status?: StockStatus;
}
