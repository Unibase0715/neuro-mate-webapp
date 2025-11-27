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

// ==================== HOME PAGE ====================
app.get('/', (c) => {
  return c.render(
    <div style="min-height: 85vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div style="max-width: 550px; width: 100%;">
        {/* Logo & Title Section */}
        <div style="text-align: center; margin-bottom: 4rem;">
          <div style="margin-bottom: 2rem;">
            <img 
              src="/static/unibase-logo.png" 
              alt="脳活labo Unibase" 
              style="height: 120px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));" 
            />
          </div>
          <h1 style="font-size: 3rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); letter-spacing: 3px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Neuro mate
          </h1>
          <div style="height: 3px; width: 80px; background: linear-gradient(90deg, transparent, var(--primary-color), transparent); margin: 1rem auto;"></div>
          <p style="font-size: 1.25rem; color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem; letter-spacing: 1px;">
            AIヘルスアドバイザー
          </p>
          <p style="font-size: 1rem; color: var(--text-secondary); letter-spacing: 0.5px;">
            脳活labo Unibase 店舗会員専用
          </p>
        </div>

        {/* Auth Card */}
        <div class="card" style="padding: 3rem 2.5rem; background: linear-gradient(145deg, var(--bg-card) 0%, rgba(201, 184, 130, 0.08) 100%); border: 2px solid var(--primary-color); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
          <div style="text-align: center; margin-bottom: 2.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
              会員認証
            </h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">
              店舗でお渡しした会員IDをご入力ください
            </p>
          </div>
          
          <form id="member-form" onsubmit="handleMemberVerification(event)">
            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.75rem; text-align: center;">
                会員ID
              </label>
              <input 
                type="text" 
                id="member-id-field" 
                class="form-input" 
                placeholder="UNI-001" 
                style="font-size: 1.25rem; padding: 1.125rem; text-align: center; letter-spacing: 3px; font-weight: 600; border: 2px solid var(--border-color); transition: all 0.3s;"
                maxlength="7"
                required
                autocomplete="off"
              />
            </div>
            <div id="member-error" style="color: #e74c3c; margin-bottom: 1.5rem; font-size: 0.9rem; text-align: center; min-height: 24px; font-weight: 500;"></div>
            <button 
              type="submit" 
              class="btn btn-primary btn-lg" 
              style="width: 100%; font-size: 1.125rem; padding: 1.125rem; font-weight: 600; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(201, 184, 130, 0.3); transition: all 0.3s;"
            >
              認証して相談を始める
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div style="margin-top: 2.5rem; text-align: center; padding: 0 1rem;">
          <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.7;">
            ※ 会員IDが不明な場合は店舗スタッフまでお問い合わせください
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
          submitBtn.style.opacity = '0.7';
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
              submitBtn.textContent = '認証成功！';
              submitBtn.style.background = '#10b981';
              setTimeout(() => {
                window.location.href = '/consult';
              }, 500);
            } else {
              errorDiv.textContent = data.error;
              submitBtn.disabled = false;
              submitBtn.textContent = '認証して相談を始める';
              submitBtn.style.opacity = '1';
            }
          } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = '通信エラーが発生しました';
            submitBtn.disabled = false;
            submitBtn.textContent = '認証して相談を始める';
            submitBtn.style.opacity = '1';
          }
        }

        document.getElementById('member-id-field').addEventListener('input', function(e) {
          e.target.value = e.target.value.toUpperCase();
        });

        document.getElementById('member-id-field').addEventListener('focus', function(e) {
          e.target.style.borderColor = 'var(--primary-color)';
          e.target.style.boxShadow = '0 0 0 3px rgba(201, 184, 130, 0.1)';
        });

        document.getElementById('member-id-field').addEventListener('blur', function(e) {
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.boxShadow = 'none';
        });
      ` }} />
    </div>
  )
})

// ==================== CHAT CONSULTATION PAGE ====================
app.get('/consult', (c) => {
  return c.render(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .chat-message {
          animation: fadeIn 0.4s ease-out;
        }
        .typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary-color);
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
      ` }} />
      
      <div style="display: flex; flex-direction: column; height: 100vh; max-width: 1000px; margin: 0 auto; background: var(--bg-primary);">
        {/* Chat Header */}
        <div style="background: linear-gradient(135deg, #2b2b2a 0%, #3a3a38 100%); padding: 1.5rem 2rem; border-bottom: 2px solid var(--primary-color); box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <img 
                src="/static/unibase-logo.png" 
                alt="脳活labo" 
                style="height: 40px; filter: brightness(1.1);" 
              />
              <div>
                <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                  Neuro mate
                </h1>
                <p id="member-name" style="font-size: 0.875rem; color: var(--primary-color); margin: 0;"></p>
              </div>
            </div>
            <a href="/" style="color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; transition: color 0.3s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-secondary)'">
              ログアウト
            </a>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
          {/* Initial AI greeting will be added by JavaScript */}
        </div>

        {/* Chat Input Area */}
        <div style="background: var(--bg-secondary); padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); box-shadow: 0 -2px 10px rgba(0,0,0,0.1);">
          <form id="chat-form" onsubmit="handleSendMessage(event)" style="display: flex; gap: 1rem; align-items: flex-end;">
            <textarea 
              id="user-input" 
              placeholder="今日はどんなことが気になりますか？自由に書いてください..."
              style="flex: 1; min-height: 56px; max-height: 150px; padding: 1rem 1.25rem; border-radius: 28px; border: 2px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-size: 1rem; line-height: 1.6; resize: none; transition: all 0.3s; font-family: inherit;"
              rows="1"
              onkeydown="handleInputKeydown(event)"
            ></textarea>
            <button 
              type="submit" 
              id="send-button"
              style="flex-shrink: 0; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), #d4c190); border: none; color: #1f2937; font-size: 1.5rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(201, 184, 130, 0.3); display: flex; align-items: center; justify-content: center; font-weight: 700;"
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(201, 184, 130, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(201, 184, 130, 0.3)'"
            >
              ↑
            </button>
          </form>
          <p style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-muted); text-align: center;">
            症状・生活習慣・気になることを自由にお話しください
          </p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const member = JSON.parse(sessionStorage.getItem('member') || 'null');
        if (!member) {
          window.location.href = '/';
        }
        
        document.getElementById('member-name').textContent = member.name + 'さん';
        
        // Chat state
        let conversationHistory = [];
        let isAIResponding = false;
        
        // Initialize chat
        function initChat() {
          const chatMessages = document.getElementById('chat-messages');
          
          // Add AI greeting
          addMessage('ai', \`こんにちは、\${member.name}さん。\\n\\n脳活labo AIアドバイザーです。\\n\\n今日はどんなことが一番気になりますか？\\n頭の重さ・眠り・メンタル・胃腸・肩こり・美容、なんでも自由に書いてください。\\n\\nあなたの状態を脳・自律神経の視点から整理して、具体的なサポートを提案します。\`);
        }
        
        // Add message to chat
        function addMessage(role, content) {
          const chatMessages = document.getElementById('chat-messages');
          const messageDiv = document.createElement('div');
          messageDiv.className = 'chat-message';
          
          if (role === 'user') {
            messageDiv.style.cssText = \`
              display: flex;
              justify-content: flex-end;
              margin-left: 20%;
            \`;
            messageDiv.innerHTML = \`
              <div style="background: linear-gradient(135deg, var(--primary-color), #d4c190); color: #1f2937; padding: 1rem 1.5rem; border-radius: 20px 20px 4px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); max-width: 100%; word-wrap: break-word; line-height: 1.6;">
                \${content.replace(/\\n/g, '<br>')}
              </div>
            \`;
          } else {
            messageDiv.style.cssText = \`
              display: flex;
              justify-content: flex-start;
              margin-right: 20%;
            \`;
            messageDiv.innerHTML = \`
              <div style="background: var(--bg-card); color: var(--text-primary); padding: 1.25rem 1.5rem; border-radius: 20px 20px 20px 4px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%; word-wrap: break-word; line-height: 1.8;">
                \${content.replace(/\\n/g, '<br>')}
              </div>
            \`;
          }
          
          chatMessages.appendChild(messageDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          // Store in history
          conversationHistory.push({ role, content });
        }
        
        // Add typing indicator
        function addTypingIndicator() {
          const chatMessages = document.getElementById('chat-messages');
          const typingDiv = document.createElement('div');
          typingDiv.id = 'typing-indicator';
          typingDiv.className = 'chat-message';
          typingDiv.style.cssText = \`
            display: flex;
            justify-content: flex-start;
            margin-right: 20%;
          \`;
          typingDiv.innerHTML = \`
            <div class="typing-indicator" style="background: var(--bg-card); padding: 1rem 1.5rem; border-radius: 20px; border: 1px solid var(--border-color); display: flex; gap: 0.5rem;">
              <span></span>
              <span></span>
              <span></span>
            </div>
          \`;
          chatMessages.appendChild(typingDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Remove typing indicator
        function removeTypingIndicator() {
          const indicator = document.getElementById('typing-indicator');
          if (indicator) {
            indicator.remove();
          }
        }
        
        // Handle send message
        async function handleSendMessage(event) {
          event.preventDefault();
          
          if (isAIResponding) return;
          
          const input = document.getElementById('user-input');
          const message = input.value.trim();
          
          if (!message) return;
          
          // Add user message
          addMessage('user', message);
          input.value = '';
          input.style.height = 'auto';
          
          // Disable input while AI responds
          isAIResponding = true;
          input.disabled = true;
          document.getElementById('send-button').disabled = true;
          
          // Show typing indicator
          addTypingIndicator();
          
          try {
            // Call AI chat API
            const response = await fetch('/api/chat/message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                member_id: member.member_id,
                member_name: member.name,
                message: message,
                conversationHistory: conversationHistory
              })
            });
            
            const data = await response.json();
            
            removeTypingIndicator();
            
            if (data.success) {
              addMessage('ai', data.reply);
            } else {
              addMessage('ai', 'エラーが発生しました。もう一度お試しください。');
            }
          } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessage('ai', '通信エラーが発生しました。もう一度お試しください。');
          } finally {
            isAIResponding = false;
            input.disabled = false;
            document.getElementById('send-button').disabled = false;
            input.focus();
          }
        }
        
        // Handle input keydown (Enter to send, Shift+Enter for new line)
        function handleInputKeydown(event) {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            document.getElementById('chat-form').dispatchEvent(new Event('submit'));
          }
        }
        
        // Auto-resize textarea
        const userInput = document.getElementById('user-input');
        userInput.addEventListener('input', function() {
          this.style.height = 'auto';
          this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        });
        
        // Focus and border effects
        userInput.addEventListener('focus', function() {
          this.style.borderColor = 'var(--primary-color)';
          this.style.boxShadow = '0 0 0 3px rgba(201, 184, 130, 0.1)';
        });
        userInput.addEventListener('blur', function() {
          this.style.borderColor = 'var(--border-color)';
          this.style.boxShadow = 'none';
        });
        
        // Initialize
        initChat();
      ` }} />
    </>
  )
})

