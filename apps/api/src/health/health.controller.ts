import { Controller, Get } from '@nestjs/common';

// Coolify y el monitor de caídas consultan este endpoint.
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
