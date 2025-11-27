# Neuro mate - 脳活AIヘルスアドバイザー

「脳活labo Unibase」のためのAIヘルスアドバイザーWebアプリケーション

## 🎯 プロジェクト概要

**Neuro mate**は、脳活labo Unibaseの実店舗会員専用AIヘルスアドバイザーです。会員IDで認証し、AI相談を通じて最適なサプリメントとセルフケアの提案を受けられます。

### 主な機能

- 🆔 **会員ID認証**: Googleスプレッドシートによる会員管理（例：UNI-001）
- 💬 **AI健康相談**: 文章形式で自由に相談内容を入力
  - ✨ **OpenAI GPT-4o** または **Anthropic Claude 3.5 Sonnet** 統合済み
  - お悩み・生活習慣・追加情報を詳しく分析
- 📊 **総合分析レポート**: AIが分析結果を生成
  - サプリメント提案（スコア付き）
  - セルフケアメニュー
  - 総合アドバイス
- 🔄 **思考中ログ**: AIが分析している過程をリアルタイム表示
- 📝 **相談履歴の自動保存**: Googleスプレッドシートに記録
- 🏪 **実店舗会員専用**: 脳活labo Unibase実店舗会員向けサービス

## 🌐 公開URL

- **開発環境**: https://3000-ioaiupa7405j1zb7bvv74-b237eb32.sandbox.novita.ai
- **本番環境**: デプロイ後に追加予定

## 📱 ページ構成

### 1. トップページ (`/`)
- 会員ID入力フォーム（例：UNI-001）
- 脳活labo Unibaseのブランディング
- 会員認証システム

### 2. 相談ページ (`/consult`)
- 質問1: どういったお悩みでお困りですか？
- 質問2: 普段の生活について教えてください
- 質問3: その他、伝えておきたいこと（任意）
- 文章形式の自由入力フォーム

### 3. 結果ページ (`/result`)
- 思考中アニメーション＋リアルタイムログ表示
- AI分析結果の表示
  - 総合分析サマリー
  - おすすめサプリメント（スコア付き）
  - セルフケアメニュー
- 相談履歴の自動保存確認

## 🏗️ 技術スタック

### バックエンド
- **フレームワーク**: Hono v4
- **ランタイム**: Cloudflare Workers/Pages
- **会員管理**: Google Sheets API（会員リスト・相談履歴）
- **AI統合**: OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet

### フロントエンド
- **テンプレートエンジン**: Hono JSX
- **スタイリング**: カスタムCSS（洗練されたダークテーマ）
- **JavaScript**: Vanilla JS（ページ遷移、API通信、アニメーション）
- **UX**: 3ページ構成のシンプルなフロー

### デザイン
- **ブランドカラー**: #434342（ダークグレー）
- **アクセントカラー**: #c9b882（ゴールド）
- **ロゴ**: 脳活labo Unibase公式ロゴ使用
- **テーマ**: ダークモード、高級感のあるデザイン、フェードインアニメーション

### 開発ツール
- **ビルドツール**: Vite
- **デプロイツール**: Wrangler
- **プロセス管理**: PM2

