import { Hono } from 'hono';
import { authMiddleware, requirePlan } from '../middleware/auth';
import { generateAIConsultation, generateDailyCoachPlan } from '../lib/ai';
import type { Bindings, JWTPayload, AIConsultationInput, CoachLog } from '../types';

const ai = new Hono<{ Bindings: Bindings }>();

// AI Consultation (Basic plan) - POST /consult
ai.post('/consult', authMiddleware, requirePlan(['basic', 'premium']), async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const input: AIConsultationInput = await c.req.json();
    
    // Check monthly consultation limit for basic plan
    if (user.plan === 'basic') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const usage = await c.env.DB.prepare(
        'SELECT count FROM consultation_usage WHERE user_id = ? AND month = ?'
      ).bind(user.userId, currentMonth).first();
      
      const currentCount = usage?.count as number || 0;
      const limit = 3; // Basic plan limit
      
      if (currentCount >= limit) {
        return c.json({ 
          error: `月${limit}回の相談上限に達しました。来月または、プレミアムプランへのアップグレードをご検討ください。` 
        }, 429);
      }
    }
    
    // Generate AI consultation
    const report = await generateAIConsultation(input, c.env);
    
    // Save to database
    const dbResult = await c.env.DB.prepare(
      'INSERT INTO ai_reports (user_id, input_text, report_json) VALUES (?, ?, ?)'
    ).bind(
      user.userId,
      JSON.stringify(input),
      JSON.stringify(report)
    ).run();
    
    if (!dbResult.success) {
      throw new Error('Failed to save report');
    }
    
    // Update consultation usage
    if (user.plan === 'basic') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      await c.env.DB.prepare(`
        INSERT INTO consultation_usage (user_id, month, count) 
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, month) 
        DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
      `).bind(user.userId, currentMonth).run();
    }
    
    return c.json({
      report,
      id: dbResult.meta.last_row_id
    });
  } catch (error) {
    console.error('AI consultation error:', error);
    return c.json({ error: 'AI相談の生成に失敗しました' }, 500);
  }
});

// Get consultation history
ai.get('/consult/history', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    
    const results = await c.env.DB.prepare(
      'SELECT id, report_json, created_at FROM ai_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(user.userId).all();
    
    return c.json({
      history: results.results.map(row => ({
        id: row.id,
        report: JSON.parse(row.report_json as string),
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get consultation history error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// Save daily coach log (Premium plan)
ai.post('/coach/log', authMiddleware, requirePlan(['premium']), async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const log: CoachLog = await c.req.json();
    
    // Validate input
    if (!log.log_date) {
      return c.json({ error: 'log_date is required' }, 400);
    }
    
    // Save log
    const result = await c.env.DB.prepare(`
      INSERT INTO coach_logs 
      (user_id, log_date, sleep_hours, fatigue_level, mood_level, pain_level, did_selfcare)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId,
      log.log_date,
      log.sleep_hours,
      log.fatigue_level,
      log.mood_level,
      log.pain_level,
      log.did_selfcare
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to save log');
    }
    
    return c.json({
      message: 'Log saved successfully',
      id: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Save coach log error:', error);
    return c.json({ error: 'Failed to save log' }, 500);
  }
});

// Get coach logs
ai.get('/coach/log', authMiddleware, requirePlan(['premium']), async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const limit = parseInt(c.req.query('limit') || '7');
    
    const results = await c.env.DB.prepare(
      'SELECT * FROM coach_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT ?'
    ).bind(user.userId, limit).all();
    
    return c.json({
      logs: results.results
    });
  } catch (error) {
    console.error('Get coach logs error:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

// Generate daily plan (Premium plan)
ai.post('/coach/plan', authMiddleware, requirePlan(['premium']), async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    
    // Get recent logs (last 7 days)
    const logs = await c.env.DB.prepare(
      'SELECT * FROM coach_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 7'
    ).bind(user.userId).all();
    
    // Generate daily plan using AI
    const plan = await generateDailyCoachPlan(logs.results, c.env);
    
    return c.json({ plan });
  } catch (error) {
    console.error('Generate daily plan error:', error);
    return c.json({ error: 'Failed to generate plan' }, 500);
  }
});

export default ai;
