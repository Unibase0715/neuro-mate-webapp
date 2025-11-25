import { Hono } from 'hono';
import { optionalAuthMiddleware } from '../middleware/auth';
import { generateDiagnosisResult } from '../lib/diagnosis';
import type { Bindings, DiagnosisAnswers, JWTPayload } from '../types';

const diagnosis = new Hono<{ Bindings: Bindings }>();

// Run diagnosis
diagnosis.post('/run', optionalAuthMiddleware, async (c) => {
  try {
    const answers: DiagnosisAnswers = await c.req.json();
    
    // Validate input
    if (!answers.ageGroup || !answers.gender || !answers.mainConcerns) {
      return c.json({ error: 'Required fields are missing' }, 400);
    }
    
    // Generate diagnosis result
    const result = generateDiagnosisResult(answers);
    
    // Save to database if user is logged in
    const user = c.get('user') as JWTPayload | undefined;
    let savedId: number | null = null;
    
    if (user) {
      const dbResult = await c.env.DB.prepare(
        'INSERT INTO diagnosis_results (user_id, answers_json, result_json) VALUES (?, ?, ?)'
      ).bind(
        user.userId,
        JSON.stringify(answers),
        JSON.stringify(result)
      ).run();
      
      if (dbResult.success) {
        savedId = dbResult.meta.last_row_id as number;
      }
    }
    
    return c.json({
      result,
      saved: !!savedId,
      id: savedId
    });
  } catch (error) {
    console.error('Diagnosis error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get diagnosis history (requires auth)
diagnosis.get('/history', async (c) => {
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
    
    const results = await c.env.DB.prepare(
      'SELECT id, result_json, created_at FROM diagnosis_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(payload.userId).all();
    
    return c.json({
      history: results.results.map(row => ({
        id: row.id,
        result: JSON.parse(row.result_json as string),
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default diagnosis;
