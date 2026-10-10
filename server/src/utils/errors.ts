export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'ACCESS_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'REQUEST_TIMEOUT'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'UPLOAD_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public statusCode: number;
  public status: 'fail' | 'error';
  public isOperational: boolean;
  public code: ErrorCode;

  constructor(message: string, statusCode: number, code?: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    if (code) {
      this.code = code;
    } else {
      // Deduce default code based on HTTP status
      switch (statusCode) {
        case 400:
          this.code = 'VALIDATION_ERROR';
          break;
        case 401:
          this.code = 'AUTH_REQUIRED';
          break;
        case 403:
          this.code = 'ACCESS_DENIED';
          break;
        case 404:
          this.code = 'RESOURCE_NOT_FOUND';
          break;
        case 408:
          this.code = 'REQUEST_TIMEOUT';
          break;
        case 429:
          this.code = 'RATE_LIMITED';
          break;
        case 502:
          this.code = 'EXTERNAL_SERVICE_ERROR';
          break;
        case 503:
          this.code = 'SERVICE_UNAVAILABLE';
          break;
        case 504:
          this.code = 'REQUEST_TIMEOUT';
          break;
        default:
          this.code = statusCode >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
      }
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