## 📂 プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx              # メインアプリケーション（3ページ統合）
│   ├── renderer.tsx           # HTMLレンダラー
│   ├── routes/
│   │   ├── chat.ts           # 会員ID認証・AI相談API
│   │   └── pages.ts          # フロントエンドページルート
│   ├── lib/
│   │   ├── sheets.ts         # Google Sheets API連携
│   │   └── ai.ts             # AI統合（OpenAI/Anthropic）
│   └── types/
│       └── index.ts          # TypeScript型定義
├── public/
│   └── static/
│       ├── styles.css        # スタイルシート
│       └── unibase-logo.png  # ロゴ画像
├── .dev.vars                 # 開発環境変数
├── wrangler.jsonc            # Cloudflare設定
├── package.json              # 依存関係
└── ecosystem.config.cjs      # PM2設定
```

## 📊 Googleスプレッドシート連携

### スプレッドシート構成

**URL**: https://docs.google.com/spreadsheets/d/1sXkkcOQ4iKLkemKCriLELZsms5d0jSoZ-17LimuyC_E/edit

#### シート1: 会員リスト
| 列 | 項目 | 説明 |
|----|------|------|
| C | member_id | 会員ID（例：UNI-001） |
| D | name | 会員名 |
| E | status | ステータス（active/inactive） |
| F | memo | 備考 |

#### 相談履歴シート
| 列 | 項目 | 説明 |
|----|------|------|
| A | timestamp | 相談日時 |
| B | member_id | 会員ID |
| C | member_name | 会員名 |
| D | consultation_type | 相談種別 |
| E | content | 相談内容 |
| F | ai_response | AI応答 |

### 会員管理フロー

1. **会員登録**: スタッフがスプレッドシートに会員情報を追加
2. **会員認証**: ユーザーが会員IDを入力してログイン
3. **退会処理**: スタッフがstatusを`inactive`に変更
4. **相談履歴**: AI相談の内容と結果が自動保存

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
cd /home/user/webapp
npm install
```

### 2. 環境変数の設定

`.dev.vars`ファイルを作成・編集：

```bash
# Google Sheets API
GOOGLE_API_KEY=AIzaSyCage46YisHNIR_j5I6nwyzgZK0KZrjl5U

# AI Provider (openai または anthropic または mock)
AI_PROVIDER=mock

# OpenAI Configuration (AI_PROVIDER=openaiの場合)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o

# Anthropic Configuration (AI_PROVIDER=anthropicの場合)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**環境変数の説明:**

| 変数名 | 必須/オプション | 説明 |
|--------|----------------|------|
| `GOOGLE_API_KEY` | **必須** | Google Sheets APIキー（会員管理用） |
| `AI_PROVIDER` | **必須** | 使用するAIプロバイダー (`openai` / `anthropic` / `mock`) |
| `OPENAI_API_KEY` | OpenAI使用時必須 | OpenAIのAPIキー (https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | OpenAI使用時必須 | 使用するOpenAIモデル (推奨: `gpt-4o`) |
| `ANTHROPIC_API_KEY` | Anthropic使用時必須 | AnthropicのAPIキー (https://console.anthropic.com/settings/keys) |
| `ANTHROPIC_MODEL` | Anthropic使用時必須 | 使用するAnthropicモデル (推奨: `claude-3-5-sonnet-20241022`) |

**APIキーの取得方法:**
1. **OpenAI**: 
   - https://platform.openai.com/api-keys にアクセス
   - 「Create new secret key」をクリックしてAPIキーを生成
   - 生成されたAPIキーをコピーして `.dev.vars` に設定

2. **Anthropic**: 
   - https://console.anthropic.com/settings/keys にアクセス
   - 「Create Key」をクリックしてAPIキーを生成
   - 生成されたAPIキーをコピーして `.dev.vars` に設定

**プロバイダーの選択:**
- `AI_PROVIDER=openai` - OpenAI GPT-4oを使用（高速・コスト効率良好）
- `AI_PROVIDER=anthropic` - Anthropic Claude 3.5 Sonnetを使用（長文理解・論理推論に強い）
- `AI_PROVIDER=mock` - モックレスポンス使用（開発・テスト用）

### 3. Googleスプレッドシートの準備

1. **共有設定**: スプレッドシートを「リンクを知る全員が閲覧可能」に設定
2. **相談履歴シート作成**: 新しいシートを追加し、名前を「相談履歴」に設定
3. **ヘッダー設定**: A1～F1に以下を入力
   - `timestamp`, `member_id`, `member_name`, `consultation_type`, `content`, `ai_response`

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

### 会員認証 (`/api/chat`)
- `POST /verify` - 会員ID検証
  - リクエスト: `{ "member_id": "UNI-001" }`
  - レスポンス: `{ "success": true, "member": { "member_id": "UNI-001", "name": "高見拓人" } }`

### AI相談 (`/api/chat`)
- `POST /consult` - AI健康相談
  - リクエスト: `{ "member_id", "member_name", "currentConcerns", "lifestyleRhythm", "additionalNotes" }`
  - レスポンス: `{ "success": true, "report": { "summary", "supplements", "selfCare" } }`
  - 相談内容は自動的にGoogleスプレッドシートに保存

## 🏪 サービス形態

### 実店舗会員専用サービス
**脳活labo Unibase の実店舗会員の方専用のWebサービスです。**

会員ID認証後、以下の機能をご利用いただけます：

- ✅ **会員ID認証システム**（Googleスプレッドシート連携）
- ✅ **AI健康相談**（無制限）
- ✅ **文章形式の自由入力フォーム**
- ✅ **思考中ログのリアルタイム表示**
- ✅ **総合分析レポート**（サプリ・セルフケア提案）
- ✅ **相談履歴の自動保存**（Googleスプレッドシート）

**対象:** 脳活labo Unibase 実店舗会員  
**認証:** 会員ID（例：UNI-001）  
**利用制限:** なし

## 🎨 ユーザーフロー

### 基本フロー
```
トップページ（会員ID入力）
    ↓
