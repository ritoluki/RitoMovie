export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;

  const responseMessage = (error as { response?: { data?: { message?: unknown } } } | null)
    ?.response?.data?.message;
  return typeof responseMessage === 'string' && responseMessage
    ? responseMessage
    : fallback;
};
