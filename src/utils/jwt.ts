import { SignJWT, jwtVerify } from 'jose';

const ALG = 'HS256';
const DEFAULT_EXPIRY = '7d'; // 7 days

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add JWT_SECRET to your .env file (see .env.example).'
    );
  }
  return new TextEncoder().encode(secret);
}

export type JwtPayload = { sub: string; email: string };

export async function signToken(payload: JwtPayload, expiresIn: string = DEFAULT_EXPIRY): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload, email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
  const sub = payload.sub;
  const email = payload.email as string | undefined;
  if (!sub || !email) throw new Error('Invalid token payload');
  return { sub, email };
}