会員認証（Googleスプレッドシート照会）
    ↓
相談ページ（3つの質問に文章で回答）
    ↓
結果ページ（思考中ログ → AI分析結果表示）
    ↓
相談履歴自動保存（Googleスプレッドシート）
```

### 退会処理
- スタッフがGoogleスプレッドシートのstatusを`inactive`に変更
- 次回ログイン時から利用不可

## 🧪 実装済み機能

✅ **会員ID認証システム**（Googleスプレッドシート連携）  
✅ **3ページ構成のUI**（トップ → 相談 → 結果）  
✅ **文章形式の自由入力フォーム**  
✅ **思考中アニメーション＋リアルタイムログ**  
✅ **AI相談レポート生成**（OpenAI/Anthropic/Mock）  
✅ **サプリメント提案**（スコアリング機能付き）  
✅ **セルフケアメニュー提案**  
✅ **相談履歴の自動保存**（Googleスプレッドシート）  
✅ **洗練されたダークテーマデザイン**  
✅ **フェードインアニメーション**  
✅ **レスポンシブデザイン**

## 🔮 今後の拡張可能性

- ⏳ メール通知機能
- ⏳ 相談履歴の閲覧機能
- ⏳ サプリメント在庫連携
- ⏳ ECサイト連携（サプリ購入）
- ⏳ 定期相談リマインダー

## 🚀 デプロイ手順（Cloudflare Pages）

### 事前準備

1. **Cloudflare API Key設定**: Deploy タブで API キーを設定
2. **Google Sheets準備**: 共有設定と相談履歴シートの作成を完了

### 1. Cloudflare Pagesプロジェクト作成

```bash
wrangler pages project create webapp --production-branch main
```

### 2. 環境変数の設定（本番環境）

Cloudflare Pagesに環境変数（シークレット）を設定します：

```bash
# 1. Google Sheets API Key
wrangler pages secret put GOOGLE_API_KEY --project-name webapp

# 2. AI Provider（openai / anthropic / mock）
wrangler pages secret put AI_PROVIDER --project-name webapp

# 3. OpenAI設定（OpenAIを使用する場合）
wrangler pages secret put OPENAI_API_KEY --project-name webapp
wrangler pages secret put OPENAI_MODEL --project-name webapp

# 4. Anthropic設定（Anthropicを使用する場合）
wrangler pages secret put ANTHROPIC_API_KEY --project-name webapp
wrangler pages secret put ANTHROPIC_MODEL --project-name webapp
```

**シークレット設定時の入力例:**
```bash
$ wrangler pages secret put OPENAI_API_KEY --project-name webapp
? Enter a secret value: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✨ Success! Uploaded secret OPENAI_API_KEY

$ wrangler pages secret put OPENAI_MODEL --project-name webapp
? Enter a secret value: gpt-4o
✨ Success! Uploaded secret OPENAI_MODEL

