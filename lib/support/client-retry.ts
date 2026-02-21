export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  options?: { retries?: number; initialDelayMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 2;
  const initialDelayMs = options?.initialDelayMs ?? 300;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const response = await fetch(input, init);
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const wait = initialDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, wait));
      attempt += 1;
    }
  }

  throw lastError;
}
