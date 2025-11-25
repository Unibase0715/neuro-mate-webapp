import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import type { Bindings, UserWithPassword } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// Sign up
auth.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, plan) VALUES (?, ?, ?)'
    ).bind(email, passwordHash, 'free').run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    const userId = result.meta.last_row_id as number;
    
    // Generate JWT token
    const token = await signToken(
      { userId, email, plan: 'free' },
      c.env.JWT_SECRET
    );
    
    return c.json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email,
        plan: 'free'
      }
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, plan FROM users WHERE email = ?'
    ).bind(email).first() as UserWithPassword | null;
    
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    
    // Generate JWT token
    const token = await signToken(
      { userId: user.id, email: user.email, plan: user.plan },
      c.env.JWT_SECRET
    );
    
    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const { verifyToken } = await import('../lib/jwt');
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, plan, created_at, updated_at FROM users WHERE id = ?'
    ).bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout (client-side should remove token)
auth.post('/logout', (c) => {
  return c.json({ message: 'Logout successful' });
});

export default auth;
