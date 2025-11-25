import { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt';
import type { Bindings, JWTPayload } from '../types';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET;
  
  const payload = await verifyToken(token, secret);
  
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('user', payload);
  await next();
}

export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;
    const payload = await verifyToken(token, secret);
    
    if (payload) {
      c.set('user', payload);
    }
  }
  
  await next();
}

export function requirePlan(plans: string[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user') as JWTPayload;
    
    if (!user || !plans.includes(user.plan)) {
      return c.json({ 
        error: 'Access denied. Upgrade your plan to access this feature.' 
      }, 403);
    }
    
    await next();
  };
}
