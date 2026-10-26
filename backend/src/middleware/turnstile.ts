import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const verifyTurnstile = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Local development stays usable without a production Turnstile secret.
  if (!secret && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  if (!secret) {
    next(new ApiError(503, 'Robot verification is not configured.'));
    return;
  }

  const token = typeof req.body?.turnstileToken === 'string'
    ? req.body.turnstileToken.trim()
    : '';

  if (!token) {
    next(new ApiError(400, 'Please complete the robot verification.'));
    return;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    if (!response.ok) {
      next(new ApiError(503, 'Robot verification is temporarily unavailable.'));
      return;
    }

    const result = await response.json() as SiteverifyResponse;
    if (!result.success) {
      next(new ApiError(400, 'Robot verification failed. Please try again.'));
      return;
    }

    next();
  } catch {
    next(new ApiError(503, 'Robot verification is temporarily unavailable.'));
  }
};
