# AI統合テストガイド

このガイドでは、OpenAI GPT-4oとAnthropic Claude 3.5 Sonnetの統合が正しく動作するかテストします。

## 前提条件

1. `.dev.vars`ファイルに有効なAPIキーが設定されていること
2. サーバーが起動していること（`pm2 start ecosystem.config.cjs`）
3. テスト用ユーザーアカウントが作成されていること

## テスト手順

### 1. ユーザー登録とログイン

```bash
# 1. ベーシックプランのユーザーを登録
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "basic-test@example.com",
    "password": "password123"
  }'

# 2. レスポンスからトークンを取得
# レスポンス例: {"user":{"id":1,"email":"basic-test@example.com","plan":"free"},"token":"eyJhbGc..."}

# 3. プランをベーシックにアップグレード（データベース直接操作）
# これは開発用のショートカットです。本番ではStripe決済連携を実装します。
```

### 2. AI相談テスト（ベーシックプラン）

**重要:** ベーシックプラン以上のユーザーのみがAI相談を利用できます。

```bash
# AIトークンを環境変数として設定（上記の登録レスポンスから取得）
export AUTH_TOKEN="eyJhbGc..."

# AI相談リクエスト
curl -X POST http://localhost:3000/api/ai/consult \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "currentConcerns": "最近、首肩のコリがひどく、集中力が続きません。夜もなかなか寝付けず、朝起きても疲れが取れていない感じがします。",
    "lifestyleRhythm": "デスクワーク中心で1日8-10時間座りっぱなしです。運動はほとんどしておらず、睡眠時間は5-6時間程度です。",
    "additionalNotes": "サプリメントは今まで試したことがありませんが、改善したいと思っています。"
  }'
```

**期待されるレスポンス:**

```json
{
  "report": {
    "summary": "あなたの症状から、慢性的な疲労と脳のエネルギー不足が考えられます...",
    "factors": {
      "chronicPain": "長時間のデスクワークによる首肩の筋緊張と血流の低下が考えられます。",
      "beauty": "睡眠不足とストレスにより、肌のターンオーバーが乱れている可能性があります。",
      "performance": "脳のエネルギー不足により、集中力と作業効率が低下しています。"
    },
    "supplements": [
      {
        "name": "BHB（ケトン体）",
        "score": 95,
        "reason": "脳のエネルギー源として即効性があり、集中力向上に効果的です。",
        "expectedEffects": ["脳機能向上", "メンタルクリア", "持続的エネルギー"]
      },
      ...
    ],
    "selfCare": [...],
    "lifestyleImprovements": [...],
    "mentalSupport": "完璧を目指さず、小さな改善を積み重ねることが大切です..."
  },
  "id": 1
}
```

### 3. AIコーチングテスト（プレミアムプラン）

**重要:** プレミアムプランのユーザーのみがコーチング機能を利用できます。

```bash
# プレミアムユーザーを登録
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "premium-test@example.com",
    "password": "password123"
  }'

# トークンを取得して環境変数に設定
export AUTH_TOKEN="eyJhbGc..."

# 1. 日次ログを記録（7日分）
curl -X POST http://localhost:3000/api/ai/coach/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "log_date": "2025-11-25",
    "sleep_hours": 6,
    "fatigue_level": 7,
    "mood_level": 5,
    "pain_level": 6,
    "did_selfcare": "首肩ストレッチを10分実施"
  }'

# 2. AIコーチングプランを生成
curl -X POST http://localhost:3000/api/ai/coach/plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**期待されるレスポンス:**

```json
{
  "plan": {
    "feedback": "睡眠時間は良好ですが、疲労度が高めです。今日は軽めのセルフケアを重点的に行いましょう。",
    "menu": [
      {
        "title": "朝の眼球運動",
        "description": "目を上下左右にゆっくり動かし、8の字を描きます。",
        "duration": "3分"
      },
      ...
    ]
  }
}
```

## トラブルシューティング

### APIエラーが発生する場合

1. **APIキーが正しく設定されているか確認:**
   ```bash
   cat .dev.vars
   ```

2. **APIキーが有効か確認:**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys

3. **サーバーログを確認:**
   ```bash
   pm2 logs neuro-mate --nostream
   ```

4. **APIクォータを確認:**
   - OpenAI: APIキーの使用量と残高を確認
   - Anthropic: Claudeのクレジット残高を確認

### モックレスポンスが返される場合

これは正常な動作です。実際のAI APIでエラーが発生した場合、自動的にモックレスポンスにフォールバックします。

モックレスポンスを無効にしたい場合は、`src/lib/ai.ts`の`generateAIConsultation`関数と`generateDailyCoachPlan`関数のエラーハンドリングを修正してください。

## 開発用モックモード

実際のAPIキーなしでテストしたい場合は、`.dev.vars`で以下のように設定できます：

```bash
AI_PROVIDER=mock
```

この設定では、常にモックレスポンスが返されます（APIコストがかかりません）。

## APIコストの目安

### OpenAI GPT-4o
- 入力: $2.50 / 1M tokens
- 出力: $10.00 / 1M tokens
- 1回の相談: 約 $0.01-0.05

### Anthropic Claude 3.5 Sonnet
- 入力: $3.00 / 1M tokens
- 出力: $15.00 / 1M tokens
- 1回の相談: 約 $0.015-0.06

**推奨:** 開発中はモックモードを使用し、実際のAPIテストは必要最小限に抑えることをお勧めします。
