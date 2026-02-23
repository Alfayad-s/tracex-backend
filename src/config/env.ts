function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvOptional(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? defaultValue : value;
}

export function validateEnv(): void {
  getEnv('DATABASE_URL');
  getEnv('DIRECT_URL');
  const secret = getEnv('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}

export const env = {
  get nodeEnv(): string {
    return getEnvOptional('NODE_ENV', 'development');
  },
  get port(): number {
    return Number(getEnvOptional('PORT', '3000')) || 3000;
  },
  get corsOrigin(): string {
    return getEnvOptional('CORS_ORIGIN', '*');
  },
  get logLevel(): string {
    return getEnvOptional('LOG_LEVEL', 'info');
  },
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
};