// ==================== RESULT PAGE ====================
app.get('/result', (c) => {
  return c.render(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .loading-spinner {
          width: 70px;
          height: 70px;
          border: 5px solid var(--border-color);
          border-top: 5px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        .thinking-log-item {
          animation: fadeIn 0.6s ease-out;
        }
        .result-card {
          animation: fadeIn 0.8s ease-out;
        }
      ` }} />

      <div class="container" style="padding-top: 3rem; padding-bottom: 4rem; max-width: 950px;">
        {/* Loading Container */}
        <div id="loading-container" style="text-align: center; padding: 4rem 2rem;">
          <div style="margin-bottom: 2.5rem;">
            <div class="loading-spinner"></div>
          </div>
          <h2 style="font-size: 2rem; font-weight: 600; margin-bottom: 1.5rem; color: var(--text-primary);">
            AIが分析中です
          </h2>
          <p style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 2.5rem;">
            あなたの状態を総合的に分析しています...
          </p>
          <div id="thinking-log" style="max-width: 550px; margin: 0 auto; text-align: left; padding: 2rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color);"></div>
        </div>

        {/* Result Container */}
        <div id="result-container" style="display: none;">
          <div style="text-align: center; margin-bottom: 3.5rem;">
            <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); letter-spacing: 1px;">
              AI分析結果
            </h1>
            <div style="height: 3px; width: 80px; background: var(--primary-color); margin: 1rem auto;"></div>
            <p id="member-name" style="font-size: 1.25rem; color: var(--primary-color); font-weight: 600; margin-top: 1.5rem;"></p>
          </div>

          <div id="result-content"></div>

          <div style="text-align: center; margin-top: 4rem;">
            <a href="/" class="btn btn-primary btn-lg" style="padding: 1.125rem 3rem; font-size: 1.125rem; letter-spacing: 1px;">
              トップに戻る
            </a>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const member = JSON.parse(sessionStorage.getItem('member') || 'null');
        const consultation = JSON.parse(sessionStorage.getItem('consultation') || 'null');
        
        if (!member || !consultation) {
          window.location.href = '/';
        }

        const thinkingMessages = [
          '🔍 あなたの状態を詳しく分析しています...',
          '📊 症状のパターンを確認中...',
          '🧬 生活習慣との関連性を調査中...',
          '💊 最適なサプリメントを検索中...',
          '🧘 効果的なセルフケアを選定中...',
          '✨ 総合レポートを作成中...'
        ];

        let currentMessage = 0;
        const thinkingLogDiv = document.getElementById('thinking-log');

        function updateThinkingLog() {
          if (currentMessage < thinkingMessages.length) {
            const p = document.createElement('p');
            p.className = 'thinking-log-item';
            p.style.cssText = 'color: var(--text-primary); margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-card); border-left: 3px solid var(--primary-color); border-radius: 4px; font-weight: 500;';
            p.textContent = thinkingMessages[currentMessage];
            thinkingLogDiv.appendChild(p);
            currentMessage++;
          }
        }

        const thinkingInterval = setInterval(updateThinkingLog, 1800);

        async function fetchResult() {
          try {
            const response = await fetch('/api/chat/consult', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                member_id: member.member_id,
                member_name: member.name,
                currentConcerns: consultation.concerns,
                lifestyleRhythm: consultation.lifestyle,
                additionalNotes: consultation.notes
              })
            });

            const data = await response.json();

            if (data.success) {
              setTimeout(() => displayResult(data.report), 2000);
            } else {
              showError('申し訳ございません。エラーが発生しました。');
            }
          } catch (error) {
            console.error('Error:', error);
            showError('通信エラーが発生しました');
          }
        }

        function displayResult(report) {
          clearInterval(thinkingInterval);
          
          document.getElementById('loading-container').style.display = 'none';
          document.getElementById('result-container').style.display = 'block';
          document.getElementById('member-name').textContent = member.name + 'さんの分析結果';

          const resultContent = document.getElementById('result-content');
          let html = '';

          html += '<div class="result-card card" style="margin-bottom: 2.5rem; padding: 2.5rem; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 184, 130, 0.05) 100%); border-left: 5px solid var(--primary-color); box-shadow: 0 8px 20px rgba(0,0,0,0.15);">';
          html += '<h3 style="font-size: 1.75rem; margin-bottom: 1.25rem; color: var(--primary-color); font-weight: 700; display: flex; align-items: center; gap: 0.75rem;"><span>📋</span> 総合分析</h3>';
          html += '<p style="font-size: 1.125rem; line-height: 1.9; color: var(--text-primary); white-space: pre-wrap;">' + report.summary + '</p>';
          html += '</div>';

          if (report.supplements && report.supplements.length > 0) {
            html += '<div class="result-card card" style="margin-bottom: 2.5rem; padding: 2.5rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">';
            html += '<h3 style="font-size: 1.75rem; margin-bottom: 1.75rem; color: var(--primary-color); font-weight: 700; display: flex; align-items: center; gap: 0.75rem;"><span>💊</span> おすすめサプリメント</h3>';
            report.supplements.forEach((s, i) => {
              html += '<div style="margin-bottom: ' + (i < report.supplements.length - 1 ? '2rem' : '0') + '; padding: 1.75rem; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-color);">';
              html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">';
              html += '<h4 style="font-size: 1.375rem; color: var(--text-primary); margin: 0; font-weight: 600;">' + s.name + '</h4>';
              html += '<span style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); padding: 0.5rem 1rem; background: rgba(201, 184, 130, 0.1); border-radius: 8px;">スコア: ' + s.score + '/100</span>';
              html += '</div>';
              html += '<p style="color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem;">' + s.reason + '</p>';
              html += '</div>';
            });
            html += '</div>';
          }

          if (report.selfCare && report.selfCare.length > 0) {
            html += '<div class="result-card card" style="margin-bottom: 2.5rem; padding: 2.5rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">';
            html += '<h3 style="font-size: 1.75rem; margin-bottom: 1.75rem; color: var(--primary-color); font-weight: 700; display: flex; align-items: center; gap: 0.75rem;"><span>🧘</span> セルフケアメニュー</h3>';
            report.selfCare.forEach((s, i) => {
              html += '<div style="margin-bottom: ' + (i < report.selfCare.length - 1 ? '1.5rem' : '0') + '; padding: 1.75rem; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-color);">';
              html += '<h4 style="font-size: 1.25rem; color: var(--text-primary); margin-bottom: 0.75rem; font-weight: 600;">' + s.title + '</h4>';
              html += '<p style="color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem;">' + s.description + '</p>';
              html += '</div>';
            });
            html += '</div>';
          }

          html += '<div class="result-card" style="text-align: center; padding: 2.5rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); border-radius: 12px; border: 2px solid #10b981;">';
          html += '<p style="color: #10b981; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.75rem;"><span style="font-size: 1.5rem;">✅</span> 相談内容は記録されました</p>';
          html += '</div>';

          resultContent.innerHTML = html;
          sessionStorage.removeItem('consultation');
        }

        function showError(message) {
          clearInterval(thinkingInterval);
          document.getElementById('loading-container').innerHTML = '<div style="text-align: center; padding: 4rem 2rem;"><p style="color: #e74c3c; font-size: 1.25rem; margin-bottom: 2rem;">' + message + '</p><a href="/" class="btn btn-primary btn-lg">トップに戻る</a></div>';
        }

        fetchResult();
      ` }} />
    </>
  )
})

export default app
