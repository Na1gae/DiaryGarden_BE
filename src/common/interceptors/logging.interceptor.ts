import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, originalUrl, ip } = request;
        const userAgent = request.get('user-agent') || '';
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - startTime;

                // 색상: 2xx 녹색, 3xx 청색, 4xx 노랑, 5xx 빨강
                const statusColor = this.getStatusColor(statusCode);
                
                this.logger.log(
                    `${statusColor}${method} ${originalUrl} ${statusCode}\x1b[0m - ${duration}ms - ${ip}`,
                );
            }),
        );
    }

    private getStatusColor(statusCode: number): string {
        if (statusCode >= 500) return '\x1b[31m'; // 빨강
        if (statusCode >= 400) return '\x1b[33m'; // 노랑
        if (statusCode >= 300) return '\x1b[36m'; // 청색
        return '\x1b[32m'; // 녹색
    }
}
