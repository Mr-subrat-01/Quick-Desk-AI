import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        if (res && typeof res === 'object' && !Array.isArray(res) && 'message' in res) {
          const { message, ...data } = res;
          const hasData = Object.keys(data).length > 0;
          return {
            message: message || 'Success',
            success: true,
            ...(hasData ? { data } : {}),
          };
        }

        return {
          message: 'Success',
          success: true,
          data: res,
        };
      })
    );
  }
}
