import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { COLLECTOR_CONFIG, CollectorServerConfig } from '../../config';
import { Inject } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(COLLECTOR_CONFIG) private readonly config: CollectorServerConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = this.extractApiKey(request);
    if (providedKey !== this.config.apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string') {
      const [scheme, token] = authorization.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) {
        return token.trim();
      }
    }
    const headerKey = request.headers['x-api-key'];
    if (typeof headerKey === 'string') {
      return headerKey.trim();
    }
    return undefined;
  }
}
