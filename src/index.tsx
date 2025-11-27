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

// ==================== CONSULTATION PAGE ====================
app.get('/consult', (c) => {
  return c.render(
    <div class="container" style="padding-top: 3rem; padding-bottom: 4rem; max-width: 850px;">
      {/* Header */}
      <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 2.25rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); letter-spacing: 1px;">
          AI健康相談
        </h1>
        <div style="height: 3px; width: 60px; background: var(--primary-color); margin: 1rem auto;"></div>
        <p id="welcome-message" style="font-size: 1.125rem; color: var(--primary-color); font-weight: 600; margin-top: 1rem;"></p>
      </div>

      {/* Consultation Form */}
      <div class="card" style="padding: 3rem 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <form id="consultation-form" onsubmit="handleConsultation(event)">
          
          {/* Question 1 */}
          <div style="margin-bottom: 3rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;">
              <span style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), #d4c190); display: flex; align-items: center; justify-content: center; color: #1f2937; font-weight: 700; font-size: 1.125rem;">1</span>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                  どういったお悩みでお困りですか？
                </h3>
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                  具体的にどんなことで悩んでいるか、どうなりたいかを自由にお書きください。<br />
                  <span style="color: var(--text-muted); font-size: 0.875rem;">
                    例：肩こりがひどくて仕事に集中できない。マッサージに行っても一時的で、根本的に改善したい...
                  </span>
                </p>
              </div>
            </div>
            <textarea 
              id="concerns" 
              class="form-input" 
              rows="6" 
              placeholder="ここに自由に書いてください..."
              style="resize: vertical; font-size: 1.05rem; line-height: 1.8; padding: 1.25rem;"
              required
            ></textarea>
          </div>

          {/* Question 2 */}
          <div style="margin-bottom: 3rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;">
              <span style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), #d4c190); display: flex; align-items: center; justify-content: center; color: #1f2937; font-weight: 700; font-size: 1.125rem;">2</span>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                  普段の生活について教えてください
                </h3>
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                  睡眠時間、仕事の内容、運動習慣など、日々の生活リズムをお聞かせください。<br />
                  <span style="color: var(--text-muted); font-size: 0.875rem;">
                    例：デスクワークで1日8時間座りっぱなし。睡眠は6時間程度で運動はほとんどしていません...
                  </span>
                </p>
              </div>
            </div>
            <textarea 
              id="lifestyle" 
              class="form-input" 
              rows="5" 
              placeholder="ここに自由に書いてください..."
              style="resize: vertical; font-size: 1.05rem; line-height: 1.8; padding: 1.25rem;"
              required
            ></textarea>
          </div>

          {/* Question 3 */}
          <div style="margin-bottom: 3rem;">
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;">
              <span style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #9ca3af, #d1d5db); display: flex; align-items: center; justify-content: center; color: #1f2937; font-weight: 700; font-size: 1.125rem;">3</span>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                  その他、伝えておきたいこと
                  <span style="font-size: 0.875rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;">（任意）</span>
                </h3>
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                  アレルギー、服用中の薬、過去の病歴など、知っておいてほしい情報があればお書きください。
                </p>
              </div>
            </div>
            <textarea 
              id="notes" 
              class="form-input" 
              rows="3" 
              placeholder="特になければ空欄で大丈夫です"
              style="resize: vertical; font-size: 1.05rem; line-height: 1.8; padding: 1.25rem;"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div style="text-align: center;">
            <button 
              type="submit" 
              class="btn btn-primary btn-lg" 
              style="width: 100%; max-width: 450px; font-size: 1.25rem; padding: 1.25rem; font-weight: 600; letter-spacing: 1px; box-shadow: 0 6px 20px rgba(201, 184, 130, 0.3); transition: all 0.3s;"
            >
              AIに相談する
            </button>
          </div>
        </form>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const member = JSON.parse(sessionStorage.getItem('member') || 'null');
        if (!member) {
          window.location.href = '/';
        } else {
          document.getElementById('welcome-message').textContent = member.name + 'さん、こんにちは';
        }

        async function handleConsultation(event) {
          event.preventDefault();
          
          const concerns = document.getElementById('concerns').value;
          const lifestyle = document.getElementById('lifestyle').value;
          const notes = document.getElementById('notes').value;
          const submitBtn = event.target.querySelector('button[type="submit"]');

          sessionStorage.setItem('consultation', JSON.stringify({
            concerns,
            lifestyle,
            notes
          }));

          submitBtn.disabled = true;
          submitBtn.textContent = 'AIが分析中...';
          submitBtn.style.opacity = '0.7';

          setTimeout(() => {
            window.location.href = '/result';
          }, 800);
        }

        ['concerns', 'lifestyle', 'notes'].forEach(id => {
          const el = document.getElementById(id);
          el.addEventListener('focus', function() {
            this.style.borderColor = 'var(--primary-color)';
            this.style.boxShadow = '0 0 0 3px rgba(201, 184, 130, 0.1)';
          });
          el.addEventListener('blur', function() {
            this.style.borderColor = 'var(--border-color)';
            this.style.boxShadow = 'none';
          });
        });
      ` }} />
    </div>
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
