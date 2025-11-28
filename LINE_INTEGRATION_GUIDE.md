# Neuro mate - LINE統合ガイド

## 概要

Neuro mateは**LINE公式アカウント**をフロントエンドとして利用するAI脳活アドバイザーシステムです。
ユーザーはブラウザではなく、**LINEのトーク画面**からのみ相談を行います。

## アーキテクチャ

```
[ユーザー] 
    ↓ メッセージ送信
[LINE公式アカウント]
    ↓ Webhook
[Cloudflare Pages/Functions]
    ├─ /api/line/webhook (メッセージ受信・応答)
    ├─ /api/line/send-reminders (毎日のリマインダー)
    └─ Google Sheets (会員管理・履歴保存)
```

## セットアップ手順

### 1. LINE Developers Consoleでの設定

1. **LINE Developers Console**にアクセス
   - https://developers.line.biz/console/

2. **新しいプロバイダーを作成**
   - プロバイダー名: `脳活labo Unibase`

3. **Messaging APIチャンネルを作成**
   - チャンネル名: `Neuro mate`
   - チャンネル説明: `脳活AIヘルスアドバイザー`
   - カテゴリ: `医療・健康`

4. **Channel Secretを取得**
   - 「Basic settings」タブ → 「Channel secret」をコピー

5. **Channel Access Tokenを発行**
   - 「Messaging API」タブ → 「Channel access token (long-lived)」を発行

6. **Webhook URLを設定**
   - 「Messaging API」タブ → 「Webhook settings」
   - Webhook URL: `https://your-project.pages.dev/api/line/webhook`
   - 「Use webhook」をONにする
   - 「Verify」ボタンでテスト

7. **応答設定**
   - 「Messaging API」タブ → 「LINE Official Account features」
   - 「Auto-reply messages」を**オフ**にする
   - 「Greeting messages」を**オフ**にする
   - （AIが自動応答するため、公式の自動応答は不要）

### 2. 環境変数の設定

#### ローカル開発 (`.dev.vars`)

```bash
# LINE Messaging API Configuration
LINE_CHANNEL_SECRET=your-channel-secret-here
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token-here
```

#### 本番環境 (Cloudflare Pages)

```bash
# Cloudflare Pages Settings → Environment variables
wrangler pages secret put LINE_CHANNEL_SECRET
wrangler pages secret put LINE_CHANNEL_ACCESS_TOKEN
```

### 3. Google Sheetsの準備

スプレッドシート`1sXkkcOQ4iKLkemKCriLELZsms5d0jSoZ-17LimuyC_E`に以下のシートを追加:

#### シート「LINE連携」

| A: line_user_id | B: member_id | C: member_name | D: linked_at |
|-----------------|--------------|----------------|--------------|
| (LINEユーザーID) | UNI-001      | 高見拓人       | 2025-01-15T10:00:00Z |

**列の説明:**
- `line_user_id`: LINEのユーザーID (自動取得)
- `member_id`: 会員ID (UNI-001形式)
- `member_name`: 会員名
- `linked_at`: 連携日時 (ISO 8601形式)

## 使用フロー

### 初回利用（会員ID登録）

1. ユーザーがLINE公式アカウントを友だち追加
2. ユーザーが会員ID（例: `UNI-001`）を送信
3. システムが会員IDを検証（Google Sheetsの「シート1」で照合）
4. 検証成功 → LINEユーザーIDと会員IDを紐付け（「LINE連携」シートに保存）
5. AIが挨拶メッセージを送信

### 通常利用（相談）

1. ユーザーが自由なメッセージを送信
   - 例: 「デスクワークで肩こりがひどいです」
2. システムが会員ステータスを確認（active/inactive）
3. AIが会話履歴を考慮して応答生成
4. AIの回答をLINEメッセージで返信
5. 相談内容と応答を「相談履歴」シートに保存

### 会員ステータスチェック

- **active**: AI応答を送信
- **inactive**: エラーメッセージを送信（「現在ご利用いただけません」）

## APIエンドポイント

### POST /api/line/webhook

**概要:** LINE Messaging APIからのWebhookを受信し、ユーザーメッセージに応答

**リクエストヘッダー:**
```
Content-Type: application/json
x-line-signature: <signature>
```

