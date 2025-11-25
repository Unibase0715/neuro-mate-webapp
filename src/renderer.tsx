import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Neuro mate - 脳活AIヘルスアドバイザー'}</title>
        <link href="/static/styles.css" rel="stylesheet" />
      </head>
      <body>
        <header>
          <div class="container">
            <div class="header-content">
              <a href="/" class="logo">🧠 Neuro mate</a>
              <div id="auth-buttons">
                <a href="/login" class="btn btn-outline btn-sm">ログイン</a>
                <a href="/signup" class="btn btn-primary btn-sm">新規登録</a>
              </div>
              <div id="user-info" style="display: none;"></div>
            </div>
          </div>
        </header>
        
        <main>
          {children}
        </main>
        
        <footer style="margin-top: 4rem; padding: 2rem 0; background: #f9fafb; text-align: center; color: #6b7280;">
          <div class="container">
            <p>&copy; 2025 脳活labo Unibase - Neuro mate. All rights reserved.</p>
          </div>
        </footer>
        
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