# GPT-5やその他のモデルへの切り替えも同じ手順で可能
# 例: GPT-5がリリースされた場合
$ wrangler pages secret put OPENAI_MODEL --project-name webapp
? Enter a secret value: gpt-5
✨ Success! Uploaded secret OPENAI_MODEL
```

**対応モデル:** `gpt-4o`, `gpt-4o-mini`, `gpt-5` (リリース後), `o1`, `o1-mini`

**設定確認:**
```bash
# 設定済みシークレットの一覧表示（値は表示されません）
wrangler pages secret list --project-name webapp
```

### 4. デプロイ

```bash
npm run deploy
```

## 📝 開発メモ

### Google Sheets API連携について
- Fetch APIで直接Google Sheets APIを呼び出し
- `googleapis`パッケージは不使用（Cloudflare Workers非対応のため）
- 会員リストの照会と相談履歴の保存を実装
- スプレッドシートの共有設定が必要

### 会員管理フロー
1. 店舗スタッフがスプレッドシートに会員情報を追加
2. ユーザーが会員IDで認証
3. status=activeの会員のみアクセス可能
4. 退会時はstatusをinactiveに変更

### AI統合について

**統合済みAI API:**
- ✅ **OpenAI GPT-4o** (`gpt-4o`, `gpt-4o-mini`)
- ✅ **OpenAI GPT-5** - リリース時に環境変数変更のみで対応可能
- ✅ **OpenAI o1/o1-mini** - 推論特化モデル
- ✅ **Anthropic Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`)
- ✅ **将来の新モデル** - 環境変数変更のみで自動対応

**機能:**
- `AI_PROVIDER`環境変数で使用するプロバイダーを選択可能
- `OPENAI_MODEL`/`ANTHROPIC_MODEL`で使用するモデルを指定
- **コード変更不要でモデル切り替え可能** - 環境変数のみで対応
- **AI相談レポート生成**: ユーザーの悩みを分析し、サプリ・セルフケア・生活習慣改善を総合的に提案
- **AIコーチングプラン生成**: 7日間の状態ログを分析し、今日のセルフケアメニューを提案
- APIエラー時は自動的にモックレスポンスにフォールバック（開発・デバッグ用）
- 各プロバイダーの公式SDKを使用（`openai`, `@anthropic-ai/sdk`）

**APIキーの取得方法:**
- **OpenAI**: https://platform.openai.com/api-keys でAPIキーを作成
- **Anthropic**: https://console.anthropic.com/settings/keys でAPIキーを作成

**推奨モデル:**
- OpenAI: `gpt-4o` (高速・高品質・コスト効率良好)
- OpenAI: `gpt-5` (GPT-5リリース後、最高品質)
- Anthropic: `claude-3-5-sonnet-20241022` (長文理解・論理推論に強い)

**モデル切り替え例:**
```bash
# GPT-4oからGPT-5への切り替え（GPT-5リリース後）
# 1. 環境変数を変更
OPENAI_MODEL=gpt-5

# 2. サーバー再起動（開発環境）
pm2 restart neuro-mate

# 3. 本番環境
wrangler pages secret put OPENAI_MODEL --project-name webapp
# 入力: gpt-5
npm run deploy
```

### UI/UXデザイン
- 3ページ構成のシンプルなフロー
- 文章形式の自由入力フォーム
- 思考中ログのリアルタイム表示
- フェードインアニメーション
- ダークテーマの洗練されたデザイン

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

### Google Sheets API エラー
- スプレッドシートの共有設定を確認（リンクを知る全員が閲覧可能）
- Google API Keyの権限を確認
- スプレッドシートIDが正しいか確認

### 会員IDが認証できない
- スプレッドシートの会員リストを確認
- member_idの列（C列）を確認
- statusがactiveになっているか確認

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

### テスト用会員ID

開発・テスト用に以下の会員IDが使用可能：

- **UNI-001**: 高見拓人（status: active）
- **UNI-002**: 佐藤花子（status: active）
- その他、スプレッドシートに登録された会員ID

## 📞 サポート

質問や問題がある場合は、プロジェクトのIssueを作成してください。
