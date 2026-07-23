import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { PaginatedProductsResponse } from './dto/paginated-response.dto';

/**
 * Couche HTTP uniquement : parse/valide la query (via le DTO + pipe global),
 * délègue au service, pose le header X-Cache. Zéro logique métier ici (SRP).
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste paginée et filtrable des produits',
    description:
      'Pagination (page, limit) + filtres optionnels category / stock_status. ' +
      'Header X-Cache: HIT|MISS pour rendre le cache démontrable.',
  })
  @ApiOkResponse({ type: PaginatedProductsResponse })
  @Header('Cache-Control', 'no-store')
  findAll(
    @Query() query: QueryProductsDto,
    @Res({ passthrough: true }) res: Response,
  ): PaginatedProductsResponse {
    const { response, cacheHit } = this.productsService.findAll(query);
    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return response;
  }
}
