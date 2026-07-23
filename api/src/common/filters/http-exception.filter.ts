import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Corps d'erreur homogène renvoyé pour toute exception. */
interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Filtre d'exception global. Uniformise TOUTES les erreurs (HttpException levée
 * par la validation/Nest, ou erreur inattendue) vers un format unique. Une
 * erreur non-HTTP devient un 500 sans fuiter la stack au client.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { error, message } = this.extract(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private extract(
    exception: unknown,
    status: number,
  ): { error: string; message: string | string[] } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { error: exception.name, message: res };
      }
      const obj = res as Record<string, unknown>;
      return {
        error: (obj.error as string) ?? exception.name,
        message: (obj.message as string | string[]) ?? exception.message,
      };
    }

    return {
      error: 'Internal Server Error',
      message:
        status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Une erreur interne est survenue.'
          : 'Erreur inattendue.',
    };
  }
}
