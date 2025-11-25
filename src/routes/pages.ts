import { Hono } from 'hono';
import type { Bindings } from '../types';

const pages = new Hono<{ Bindings: Bindings }>();

// Diagnosis page
pages.get('/diagnosis', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>脳活診断 - Neuro mate</title>
  <link href="/static/styles.css" rel="stylesheet">
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">
          <img src="https://www.genspark.ai/api/files/s/mKoUk92v" alt="Unibase Logo" style="height: 50px;" onerror="this.style.display='none'" />
          <span>Neuro mate</span>
        </a>
        <div id="auth-buttons">
          <a href="/login" class="btn btn-outline btn-sm">ログイン</a>
          <a href="/signup" class="btn btn-primary btn-sm">新規登録</a>
        </div>
        <div id="user-info" style="display: none;"></div>
      </div>
    </div>
  </header>

  <main class="container" style="padding-top: 3rem; padding-bottom: 3rem;">
    <h1 style="margin-bottom: 2rem; text-align: center;">脳活診断</h1>
    
    <div id="diagnosis-wizard">
      <div class="card">
        <div id="step-indicator" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>ステップ <span id="current-step">1</span> / 6</span>
          </div>
          <div style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
            <div id="progress-bar" style="height: 100%; width: 16.67%; background: var(--primary-color); transition: width 0.3s;"></div>
          </div>
        </div>
        
        <div id="step-content"></div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
          <button id="prev-btn" class="btn btn-outline" onclick="previousStep()" style="display: none;">戻る</button>
          <button id="next-btn" class="btn btn-primary" onclick="nextStep()">次へ</button>
        </div>
      </div>
    </div>
    
    <div id="result-section" style="display: none;"></div>
  </main>

  <script src="/static/app.js"></script>
  <script src="/static/diagnosis.js"></script>
</body>
</html>
  `);
});

// AI Consult page
pages.get('/ai/consult', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI相談 - Neuro mate</title>
  <link href="/static/styles.css" rel="stylesheet">
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">🧠 Neuro mate</a>
        <div id="user-info"></div>
      </div>
    </div>
  </header>

  <main class="container" style="padding-top: 3rem;">
    <h1 style="margin-bottom: 2rem;">AI相談</h1>
    
    <div class="card">
      <p style="color: #6b7280; margin-bottom: 1.5rem;">
        現在の悩みや症状、生活リズムなどを詳しく入力してください。<br>
        AIがあなたの状態を分析し、最適なアドバイスをお届けします。
      </p>
      
      <form id="consult-form" onsubmit="handleConsult(event)">
        <div class="form-group">
          <label class="form-label">現在の悩み・症状</label>
          <textarea class="form-textarea" name="currentConcerns" required
            placeholder="例：首肩のコリがひどく、夜もなかなか寝付けません。朝起きても疲れが取れていません..."></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">生活リズム</label>
          <textarea class="form-textarea" name="lifestyleRhythm" required
            placeholder="例：デスクワークで1日8時間座りっぱなし。睡眠は6時間程度、食事は不規則..."></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">その他気になること（任意）</label>
          <textarea class="form-textarea" name="additionalNotes"
            placeholder="例：肌のくすみも気になっています。ストレスも多く感じます..."></textarea>
        </div>
        
        <div id="consult-error"></div>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">AIに相談する</button>
      </form>
    </div>
    
    <div id="report-section" style="display: none;"></div>
  </main>

  <script src="/static/app.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      if (!authToken) {
        window.location.href = '/login';
        return;
      }
      
      await checkAuth();
      
      if (!currentUser || (currentUser.plan !== 'basic' && currentUser.plan !== 'premium')) {
        alert('この機能はベーシックプラン以上でご利用いただけます。');
        window.location.href = '/dashboard';
      }
    });
    
    async function handleConsult(event) {
      event.preventDefault();
      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const errorDiv = document.getElementById('consult-error');
      const reportSection = document.getElementById('report-section');
      
      submitBtn.disabled = true;
      submitBtn.textContent = '分析中...';
      errorDiv.innerHTML = '';
      
      const input = {
        currentConcerns: form.currentConcerns.value,
        lifestyleRhythm: form.lifestyleRhythm.value,
        additionalNotes: form.additionalNotes.value || ''
      };
      
      const result = await submitConsultation(input);
      
      if (result.success) {
        displayReport(result.report);
        form.reset();
      } else {
        errorDiv.innerHTML = '<div class="error">' + result.error + '</div>';
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'AIに相談する';
    }
    
    function displayReport(report) {
      const section = document.getElementById('report-section');
      
      let html = '<div class="card" style="margin-top: 2rem; background: #eff6ff;">';
      html += '<h2 class="card-header" style="color: #6366f1;">📋 AI分析レポート</h2>';
      
      html += '<div style="margin-bottom: 1.5rem;">';
      html += '<h3 style="margin-bottom: 0.5rem;">状態の要約</h3>';
      html += '<p>' + report.summary + '</p>';
      html += '</div>';
      
      if (report.factors) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h3 style="margin-bottom: 0.5rem;">考えられる要因</h3>';
        if (report.factors.chronicPain) {
          html += '<p><strong>慢性コリ・痛み：</strong>' + report.factors.chronicPain + '</p>';
        }
        if (report.factors.beauty) {
          html += '<p><strong>美容：</strong>' + report.factors.beauty + '</p>';
        }
        if (report.factors.performance) {
          html += '<p><strong>パフォーマンス：</strong>' + report.factors.performance + '</p>';
        }
        html += '</div>';
      }
      
      if (report.supplements && report.supplements.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h3 style="margin-bottom: 1rem;">おすすめサプリ</h3>';
        report.supplements.forEach(supp => {
          html += '<div class="supplement-card" style="margin-bottom: 1rem;">';
          html += '<div class="supplement-name">' + supp.name + '</div>';
          html += '<p class="supplement-reason">' + supp.reason + '</p>';
          html += '<div class="supplement-effects">';
          supp.expectedEffects.forEach(effect => {
            html += '<span class="effect-tag">' + effect + '</span>';
          });
          html += '</div></div>';
        });
        html += '</div>';
      }
      
      if (report.selfCare && report.selfCare.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h3 style="margin-bottom: 1rem;">おすすめセルフケア</h3>';
        report.selfCare.forEach(care => {
          html += '<div class="selfcare-card card" style="margin-bottom: 0.5rem;">';
          html += '<span class="selfcare-category">' + getCategoryLabel(care.category) + '</span>';
          html += '<div class="selfcare-title">' + care.title + '</div>';
          html += '<p>' + care.description + '</p>';
          if (care.duration) {
            html += '<p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">⏱ ' + care.duration + '</p>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      
      if (report.lifestyleImprovements && report.lifestyleImprovements.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h3 style="margin-bottom: 0.5rem;">生活習慣の改善ポイント</h3>';
        html += '<ul style="line-height: 1.8;">';
        report.lifestyleImprovements.forEach(item => {
          html += '<li>' + item + '</li>';
        });
        html += '</ul></div>';
      }
      
      if (report.mentalSupport) {
        html += '<div style="padding: 1rem; background: #fef3c7; border-radius: 0.5rem;">';
        html += '<p>' + report.mentalSupport + '</p>';
        html += '</div>';
      }
      
      html += '</div>';
      
      section.innerHTML = html;
      section.style.display = 'block';
    }
    
    function getCategoryLabel(category) {
      const labels = {
        'brainTraining': '🧠 脳トレ',
        'bodycare': '💆 ボディケア',
        'lifestyle': '🌱 生活習慣'
      };
      return labels[category] || category;
    }
  </script>
</body>
</html>
  `);
});

