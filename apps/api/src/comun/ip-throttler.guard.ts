import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/** IP real de quien envía: la API está detrás de Cloudflare y del proxy de Coolify. */
export function ipDe(req: Request): string {
  const cloudflare = req.headers['cf-connecting-ip'];
  return (typeof cloudflare === 'string' && cloudflare) || req.ip || 'desconocida';
}

@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    return ipDe(req as unknown as Request);
  }
}
