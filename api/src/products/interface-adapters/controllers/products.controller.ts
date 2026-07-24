import { Controller, Get, Header, Inject, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  LIST_PRODUCTS,
  ListProductsPort,
  ListProductsQuery,
  ProductsPage,
} from '../../core/use-cases/boundaries/list-products.port';
import { QueryProductsDto } from '../dto/query-products.dto';
import { PaginatedProductsResponse } from '../dto/paginated-response.dto';

/**
 * Anneau INTERFACE ADAPTERS. Rôle : TRADUIRE entre le monde extérieur (query
 * string, DTO validé, enveloppe HTTP) et les boundaries du use case
 * (ListProductsQuery / ProductsPage). Dépend de l'input port via token, jamais
 * du use case concret.
 *
 * Ce controller assume AUSSI le rôle de Presenter : le mapping ProductsPage ->
 * `{ data, meta }` EST la présentation. En HTTP synchrone (NestJS), un Presenter
 * + output port séparés seraient redondants — le `return` + la sérialisation du
 * framework portent déjà la sortie vers l'extérieur (cf. écart « textbook »
 * volontairement omis). Zéro logique métier ici (SRP).
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(LIST_PRODUCTS)
    private readonly listProducts: ListProductsPort,
  ) {}

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
    const { page, cacheHit } = this.listProducts.execute(this.toQuery(query));
    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return this.toResponse(page);
  }

  /** DTO HTTP -> Request Model (renomme stock_status en stockStatus). */
  private toQuery(dto: QueryProductsDto): ListProductsQuery {
    return {
      page: dto.page,
      limit: dto.limit,
      category: dto.category,
      stockStatus: dto.stock_status,
    };
  }

  /** Response Model -> enveloppe HTTP `{ data, meta }` (rôle Presenter). */
  private toResponse(page: ProductsPage): PaginatedProductsResponse {
    return {
      data: page.items,
      meta: {
        page: page.page,
        limit: page.limit,
        total: page.total,
        totalPages: page.totalPages,
        hasNext: page.hasNext,
        hasPrev: page.hasPrev,
      },
    };
  }
}
