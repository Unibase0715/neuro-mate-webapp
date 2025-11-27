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
              <a href="/" class="logo">
                <img src="/static/unibase-logo.png" alt="脳活labo Unibase" class="logo-image" />
                <span class="logo-text">Neuro mate</span>
              </a>
            </div>
          </div>
        </header>
        
        <main>
          {children}
        </main>
        
        <footer style="margin-top: 4rem; padding: 2rem 0; background: var(--bg-secondary); text-align: center; color: var(--text-secondary); border-top: 1px solid var(--border-color);">
          <div class="container">
            <p>&copy; 2025 脳活labo Unibase - Neuro mate. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
})
