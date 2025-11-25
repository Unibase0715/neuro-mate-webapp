# Neuro mate - 脳活AIヘルスアドバイザー

「脳活labo Unibase」のためのAIヘルスアドバイザーWebアプリケーション

## 🎯 プロジェクト概要

**Neuro mate**は、ユーザーの症状・生活習慣・美容・パフォーマンス・メンタル状態を総合的に分析し、最適なサプリメントとセルフケアを提案するAIヘルスアドバイザーです。

### 主な機能

- 🎯 **無料診断**: 選択式の簡易診断でサプリとセルフケアを提案
- 💬 **AI詳細相談**: テキストで詳しく相談し、AIが総合レポートを生成（ベーシックプラン）
- 📊 **パーソナルコーチング**: 日々の状態を記録し、パーソナライズされたメニューを自動生成（プレミアムプラン）
- 🔐 **認証システム**: JWT認証による安全なユーザー管理
- 💾 **データ永続化**: Cloudflare D1を使用したデータベース管理

## 🌐 公開URL

- **開発環境**: https://3000-ioaiupa7405j1zb7bvv74-b237eb32.sandbox.novita.ai
- **本番環境**: デプロイ後に追加予定

## 🏗️ 技術スタック

### バックエンド
- **フレームワーク**: Hono v4
- **ランタイム**: Cloudflare Workers/Pages
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: JWT (jose)
- **パスワードハッシュ**: Web Crypto API (PBKDF2)

### フロントエンド
- **テンプレートエンジン**: Hono JSX
- **スタイリング**: カスタムCSS（レスポンシブデザイン）
- **JavaScript**: Vanilla JS（認証、API通信）

### デザイン
- **ブランドカラー**: #434342（ダークグレー）
- **アクセントカラー**: #c9b882（ゴールド）
- **ロゴ**: 脳活labo Unibase公式ロゴ使用
- **テーマ**: ダークモード、高級感のあるデザイン

### 開発ツール
- **ビルドツール**: Vite
- **デプロイツール**: Wrangler
- **プロセス管理**: PM2

## 📂 プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx              # メインアプリケーション
│   ├── renderer.tsx           # HTMLレンダラー
│   ├── routes/
│   │   ├── auth.ts           # 認証API
│   │   ├── diagnosis.ts      # 診断API
│   │   ├── ai.ts             # AI相談・コーチングAPI
│   │   └── pages.ts          # フロントエンドページルート
│   ├── middleware/
│   │   └── auth.ts           # 認証ミドルウェア
│   ├── lib/
│   │   ├── jwt.ts            # JWT処理
│   │   ├── password.ts       # パスワードハッシュ
│   │   ├── diagnosis.ts      # 診断ロジック
│   │   └── ai.ts             # AI統合
│   └── types/
│       └── index.ts          # TypeScript型定義
├── public/
│   └── static/
│       ├── app.js            # フロントエンドJS
│       ├── diagnosis.js      # 診断ウィザードJS
│       └── styles.css        # スタイルシート
├── migrations/
│   └── 0001_initial_schema.sql  # データベーススキーマ
├── .dev.vars                 # 開発環境変数
├── wrangler.toml             # Cloudflare設定
├── package.json              # 依存関係
└── ecosystem.config.cjs      # PM2設定
```

## 🗄️ データベース設計

### テーブル一覧

1. **users**: ユーザー情報
   - email, password_hash, plan (free/basic/premium)

2. **diagnosis_results**: 診断結果
   - user_id, answers_json, result_json

3. **ai_reports**: AI相談レポート
   - user_id, input_text, report_json

4. **coach_logs**: コーチングログ（プレミアムプラン）
   - user_id, log_date, sleep_hours, fatigue_level, mood_level, pain_level

5. **subscriptions**: サブスクリプション管理
   - user_id, plan, status, stripe_customer_id

6. **consultation_usage**: 相談回数制限管理
   - user_id, month, count

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
cd /home/user/webapp
npm install
```

### 2. 環境変数の設定

`.dev.vars`ファイルを編集：

```bash
JWT_SECRET=your-secret-key-here
AI_API_KEY=your-ai-api-key
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4
```

### 3. データベースのマイグレーション

```bash
# ローカル開発環境
npm run db:migrate:local

# 本番環境（要：Cloudflare D1作成）
npm run db:migrate:prod
```

### 4. ビルド

```bash
npm run build
```

### 5. 開発サーバー起動

```bash
# ポートクリーンアップ
npm run clean-port

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs neuro-mate --nostream
```

### 6. 動作確認

