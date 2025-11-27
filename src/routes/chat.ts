import { Hono } from 'hono';
import type { Bindings } from '../types';
import { verifyMemberId, saveConsultationHistory } from '../lib/sheets';
import { generateAIConsultation } from '../lib/ai';

const chat = new Hono<{ Bindings: Bindings }>();

/**
 * Verify member ID
 * POST /api/chat/verify
 * Body: { member_id: string }
 */
chat.post('/verify', async (c) => {
  try {
    const { member_id } = await c.req.json();
    const { env } = c;

    if (!member_id) {
      return c.json({ error: '会員IDを入力してください' }, 400);
    }

    // Verify member ID format (UNI-XXX)
    if (!/^UNI-\d{3}$/.test(member_id)) {
      return c.json({ 
        error: '会員IDの形式が正しくありません（例：UNI-001）' 
      }, 400);
    }

    // Get Google API Key from environment
    const googleApiKey = env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return c.json({ error: 'システムエラーが発生しました' }, 500);
    }

    // Verify member ID in spreadsheet
    const member = await verifyMemberId(member_id, googleApiKey);

    if (!member) {
      return c.json({ 
        error: 'この会員IDは登録されていません。店舗スタッフにお問い合わせください。' 
      }, 404);
    }

    if (member.status !== 'active') {
      return c.json({ 
        error: 'この会員IDは現在ご利用いただけません。店舗スタッフにお問い合わせください。' 
      }, 403);
    }

    // Member verified successfully
    return c.json({
      success: true,
      member: {
        member_id: member.member_id,
        name: member.name || '会員様',
      },
    });
  } catch (error) {
    console.error('Error verifying member:', error);
    return c.json({ error: '会員情報の確認に失敗しました' }, 500);
  }
});

/**
 * AI Consultation
 * POST /api/chat/consult
 * Body: {
 *   member_id: string,
 *   member_name: string,
 *   currentConcerns: string,
 *   lifestyleRhythm: string,
 *   additionalNotes: string
 * }
 */
chat.post('/consult', async (c) => {
  try {
    const body = await c.req.json();
    const { member_id, member_name, currentConcerns, lifestyleRhythm, additionalNotes } = body;
    const { env } = c;

    if (!member_id) {
      return c.json({ error: '会員IDが必要です' }, 400);
    }

    // Verify member is still active
    const googleApiKey = env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return c.json({ error: 'システムエラーが発生しました' }, 500);
    }

    const member = await verifyMemberId(member_id, googleApiKey);
    if (!member || member.status !== 'active') {
      return c.json({ 
        error: '会員情報の確認に失敗しました。もう一度会員IDを入力してください。' 
      }, 403);
    }

    // Generate AI consultation report
    const report = await generateAIConsultation(
      {
        currentConcerns,
        lifestyleRhythm,
        additionalNotes,
      },
      env
    );

    // Save consultation history to spreadsheet
    const timestamp = new Date().toISOString();
    await saveConsultationHistory(
      {
        timestamp,
        member_id,
        member_name: member_name || member.name || '会員様',
        consultation_type: 'AI詳細相談',
        content: JSON.stringify({ currentConcerns, lifestyleRhythm, additionalNotes }),
        ai_response: JSON.stringify(report),
      },
      googleApiKey
    );

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error in AI consultation:', error);
    return c.json({ error: 'AI相談の処理に失敗しました' }, 500);
  }
});

/**
 * Chat Message Handler (Conversational AI)
 * POST /api/chat/message
 * Body: {
 *   member_id: string,
 *   member_name: string,
 *   message: string,
 *   conversationHistory: Array<{role: string, content: string}>
 * }
 */
chat.post('/message', async (c) => {
  try {
    const body = await c.req.json();
    const { member_id, member_name, message, conversationHistory = [] } = body;
    const { env } = c;

    if (!member_id) {
      return c.json({ error: '会員IDが必要です' }, 400);
    }

    if (!message || !message.trim()) {
      return c.json({ error: 'メッセージを入力してください' }, 400);
    }

    // Verify member is still active
    const googleApiKey = env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return c.json({ error: 'システムエラーが発生しました' }, 500);
    }

    const member = await verifyMemberId(member_id, googleApiKey);
    if (!member || member.status !== 'active') {
      return c.json({ 
        error: '会員情報の確認に失敗しました。もう一度ログインしてください。' 
      }, 403);
    }

    // Generate conversational AI response
    const { generateChatResponse } = await import('../lib/ai');
    const reply = await generateChatResponse(
      {
        userMessage: message,
        conversationHistory,
        memberName: member_name || member.name || '会員様',
      },
      env
    );

    // Save chat message to spreadsheet
    const timestamp = new Date().toISOString();
    await saveConsultationHistory(
      {
        timestamp,
        member_id,
        member_name: member_name || member.name || '会員様',
        consultation_type: 'チャット相談',
        content: message,
        ai_response: reply,
      },
      googleApiKey
    );

    return c.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Error in chat message:', error);
    return c.json({ 
      error: 'メッセージ処理に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

/**
 * Get member consultation history
 * GET /api/chat/history/:member_id
 */
chat.get('/history/:member_id', async (c) => {
  try {
    const memberId = c.req.param('member_id');
    const { env } = c;

    const googleApiKey = env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return c.json({ error: 'システムエラーが発生しました' }, 500);
    }

    // Verify member first
    const member = await verifyMemberId(memberId, googleApiKey);
    if (!member || member.status !== 'active') {
      return c.json({ error: '会員情報の確認に失敗しました' }, 403);
    }

    // Get history (implementation would go here)
    // For now, return empty array
    return c.json({
      success: true,
      history: [],
    });
  } catch (error) {
    console.error('Error getting history:', error);
    return c.json({ error: '履歴の取得に失敗しました' }, 500);
  }
});

export default chat;
