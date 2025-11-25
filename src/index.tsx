import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import type { Bindings } from './types'

// Import routes
import auth from './routes/auth'
import diagnosis from './routes/diagnosis'
import ai from './routes/ai'
import pages from './routes/pages'

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('/api/*', cors())
app.use('*', logger())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/auth', auth)
app.route('/api/diagnosis', diagnosis)
app.route('/api/ai', ai)

// Page routes (before renderer)
app.route('', pages)

// Frontend routes
app.use(renderer)

// Home page
app.get('/', (c) => {
  return c.render(
    <div class="container" style="padding-top: 3rem; padding-bottom: 3rem;">
      {/* Hero section */}
      <div style="text-align: center; margin-bottom: 4rem;">
        <div style="margin-bottom: 1.5rem;">
          <img src="/static/unibase-logo.png" alt="脳活labo Unibase" style="height: 80px; margin-bottom: 1rem;" />
        </div>
        <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: var(--text-primary); text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          脳活AIヘルスアドバイザー<br />Neuro mate
        </h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 2rem; max-width: 700px; margin-left: auto; margin-right: auto;">
          あなたの症状・生活習慣から、最適なサプリとセルフケアを提案します
        </p>
        <a href="/diagnosis" class="btn btn-primary btn-lg">
          無料で脳活診断をはじめる
        </a>
      </div>

      {/* Features */}
      <div class="grid grid-2" style="margin-bottom: 4rem;">
        <div class="card">
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">🎯 総合的な分析</h3>
          <p style="color: var(--text-secondary);">慢性コリ・痛み、脳疲労、睡眠、美容、パフォーマンス、メンタルの観点から総合的に分析します。</p>
        </div>
        <div class="card">
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">💊 最適なサプリ提案</h3>
          <p style="color: var(--text-secondary);">様々なサプリの中から、あなたに最適なものを提案します。</p>
        </div>
        <div class="card">
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">🧘 セルフケア指導</h3>
          <p style="color: var(--text-secondary);">脳トレ、呼吸法、ストレッチなど、今日から始められるセルフケアメニューをご提案。</p>
        </div>
        <div class="card">
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">📊 AI パーソナル分析</h3>
          <p style="color: var(--text-secondary);">有料プランでは、AIがあなたの状態を詳しく分析し、パーソナライズされたアドバイスを提供。</p>
        </div>
      </div>

      {/* Plans */}
      <div style="margin-bottom: 4rem;">
        <h2 style="text-align: center; font-size: 2rem; margin-bottom: 2rem; color: var(--text-primary);">プラン一覧</h2>
        <div class="grid grid-2">
          <div class="card" style="border: 1px solid var(--border-color);">
            <div class="badge badge-success" style="margin-bottom: 1rem;">無料プラン</div>
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">基本診断</h3>
            <ul style="margin-bottom: 1.5rem; line-height: 1.8; color: var(--text-secondary);">
              <li>✓ 選択式の簡易診断</li>
              <li>✓ サプリとセルフケアの提案</li>
              <li>✓ 結果の表示（ログイン不要）</li>
            </ul>
            <p style="font-size: 2rem; font-weight: bold; color: var(--text-primary);">無料</p>
          </div>
          
          <div class="card" style="border: 2px solid var(--primary-color); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 184, 130, 0.1) 100%);">
            <div class="badge" style="margin-bottom: 1rem; background: var(--primary-color); color: var(--bg-primary);">おすすめ</div>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary); font-size: 1.5rem;">ベーシックプラン</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">AI詳細分析</p>
            <ul style="margin-bottom: 1.5rem; line-height: 1.8; color: var(--text-secondary);">
              <li>✓ 無料プランの全機能</li>
              <li>✓ テキストでの詳細相談</li>
              <li>✓ AIによる総合レポート</li>
              <li>✓ 月3回まで相談可能</li>
            </ul>
            <p style="font-size: 2.5rem; font-weight: bold; color: var(--text-primary);">¥1,580<span style="font-size: 1rem; font-weight: normal; color: var(--text-secondary);">/月</span></p>
          </div>
          
          <div class="card" style="border: 2px solid var(--secondary-color); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(139, 115, 85, 0.1) 100%);">
            <div class="badge" style="margin-bottom: 1rem; background: var(--secondary-color); color: var(--text-primary);">プレミアム</div>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary); font-size: 1.5rem;">プレミアムプラン</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">パーソナルコーチング</p>
            <ul style="margin-bottom: 1.5rem; line-height: 1.8; color: var(--text-secondary);">
              <li>✓ ベーシックプランの全機能</li>
              <li>✓ 日々の状態ログ記録</li>
              <li>✓ 毎日のメニュー自動生成</li>
              <li>✓ 週次フィードバック</li>
              <li>✓ 相談回数無制限</li>
            </ul>
            <p style="font-size: 2.5rem; font-weight: bold; color: var(--text-primary);">¥3,980<span style="font-size: 1rem; font-weight: normal; color: var(--text-secondary);">/月</span></p>
          </div>
        </div>
      </div>
    </div>
  )
})