```bash
# トップページ
curl http://localhost:3000/

# 診断API
curl -X POST http://localhost:3000/api/diagnosis/run \
  -H "Content-Type: application/json" \
  -d '{"ageGroup":"30代","gender":"男性","mainConcerns":["脳疲労"],...}'

# サインアップ
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📋 API エンドポイント

### 認証 (`/api/auth`)
- `POST /signup` - 新規登録
- `POST /login` - ログイン
- `GET /me` - 現在のユーザー情報取得
- `POST /logout` - ログアウト

### 診断 (`/api/diagnosis`)
- `POST /run` - 診断実行
- `GET /history` - 診断履歴取得（要認証）

### AI相談 (`/api/ai`)
- `POST /consult` - AI相談（ベーシック/プレミアム）
- `GET /consult/history` - 相談履歴取得
- `POST /coach/log` - 日次ログ保存（プレミアム）
- `GET /coach/log` - ログ取得
- `POST /coach/plan` - 今日のメニュー生成（プレミアム）

## 💰 プラン構成

### 無料プラン
- 選択式の簡易診断
- サプリとセルフケアの提案
- 会員登録任意

### ベーシックプラン（¥1,580/月）
- 無料プランの全機能
- テキストでの詳細AI相談
- 月3回まで相談可能

### プレミアムプラン（¥3,980/月）
- ベーシックプランの全機能
- 日々の状態ログ記録
- 毎日のメニュー自動生成
- 相談回数無制限

## 🎨 主な画面

1. **トップページ** (`/`): サービス紹介とプラン一覧
2. **診断ページ** (`/diagnosis`): 6ステップの診断ウィザード
3. **ログイン** (`/login`): メール・パスワード認証
4. **サインアップ** (`/signup`): 新規ユーザー登録
5. **ダッシュボード** (`/dashboard`): マイページ
6. **AI相談** (`/ai/consult`): テキスト相談フォーム
7. **コーチング** (`/ai/coach`): 日次ログと毎日のメニュー

## 🧪 テスト済み機能

✅ ユーザー登録・ログイン認証  
✅ 無料診断（スコアリングとサプリ提案）  
✅ 診断結果の保存（ログインユーザー）  
✅ AI相談レポート生成（モック）  
✅ コーチングログ保存  
✅ プラン別アクセス制御  
✅ レスポンシブデザイン  

## 🔮 未実装機能

- ⏳ 実際のAI API統合（OpenAI/Anthropic）
- ⏳ Stripe決済連携
- ⏳ メール通知機能
- ⏳ プラン変更機能
- ⏳ パスワードリセット
- ⏳ プロフィール編集
- ⏳ ECサイト連携（サプリ購入）

## 🚀 デプロイ手順（Cloudflare Pages）

### 1. D1データベースの作成

```bash
wrangler d1 create webapp-production
# database_idをwrangler.tomlに設定
```

### 2. Cloudflare Pagesプロジェクト作成

```bash
wrangler pages project create webapp --production-branch main
```

### 3. 環境変数の設定

```bash
wrangler pages secret put JWT_SECRET --project-name webapp
wrangler pages secret put AI_API_KEY --project-name webapp
```

### 4. デプロイ

```bash
npm run deploy
```

## 📝 開発メモ

### パスワードハッシュについて
- Cloudflare Workers環境ではNode.jsの`crypto`モジュールが使えないため、Web Crypto APIを使用
- PBKDF2アルゴリズムで100,000回のイテレーション
- salt + key をbase64エンコードして保存

### AIモックについて
- 開発環境では`AI_API_KEY=mock-api-key`で固定のモックレスポンスを返す
- 本番環境ではOpenAI APIなどの実際のAIサービスと連携

### データベース
- ローカル開発では`.wrangler/state/v3/d1`にSQLiteファイルが生成される
- `--local`フラグで自動的にローカルDBを使用

## 🛠️ トラブルシューティング

### ポート3000が使用中
```bash
npm run clean-port
# または
fuser -k 3000/tcp
```

### ビルドエラー
```bash
# node_modulesとdistを削除して再インストール
rm -rf node_modules dist
npm install
npm run build
```

### データベースリセット
```bash
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

## 📄 ライセンス

© 2025 脳活labo Unibase - Neuro mate. All rights reserved.

## 👥 開発者向け情報

### 推奨開発環境
- Node.js 18以上
- npm 8以上
- PM2（プロセス管理）

### コーディング規約
- TypeScript strictモード
- ESLintルールに準拠
- コミットメッセージは日本語または英語

### サプリスコアリングロジック

各サプリメントのスコア計算は`src/lib/diagnosis.ts`で実装：

- **マグネシウム**: 慢性コリ(×2), 睡眠(×1.5), ストレス(×1.5)
- **サイトカイン**: 美容(×2-2.5), 疲労回復(×2), コリ(×1.5)
- **5-ALA**: 集中力(×3), 疲労感(×2), 運動量(×1.5)
- **BHB**: 集中力(×2.5), 疲労感(×2), 気分ムラ(×1.5)
- **マルチビタミン**: 食事(×2), 運動(×1.5), 美容(×1.5)

## 📞 サポート

質問や問題がある場合は、プロジェクトのIssueを作成してください。
