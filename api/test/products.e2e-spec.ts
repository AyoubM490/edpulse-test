import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('GET /products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('renvoie une page par défaut { data, meta }', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('expose X-Cache: MISS puis HIT', async () => {
    const server = app.getHttpServer();
    const miss = await request(server)
      .get('/products?page=3&limit=7')
      .expect(200);
    expect(miss.headers['x-cache']).toBe('MISS');
    const hit = await request(server)
      .get('/products?page=3&limit=7')
      .expect(200);
    expect(hit.headers['x-cache']).toBe('HIT');
  });

  it('filtre par catégorie', async () => {
    const res = await request(app.getHttpServer())
      .get('/products?category=Electronics&limit=100')
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(
      res.body.data.every(
        (p: { category: string }) => p.category === 'Electronics',
      ),
    ).toBe(true);
  });

  it('400 si page < 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/products?page=0')
      .expect(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      path: '/products?page=0',
    });
    expect(res.body.timestamp).toBeDefined();
  });

  it('400 si limit > 100', async () => {
    await request(app.getHttpServer()).get('/products?limit=500').expect(400);
  });

  it('400 si stock_status inconnu', async () => {
    await request(app.getHttpServer())
      .get('/products?stock_status=bogus')
      .expect(400);
  });

  it('400 si param non autorisé (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer()).get('/products?evil=1').expect(400);
  });
});
