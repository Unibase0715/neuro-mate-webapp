import { Hono } from 'hono';
import type { Bindings } from '../types';
import { verifyMemberId, saveConsultationHistory, linkLineUserToMember, getLinkedMember } from '../lib/sheets';
import { generateChatResponse } from '../lib/ai';

const line = new Hono<{ Bindings: Bindings }>();

/**
 * LINE Messaging API - Send Reply
 */
async function sendLineReply(
  replyToken: string,
  messages: any[],
  lineChannelAccessToken: string
): Promise<void> {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineChannelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE API Error: ${error}`);
  }
}

/**
 * LINE Messaging API - Send Push Message
 */
async function sendLinePush(
  userId: string,
  messages: any[],
  lineChannelAccessToken: string
): Promise<void> {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineChannelAccessToken}`
    },
    body: JSON.stringify({
      to: userId,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE API Error: ${error}`);
  }
}

/**
 * Verify LINE Webhook Signature using Web Crypto API
 * Cloudflare Workers環境ではNode.jsのcryptoモジュールは使えないため、Web Crypto APIを使用
 */
async function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): Promise<boolean> {
  // TextEncoderでUTF-8バイト配列に変換
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );
  
  // Base64エンコード
  const hashArray = Array.from(new Uint8Array(signatureBytes));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return hashBase64 === signature;
}

/**
 * LINE Webhook Endpoint
 * POST /api/line/webhook
 */
line.post('/webhook', async (c) => {
  let bodyText = '';
  let body: any = {};
  let replyToken: string | null = null;
  
  try {
    const { env } = c;
    
    // Get LINE credentials from environment
    const lineChannelSecret = env.LINE_CHANNEL_SECRET;
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
    const googleApiKey = env.GOOGLE_API_KEY;
    
    if (!lineChannelSecret || !lineChannelAccessToken) {
      console.error('LINE credentials not configured');
      return c.json({ error: 'LINE credentials not configured' }, 500);
    }
    
    if (!googleApiKey) {
      console.error('Google API key not configured');
      return c.json({ error: 'Google API key not configured' }, 500);
    }
    
    // Verify signature
    const signature = c.req.header('x-line-signature');
    bodyText = await c.req.text();
    
    if (!signature || !(await verifyLineSignature(bodyText, signature, lineChannelSecret))) {
      console.error('Invalid LINE signature');
      return c.json({ error: 'Invalid signature' }, 403);
    }
    
    body = JSON.parse(bodyText);
    const events = body.events || [];
    
    // Extract replyToken for error handling
    if (events.length > 0 && events[0].replyToken) {
      replyToken = events[0].replyToken;
    }
    
    // Process each event
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const replyToken = event.replyToken;
        const userMessage = event.message.text;
        
        console.log(`Received message from LINE user: ${userId}`);
        console.log(`Message: ${userMessage}`);
        
        // Check if user is linked to a member
        const linkedMember = await getLinkedMember(userId, googleApiKey);
        
        if (!linkedMember) {
          // User not linked - check if message is a member ID
          const memberIdPattern = /^UNI-\d{3}$/i;
          const match = userMessage.trim().toUpperCase().match(memberIdPattern);
          
          if (match) {
            const memberId = match[0];
            
            // Verify member ID
            const member = await verifyMemberId(memberId, googleApiKey);
            
            if (!member) {
              await sendLineReply(
                replyToken,
                [{ 
                  type: 'text', 
                  text: 'この会員IDは登録されていません。\n店舗スタッフにお問い合わせください。' 
                }],
                lineChannelAccessToken
              );
              continue;
            }
            
            if (member.status !== 'active') {
              await sendLineReply(
                replyToken,
                [{ 
                  type: 'text', 
                  text: 'この会員IDは現在ご利用いただけません。\n店舗スタッフにお問い合わせください。' 
                }],
                lineChannelAccessToken
              );
              continue;
            }
            
            // Link LINE user to member
            await linkLineUserToMember(userId, memberId, member.name, googleApiKey);
            
            await sendLineReply(
              replyToken,
              [{ 
                type: 'text', 
                text: `${member.name}さん、こんにちは！\n\n会員ID ${memberId} の認証が完了しました。\n\n脳活labo AIアドバイザーです。\n\n今日はどんなことが一番気になりますか？\n頭の重さ・眠り・メンタル・胃腸・肩こり・美容、なんでも自由に書いてください。\n\nあなたの状態を脳・自律神経の視点から整理して、具体的なサポートを提案します。`
              }],
              lineChannelAccessToken
            );
            
            console.log(`Linked LINE user ${userId} to member ${memberId}`);
            continue;
          } else {
            // Not a member ID - ask for registration
            await sendLineReply(
              replyToken,
              [{ 
                type: 'text', 
                text: 'ご利用には会員登録が必要です。\n\n店舗でお渡しした会員ID（例：UNI-001）を送信してください。'
              }],
              lineChannelAccessToken
            );
            continue;
          }
        }
        
        // User is linked - check member status
        const member = await verifyMemberId(linkedMember.member_id, googleApiKey);
        
        if (!member || member.status !== 'active') {
          await sendLineReply(
            replyToken,
            [{ 
              type: 'text', 
              text: '会員情報の確認に失敗しました。\n店舗スタッフにお問い合わせください。'
            }],
            lineChannelAccessToken
          );
          continue;
        }
        
        // Generate AI response
        // TODO: Load conversation history from database
        const conversationHistory: Array<{ role: string; content: string }> = [];
        
        const aiReply = await generateChatResponse(
          {
            userMessage,
            conversationHistory,
            memberName: member.name || '会員様',
          },
          env
        );
        
        // Save consultation history
        const timestamp = new Date().toISOString();
        await saveConsultationHistory(
          {
            timestamp,
            member_id: member.member_id,
            member_name: member.name || '会員様',
            consultation_type: 'LINEチャット相談',
            content: userMessage,
            ai_response: aiReply,
          },
          googleApiKey
        );
        
        // Send AI reply via LINE
        // Split long messages if needed (LINE has 5000 char limit per message)
        const maxLength = 4000; // Leave some buffer
        const messages = [];
        
        if (aiReply.length <= maxLength) {
          messages.push({ type: 'text', text: aiReply });
        } else {
          // Split into multiple messages
          const parts = aiReply.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [aiReply];
          for (const part of parts) {
            messages.push({ type: 'text', text: part });
          }
        }
        
        await sendLineReply(replyToken, messages, lineChannelAccessToken);
        
        console.log(`Sent AI reply to LINE user ${userId}`);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    
    // Try to send error message to LINE if replyToken is available
    if (replyToken) {
      try {
        const { env } = c;
        await sendLineReply(
          replyToken,
          [{ 
            type: 'text', 
            text: `申し訳ございません。システムエラーが発生しました。\n\nしばらく待ってから再度お試しいただくか、店舗スタッフにお問い合わせください。\n\nエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          env.LINE_CHANNEL_ACCESS_TOKEN
        );
      } catch (replyError) {
        console.error('Failed to send error reply to LINE:', replyError);
      }
    }
    
    return c.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

