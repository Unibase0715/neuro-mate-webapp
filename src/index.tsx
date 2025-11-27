import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import type { Bindings } from './types'

// Import routes
import chat from './routes/chat'
import pages from './routes/pages'

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('/api/*', cors())
app.use('*', logger())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/chat', chat)

// Page routes (before renderer)
app.route('', pages)

// Frontend routes
app.use(renderer)

// Home page - Member ID Entry
app.get('/', (c) => {
  return c.render(
    <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div style="max-width: 500px; width: 100%; text-align: center;">
        <div style="margin-bottom: 3rem;">
          <img src="/static/unibase-logo.png" alt="脳活labo Unibase" style="height: 100px; margin-bottom: 1.5rem;" />
          <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: var(--text-primary); letter-spacing: 2px;">
            Neuro mate
          </h1>
          <p style="font-size: 1.125rem; color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem;">
            AIヘルスアドバイザー
          </p>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">
            脳活labo Unibase 店舗会員専用
          </p>
        </div>

        <div class="card" style="padding: 3rem 2.5rem; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 184, 130, 0.05) 100%); border: 2px solid var(--primary-color);">
          <h2 style="font-size: 1.5rem; margin-bottom: 2rem; color: var(--text-primary);">
            会員認証
          </h2>
          <form id="member-form" onsubmit="handleMemberVerification(event)" style="text-align: left;">
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" style="font-size: 1rem; margin-bottom: 0.75rem; display: block;">
                会員ID
              </label>
              <input 
                type="text" 
                id="member-id-field" 
                class="form-input" 
                placeholder="UNI-001" 
                style="font-size: 1.125rem; padding: 1rem; text-align: center; letter-spacing: 2px;"
                maxlength="7"
                required
                autocomplete="off"
              />
            </div>
            <div id="member-error" style="color: #e74c3c; margin-bottom: 1rem; font-size: 0.9rem; min-height: 20px;"></div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; font-size: 1.125rem; padding: 1rem;">
              認証して相談を始める
            </button>
          </form>
        </div>

        <div style="margin-top: 3rem; padding: 0 1rem;">
          <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.6;">
            ※ 会員IDは店舗でお渡ししたカードに記載されています<br />
            ご不明な場合は店舗スタッフまでお問い合わせください
          </p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function handleMemberVerification(event) {
          event.preventDefault();
          
          const memberIdField = document.getElementById('member-id-field');
          const memberId = memberIdField.value.trim().toUpperCase();
          const errorDiv = document.getElementById('member-error');
          const submitBtn = event.target.querySelector('button[type="submit"]');
          
          if (!memberId) {
            errorDiv.textContent = '会員IDを入力してください';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = '確認中...';
          errorDiv.textContent = '';

          try {
            const response = await fetch('/api/chat/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ member_id: memberId })
            });

            const data = await response.json();

            if (data.success) {
              sessionStorage.setItem('member', JSON.stringify(data.member));
              window.location.href = '/consult';
            } else {
              errorDiv.textContent = data.error;
              submitBtn.disabled = false;
              submitBtn.textContent = '認証して相談を始める';
            }
          } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = '通信エラーが発生しました';
            submitBtn.disabled = false;
            submitBtn.textContent = '認証して相談を始める';
          }
        }

        document.getElementById('member-id-field').addEventListener('input', function(e) {
          e.target.value = e.target.value.toUpperCase();
        });
      ` }} />
    </div>
  )
})

export default app
