# LINE Webhook トラブルシューティング

## ✅ LINE Developers Console 確認項目

### 1. Messaging API 設定
- [ ] **Use webhook**: ON
- [ ] **Webhook URL**: https://8725b744.webapp-9y0.pages.dev/api/line/webhook
- [ ] **Verify**ボタンで成功（緑のチェックマーク）

### 2. Response settings（応答設定）
- [ ] **Greeting messages**: **Disabled** ⚠️重要
- [ ] **Auto-reply messages**: **Disabled** ⚠️重要  
- [ ] **Webhooks**: **Enabled**

### 3. Channel settings
- [ ] **Allow bot to join group chats**: 任意
- [ ] **Use webhooks**: ON

---

## 🔧 解決手順

### ステップ1: 自動応答を無効化

1. LINE Developers Console → Messaging API
2. **Response settings**セクションを探す
3. **Auto-reply messages**を**Disabled**に設定
4. **Greeting messages**を**Disabled**に設定

### ステップ2: Webhook URLを再設定

1. Webhook URLを削除
2. 再度入力: `https://8725b744.webapp-9y0.pages.dev/api/line/webhook`
3. **Verify**をクリック
4. 成功を確認

### ステップ3: LINEアプリで再テスト

1. LINE公式アカウントのトーク画面を開く
2. 「UNI-001」を送信
3. 数秒待つ

---

## 📸 スクリーンショットのお願い

以下の画面のスクリーンショットを共有していただけますか？

1. **Webhook設定画面**（Webhook URL、Use webhook、Verify結果）
2. **Response settings画面**（自動応答の設定状態）

これで問題を特定できます。
