export function getAllowedOrigins(
  env: Record<string, string | undefined> = process.env
): string[] {
  return [
    ...new Set(
      [
        env.FRONTEND_URL || 'http://localhost:5173',
        ...(env.CORS_ORIGINS || '').split(','),
        'http://localhost:5173',
        'http://localhost:5174',
        'https://ritomovie.live',
        'https://www.ritomovie.live',
      ]
        .map((value) => value.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    ),
  ];
}
