import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HTTP');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message || message;
        } else if (exception instanceof Error) {
            message = exception.message;
            // 500 에러는 스택 트레이스도 출력
            this.logger.error(`${exception.message}`, exception.stack);
        }

        // 에러 로그 출력 (4xx 노랑, 5xx 빨강)
        const color = status >= 500 ? '\x1b[31m' : '\x1b[33m';
        this.logger.log(
            `${color}${request.method} ${request.originalUrl} ${status}\x1b[0m - ${request.ip} - ${Array.isArray(message) ? message.join(', ') : message}`,
        );

        response.status(status).json({
            success: false,
            message: Array.isArray(message) ? message.join(', ') : message,
        });
    }
}