// Coach page
pages.get('/ai/coach', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>コーチング - Neuro mate</title>
  <link href="/static/styles.css" rel="stylesheet">
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">🧠 Neuro mate</a>
        <div id="user-info"></div>
      </div>
    </div>
  </header>

  <main class="container" style="padding-top: 3rem;">
    <h1 style="margin-bottom: 2rem;">パーソナルコーチング</h1>
    
    <div class="card">
      <h2 class="card-header">今日の状態を記録</h2>
      
      <form id="coach-form" onsubmit="handleCoachLog(event)">
        <div class="form-group">
          <label class="form-label">日付</label>
          <input type="date" class="form-input" name="logDate" required />
        </div>
        
        <div class="form-group">
          <label class="form-label">睡眠時間（時間）</label>
          <input type="number" class="form-input" name="sleepHours" min="0" max="24" step="0.5" />
        </div>
        
        <div class="range-group">
          <label class="form-label">疲労度: <span id="fatigue-value">5</span></label>
          <input type="range" class="range-input" name="fatigueLevel" min="0" max="10" value="5" 
            oninput="document.getElementById('fatigue-value').textContent = this.value" />
          <div class="range-labels">
            <span>なし</span>
            <span>最大</span>
          </div>
        </div>
        
        <div class="range-group">
          <label class="form-label">気分: <span id="mood-value">5</span></label>
          <input type="range" class="range-input" name="moodLevel" min="0" max="10" value="5"
            oninput="document.getElementById('mood-value').textContent = this.value" />
          <div class="range-labels">
            <span>悪い</span>
            <span>良い</span>
          </div>
        </div>
        
        <div class="range-group">
          <label class="form-label">コリ・痛み: <span id="pain-value">5</span></label>
          <input type="range" class="range-input" name="painLevel" min="0" max="10" value="5"
            oninput="document.getElementById('pain-value').textContent = this.value" />
          <div class="range-labels">
            <span>なし</span>
            <span>強い</span>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">セルフケア実施内容（任意）</label>
          <input type="text" class="form-input" name="didSelfcare" 
            placeholder="例：ストレッチ、呼吸法、眼球運動" />
        </div>
        
        <div id="coach-error"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">状態を記録</button>
      </form>
    </div>
    
    <div class="card" style="margin-top: 2rem;">
      <h2 class="card-header">今日のメニュー</h2>
      <button onclick="getDailyMenu()" class="btn btn-secondary">メニューを生成</button>
      <div id="menu-section" style="margin-top: 1rem;"></div>
    </div>
  </main>

  <script src="/static/app.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      if (!authToken) {
        window.location.href = '/login';
        return;
      }
      
      await checkAuth();
      
      if (!currentUser || currentUser.plan !== 'premium') {
        alert('この機能はプレミアムプランでご利用いただけます。');
        window.location.href = '/dashboard';
      }
      
      // Set today's date
      const today = new Date().toISOString().split('T')[0];
      document.querySelector('input[name="logDate"]').value = today;
    });
    
    async function handleCoachLog(event) {
      event.preventDefault();
      const form = event.target;
      const errorDiv = document.getElementById('coach-error');
      
      const log = {
        log_date: form.logDate.value,
        sleep_hours: parseFloat(form.sleepHours.value) || null,
        fatigue_level: parseInt(form.fatigueLevel.value),
        mood_level: parseInt(form.moodLevel.value),
        pain_level: parseInt(form.painLevel.value),
        did_selfcare: form.didSelfcare.value || null
      };
      
      const result = await submitCoachLog(log);
      
      if (result.success) {
        errorDiv.innerHTML = '<div class="success">記録を保存しました</div>';
        setTimeout(() => { errorDiv.innerHTML = ''; }, 3000);
      } else {
        errorDiv.innerHTML = '<div class="error">' + result.error + '</div>';
      }
    }
    
    async function getDailyMenu() {
      const menuSection = document.getElementById('menu-section');
      menuSection.innerHTML = '<div class="loading">生成中...</div>';
      
      const result = await getDailyPlan();
      
      if (result.success) {
        let html = '<div style="margin-top: 1rem;">';
        html += '<div style="padding: 1rem; background: #fef3c7; border-radius: 0.5rem; margin-bottom: 1rem;">';
        html += '<p>' + result.plan.feedback + '</p>';
        html += '</div>';
        
        html += '<h3 style="margin-bottom: 1rem;">本日のメニュー</h3>';
        result.plan.menu.forEach((item, index) => {
          html += '<div class="card" style="margin-bottom: 0.5rem;">';
          html += '<h4 style="color: #8b5cf6;">' + (index + 1) + '. ' + item.title + '</h4>';
          html += '<p>' + item.description + '</p>';
          html += '<p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">⏱ ' + item.duration + '</p>';
          html += '</div>';
        });
        html += '</div>';
        
        menuSection.innerHTML = html;
      } else {
        menuSection.innerHTML = '<div class="error">' + result.error + '</div>';
      }
    }
  </script>
</body>
</html>
  `);
});

export default pages;