**リクエストボディ (LINE形式):**
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "デスクワークで肩こりがひどいです"
      },
      "source": {
        "userId": "U1234567890abcdef"
      },
      "replyToken": "reply-token-here"
    }
  ]
}
```

**処理フロー:**
1. 署名検証（LINE Channel Secretで検証）
2. LINEユーザーID → 会員ID 紐付けチェック
3. 未紐付けの場合 → 会員ID登録を促す
4. 紐付け済みの場合 → AI応答生成 → LINE返信
5. 相談履歴をGoogle Sheetsに保存

### POST /api/line/send-reminders

**概要:** 全アクティブ会員に毎日のリマインダーを送信

**認証:** なし（Cloudflare Cron Triggerから呼び出し）

**リクエストボディ:** なし

**レスポンス:**
```json
{
  "success": true,
  "message": "Reminders sent: 50 success, 0 errors",
  "total_members": 50,
  "success_count": 50,
  "error_count": 0
}
```

**リマインダー内容:**
- **朝 (6-12時)**: 自然光浴、朝タンパク質、水分補給
- **午後 (12-18時)**: 20-20-20視覚リセット、肩甲骨はがし
- **夜 (18-6時)**: 4-7-8呼吸法、ブルーライトカット、入浴

## Cloudflare Cron Triggerの設定

毎日リマインダーを送信するには、`wrangler.jsonc`に以下を追加:

```jsonc
{
  "triggers": {
    "crons": [
      "0 7 * * *",   // 毎朝7時 (JST 16:00 UTC)
      "0 12 * * *",  // 毎昼12時 (JST 21:00 UTC)
      "0 19 * * *"   // 毎夜19時 (JST 04:00 UTC+1)
    ]
  }
}
```

**Cron Triggerハンドラー追加:**

```typescript
// src/index.tsx
export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
    // Send daily reminders
    const response = await fetch('https://your-project.pages.dev/api/line/send-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Reminder sent:', await response.json());
  }
};
```

## テスト方法

### 1. ローカルテスト（Webhook）

```bash
# 会員ID登録のシミュレーション
curl -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{
    "events": [{
      "type": "message",
      "message": {"type": "text", "text": "UNI-001"},
      "source": {"userId": "test-user-123"},
      "replyToken": "test-token"
    }]
  }'
```

### 2. リマインダーテスト

```bash
curl -X POST http://localhost:3000/api/line/send-reminders
```

## セキュリティ

### 署名検証

LINE Webhookの署名検証を実装済み:

```typescript
function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}
```

### 環境変数保護

- `.dev.vars`: `.gitignore`に追加済み
- 本番環境: Cloudflare Pagesのシークレット機能を使用

## トラブルシューティング

### Webhook検証エラー

**症状:** LINE Developers Consoleで「Webhook URLの検証に失敗しました」

**原因:**
- 環境変数が設定されていない
- 署名検証が失敗している
- エンドポイントがアクセス不可

**解決策:**
1. `.dev.vars`または本番環境変数を確認
2. `pm2 logs neuro-mate`でエラーログを確認
3. Webhook URLが正しいか確認

### 会員ID認証エラー

**症状:** 会員IDを送信しても「登録されていません」

**原因:**
- Google Sheetsの「シート1」に会員情報がない
- 会員IDの形式が間違っている（UNI-XXX形式）
- `status`が`inactive`

**解決策:**
1. Google Sheetsの「シート1」を確認
2. 会員IDが`UNI-001`形式か確認
3. `status`列が`active`か確認

### AI応答が返ってこない

**症状:** メッセージを送信してもAIが応答しない

**原因:**
- OpenAI/Anthropic APIキーが無効
- APIクレジットが不足
- `AI_PROVIDER`がmockモード

**解決策:**
1. `.dev.vars`で`AI_PROVIDER=openai`を確認
2. OpenAI Platformでクレジット残高を確認
3. `pm2 logs neuro-mate`でエラーログを確認

## 本番デプロイ

```bash
# 1. ビルド
npm run build

# 2. 環境変数設定
wrangler pages secret put LINE_CHANNEL_SECRET
wrangler pages secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler pages secret put OPENAI_API_KEY
wrangler pages secret put GOOGLE_API_KEY

# 3. デプロイ
npm run deploy

# 4. LINE Webhook URL更新
# https://your-project.pages.dev/api/line/webhook
```

## 参考リンク

- [LINE Messaging API Documentation](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Developers Console](https://developers.line.biz/console/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
