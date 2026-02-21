export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; initialDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const initialDelayMs = options?.initialDelayMs ?? 300;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const delay = initialDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError;
}
