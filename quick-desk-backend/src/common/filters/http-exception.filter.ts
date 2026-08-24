import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const message = statusCode === 429 ? 'Too many request, please try again later'
      : typeof exResponse == 'object' && exResponse != null && 'message' in exResponse ?
        exResponse.message : exception instanceof Error ? exception.message : 'Internal server error';

    response.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

  }
}
