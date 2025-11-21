import { Request, Response, NextFunction } from 'express';
import i18next from '../config/i18n';

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
  // i18next-http-middleware attaches 't' to req object
  // Fallback to i18next directly if req.t is not available
  const getTranslationFunction = (): TFunction => {
    // Try to get from req.t (injected by i18next-http-middleware)
    if ((req as any).t) {
      return (req as any).t;
    }
    
    // Fallback: use i18next directly with language from Accept-Language header
    const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    return (key: string, options?: Record<string, unknown>) => {
      try {
        return i18next.t(key, { lng: language, ...options });
      } catch {
        return key;
      }
    };
  };

  const t = getTranslationFunction();

  // Helper function to translate message if it's a translation key
  const translateMessage = (msg: string): string => {
    if (!msg) return msg;
    
    // Check if message looks like a translation key (contains dots like 'auth.invalidCredentials')
    if (msg.includes('.')) {
      try {
        const translated = t(msg);
        // If translation works and returns different value, use it
        if (translated && translated !== msg) {
          return translated;
        }
        // If translation returns the same key, try with default language
        const defaultTranslated = i18next.t(msg, { lng: 'en' });
        if (defaultTranslated && defaultTranslated !== msg) {
          return defaultTranslated;
        }
        // Fallback: return message as is (might be a key that doesn't exist)
        return msg;
      } catch (error) {
        // If translation fails, try direct i18next call
        try {
          const directTranslated = i18next.t(msg, { lng: 'en' });
          return directTranslated !== msg ? directTranslated : msg;
        } catch {
          return msg;
        }
      }
    }
    return msg;
  };

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

  // Translate the error message if it's a translation key
  const finalMessage = translateMessage(error.message || t('server.internalError'));

  res.status(error.statusCode || 500).json({
    success: false,
    message: finalMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;