/**
 * Send Daily Reminders
 * POST /api/line/send-reminders
 * Called by Cloudflare Cron Trigger
 */
line.post('/send-reminders', async (c) => {
  try {
    const { env } = c;
    
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
    const googleApiKey = env.GOOGLE_API_KEY;
    
    if (!lineChannelAccessToken || !googleApiKey) {
      return c.json({ error: 'Credentials not configured' }, 500);
    }
    
    // Get all active members with linked LINE accounts
    const { getAllLinkedActiveMembers } = await import('../lib/sheets');
    const activeMembers = await getAllLinkedActiveMembers(googleApiKey);
    
    if (activeMembers.length === 0) {
      return c.json({ 
        success: true,
        message: 'No active members to send reminders to'
      });
    }
    
    // Prepare reminder message
    const hour = new Date().getHours();
    let reminderMessage = '';
    
    if (hour >= 6 && hour < 12) {
      // Morning reminder
      reminderMessage = `おはようございます！\n\n今日も一日、体と心を整えましょう。\n\n【朝のセルフケア】\n\n✨ 自然光浴（10分）\n起床後すぐに自然光を浴びて視交叉上核をリセット。体内時計を整えます。\n\n✨ 朝タンパク質\n起床1時間以内に卵や魚でタンパク質20g。脳のエネルギー供給と血糖安定化。\n\n✨ 水分補給\n起床時にコップ1杯の水。脳脊髄液と脳血流を維持します。\n\n今日の体調や気になることがあれば、いつでもメッセージください！`;
    } else if (hour >= 12 && hour < 18) {
      // Afternoon reminder
      reminderMessage = `お疲れ様です！\n\n午後の集中力を保つための小休憩をとりましょう。\n\n【午後のセルフケア】\n\n✨ 20-20-20視覚リセット\n20分作業→20秒→6m先を見る。眼精疲労・頭痛を防ぎます。\n\n✨ 肩甲骨はがし\n壁に手をついて体を捻り、肩甲骨周囲の筋膜を剥がし血流改善。\n\n✨ 水分補給\n午後の集中力維持に水分は必須です。\n\n体の疲れや違和感を感じたら、遠慮なく相談してくださいね。`;
    } else {
      // Evening reminder
      reminderMessage = `お疲れ様でした！\n\n1日の疲れをリセットして、質の良い睡眠を。\n\n【夜のセルフケア】\n\n✨ 4-7-8呼吸法\n4秒吸って7秒止めて8秒吐く。副交感神経を優位にして安眠モードへ。\n\n✨ ブルーライトカット\n19時以降はナイトモード＋画面輝度40％以下。メラトニン分泌を保護。\n\n✨ 就寝90分前入浴\n40℃15分入浴で深睡眠が増加します。\n\n今日の体調や明日の不安があれば、お話しください。一緒に整えましょう！`;
    }
    
    // Send reminders to all active members
    let successCount = 0;
    let errorCount = 0;
    
    for (const member of activeMembers) {
      try {
        await sendLinePush(
          member.line_user_id,
          [{ 
            type: 'text', 
            text: reminderMessage 
          }],
          lineChannelAccessToken
        );
        successCount++;
        console.log(`Sent reminder to ${member.member_name} (${member.member_id})`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to send reminder to ${member.member_id}:`, error);
      }
    }
    
    return c.json({ 
      success: true,
      message: `Reminders sent: ${successCount} success, ${errorCount} errors`,
      total_members: activeMembers.length,
      success_count: successCount,
      error_count: errorCount
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    return c.json({ 
      error: 'Failed to send reminders',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default line;
