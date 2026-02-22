import * as jose from 'jose';

const ALG = 'HS256';

export interface JwtPayload {
  sub: string;
  email: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  const key = new TextEncoder().encode(secret);
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set');
  }
  const key = new TextEncoder().encode(secret);
  const { payload } = await jose.jwtVerify(token, key);
  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub, email };
}
