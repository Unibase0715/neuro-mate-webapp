import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '../types';

const ALGORITHM = 'HS256';

export async function signToken(
  payload: JWTPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const { payload } = await jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
