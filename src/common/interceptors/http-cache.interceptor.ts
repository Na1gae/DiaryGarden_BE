import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';
    
    if (!isGetRequest) {
      return undefined;
    }

    const userId = request.user?.userId || 'public';
    return `${request.method}-${request.url}-${userId}`;
  }
}