// Signup page
app.get('/signup', (c) => {
  return c.render(
    <div class="container-sm" style="padding-top: 3rem;">
      <div class="card">
        <h2 class="card-header text-center">新規登録</h2>
        <form id="signup-form" onsubmit="handleSignup(event)">
          <div class="form-group">
            <label class="form-label">メールアドレス</label>
            <input type="email" class="form-input" name="email" required />
          </div>
          <div class="form-group">
            <label class="form-label">パスワード（8文字以上）</label>
            <input type="password" class="form-input" name="password" required minlength="8" />
          </div>
          <div id="signup-error"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">登録する</button>
        </form>
        <p class="text-center mt-4">
          すでにアカウントをお持ちの方は<a href="/login" style="color: var(--primary-color); text-decoration: underline;">ログイン</a>
        </p>
      </div>
      
      <script>{`
        async function handleSignup(event) {
          event.preventDefault();
          const form = event.target;
          const email = form.email.value;
          const password = form.password.value;
          const errorDiv = document.getElementById('signup-error');
          
          const result = await signup(email, password);
          
          if (result.success) {
            window.location.href = '/dashboard';
          } else {
            errorDiv.innerHTML = '<div class="error">' + result.error + '</div>';
          }
        }
      `}</script>
    </div>
  )
})

// Login page
app.get('/login', (c) => {
  return c.render(
    <div class="container-sm" style="padding-top: 3rem;">
      <div class="card">
        <h2 class="card-header text-center">ログイン</h2>
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">メールアドレス</label>
            <input type="email" class="form-input" name="email" required />
          </div>
          <div class="form-group">
            <label class="form-label">パスワード</label>
            <input type="password" class="form-input" name="password" required />
          </div>
          <div id="login-error"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">ログイン</button>
        </form>
        <p class="text-center mt-4">
          アカウントをお持ちでない方は<a href="/signup" style="color: var(--primary-color); text-decoration: underline;">新規登録</a>
        </p>
      </div>
      
      <script>{`
        async function handleLogin(event) {
          event.preventDefault();
          const form = event.target;
          const email = form.email.value;
          const password = form.password.value;
          const errorDiv = document.getElementById('login-error');
          
          const result = await login(email, password);
          
          if (result.success) {
            window.location.href = '/dashboard';
          } else {
            errorDiv.innerHTML = '<div class="error">' + result.error + '</div>';
          }
        }
      `}</script>
    </div>
  )
})

// Dashboard page
app.get('/dashboard', (c) => {
  return c.render(
    <div class="container" style="padding-top: 3rem;">
      <h1 style="margin-bottom: 2rem;">マイページ</h1>
      
      <div id="dashboard-content">
        <div class="loading">読み込み中...</div>
      </div>
      
      <script>{`
        document.addEventListener('DOMContentLoaded', async () => {
          if (!authToken) {
            window.location.href = '/login';
            return;
          }
          
          await checkAuth();
          
          if (!currentUser) {
            window.location.href = '/login';
            return;
          }
          
          const content = document.getElementById('dashboard-content');
          
          content.innerHTML = \`
            <div class="card">
              <h2>プラン: <span class="badge">\${currentUser.plan}</span></h2>
              <p class="mt-4">メールアドレス: \${currentUser.email}</p>
            </div>
            
            <div class="grid grid-2 mt-6">
              <a href="/diagnosis" class="card" style="text-decoration: none; color: inherit;">
                <h3 style="color: #6366f1;">🎯 無料診断</h3>
                <p>簡易診断であなたに合ったサプリとセルフケアを見つける</p>
              </a>
              
              \${currentUser.plan === 'basic' || currentUser.plan === 'premium' ? \`
                <a href="/ai/consult" class="card" style="text-decoration: none; color: inherit;">
                  <h3 style="color: #6366f1;">💬 AI相談</h3>
                  <p>詳しい状況をテキストで相談し、AIからアドバイスを受ける</p>
                </a>
              \` : ''}
              
              \${currentUser.plan === 'premium' ? \`
                <a href="/ai/coach" class="card" style="text-decoration: none; color: inherit;">
                  <h3 style="color: #8b5cf6;">📊 コーチング</h3>
                  <p>毎日の状態を記録して、パーソナライズされたメニューを取得</p>
                </a>
              \` : ''}
            </div>
            
            \${currentUser.plan === 'free' ? \`
              <div class="card mt-6" style="background: #eff6ff; border: 2px solid #6366f1;">
                <h3 style="color: #6366f1;">プランをアップグレード</h3>
                <p>ベーシックプラン以上で、AIによる詳細な分析とアドバイスを受けられます。</p>
                <button class="btn btn-primary mt-4">アップグレードする（準備中）</button>
              </div>
            \` : ''}
          \`;
        });
      `}</script>
    </div>
  )
})

export default app
