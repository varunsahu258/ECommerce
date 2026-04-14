export const requireEnv = (value: string | undefined, fallback?: string): string => {
  if (value && value.trim().length > 0) {
    return value;
  }

  if (fallback) {
    return fallback;
  }

  throw new Error("Missing required environment variable");
};

