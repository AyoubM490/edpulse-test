import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/** Endpoint de santé (utilisé par le health check du PaaS). */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
