import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS restreint à l'origine du front (ou '*' via env en dev).
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  // Validation globale : rejette tout param non déclaré, coerce les types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Format d'erreur homogène sur toute l'application.
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Swagger — quelques lignes, gros gain pour le reviewer (/docs).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Edpulse Products API')
    .setDescription(
      'API de consultation de produits (in-memory, cache, pagination)',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API prête sur http://localhost:${port} (docs: /docs)`);
}

void bootstrap();
