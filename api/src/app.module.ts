import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ProductsModule],
  controllers: [HealthController],
})
export class AppModule {}
