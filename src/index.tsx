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
          <p style="color: var(--text-secondary);">慢性コリ・痛み、脳疲労、睡眠、美容、パフォーマンス、メンタルなどの観点から分析します。</p>
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
          <p style="color: var(--text-secondary);">会員登録するだけで、AIがあなたの状態を詳しく分析し、パーソナライズされたアドバイスを提供。</p>
        </div>
      </div>

      {/* Registration CTA */}
      <div style="margin-bottom: 4rem;">
        <div class="card" style="border: 2px solid var(--primary-color); background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 184, 130, 0.1) 100%); text-align: center; padding: 3rem;">
          <h2 style="font-size: 2rem; margin-bottom: 1rem; color: var(--text-primary);">
            ✨ 今すぐ無料で始める
          </h2>
          <p style="font-size: 1.125rem; color: var(--text-secondary); margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
            会員登録するだけで、すべての機能を無料でご利用いただけます。<br />
            AI相談、パーソナルコーチング、回数制限なし。
          </p>
          <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--text-primary); margin-bottom: 1rem;">✓ すべての機能が使い放題</h3>
            <ul style="display: inline-block; text-align: left; color: var(--text-secondary); line-height: 2;">
              <li>✓ 無制限のAI相談</li>
              <li>✓ パーソナルコーチング</li>
              <li>✓ 日々の状態ログ記録</li>
              <li>✓ 毎日のメニュー自動生成</li>
              <li>✓ サプリ＆セルフケア提案</li>
            </ul>
          </div>
          <a href="/signup" class="btn btn-primary btn-lg">
            今すぐ無料登録
          </a>
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
              <h2 style="color: var(--text-primary);">ようこそ、Neuro mateへ！</h2>
              <p class="mt-4" style="color: var(--text-secondary);">メールアドレス: \${currentUser.email}</p>
              <p style="color: var(--text-secondary); margin-top: 0.5rem;">すべての機能を無料でご利用いただけます 🎉</p>
            </div>
            
            <div class="grid grid-2 mt-6">
              <a href="/diagnosis" class="card" style="text-decoration: none; color: inherit; border: 2px solid var(--primary-color);">
                <h3 style="color: var(--primary-color);">🎯 無料診断</h3>
                <p style="color: var(--text-secondary);">簡易診断であなたに合ったサプリとセルフケアを見つける</p>
              </a>
              
              <a href="/ai/consult" class="card" style="text-decoration: none; color: inherit; border: 2px solid var(--primary-color);">
                <h3 style="color: var(--primary-color);">💬 AI相談（無制限）</h3>
                <p style="color: var(--text-secondary);">詳しい状況をテキストで相談し、AIからアドバイスを受ける</p>
              </a>
              
              <a href="/ai/coach" class="card" style="text-decoration: none; color: inherit; border: 2px solid var(--primary-color);">
                <h3 style="color: var(--primary-color);">📊 パーソナルコーチング</h3>
                <p style="color: var(--text-secondary);">毎日の状態を記録して、パーソナライズされたメニューを取得</p>
              </a>
            </div>
          \`;
        });
      `}</script>
    </div>
  )
})

export default app
