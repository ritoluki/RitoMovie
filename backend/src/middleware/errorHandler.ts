import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

// Type for translation function
type TFunction = (key: string, options?: Record<string, unknown>) => string;

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Get translation function from request
  const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = t('server.notFound');
    error = { ...error, statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = t('validation.invalidFormat', { field: 'field' });
    error = { ...error, statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { ...error, statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = t('auth.tokenInvalid');
    error = { ...error, statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = t('auth.tokenExpired');
    error = { ...error, statusCode: 401, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || t('server.internalError'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;

