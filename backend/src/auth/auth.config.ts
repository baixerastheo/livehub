/**
 * Centralized JWT config. In production, throws if required env vars are missing or still default.
 */
const DEV_ACCESS_SECRET = 'changeme';
const DEV_REFRESH_SECRET = 'changeme_refresh';

function getSecret(
  primary: string | undefined,
  fallback: string | undefined,
  devDefault: string,
  label: string,
): string {
  const value = primary ?? fallback ?? devDefault;
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (value === devDefault || value === '')) {
    throw new Error(
      `Auth: missing required secret in production. Set JWT_SECRET or the specific ${label} env var.`,
    );
  }
  return value;
}

export function getJwtAccessSecret(): string {
  return getSecret(
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_SECRET,
    DEV_ACCESS_SECRET,
    'JWT_ACCESS_SECRET',
  );
}

export function getJwtRefreshSecret(): string {
  return getSecret(
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_SECRET,
    DEV_REFRESH_SECRET,
    'JWT_REFRESH_SECRET',
  );
}

export function getJwtAccessExpiresIn(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
}

export function getJwtRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
}

export function getJwtDefaultExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? '1d';
}

export function getRefreshTokenSameSite(): 'lax' | 'strict' | 'none' {
  const fromEnv = process.env.JWT_REFRESH_SAMESITE?.toLowerCase();

  if (fromEnv === 'lax' || fromEnv === 'strict' || fromEnv === 'none') {
    return fromEnv;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'strict';
  }

  return 'lax';
}
