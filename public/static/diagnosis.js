// Diagnosis wizard

let currentStep = 1;
const totalSteps = 6;
const answers = {
  ageGroup: '',
  gender: '',
  mainConcerns: [],
  chronicPain: {
    neckShoulder: 0,
    headache: 0,
    lowerBack: 0,
    upperBack: 0
  },
  brainFatigue: {
    sleepOnset: 0,
    nightWaking: 0,
    morningFatigue: 0,
    concentration: 0
  },
  beauty: {
    swelling: 0,
    skinDullness: 0,
    faceLine: 0
  },
  lifestyle: {
    mealFrequency: 0,
    exerciseAmount: 0,
    caffeine: 0,
    alcohol: 0,
    screenTime: 0
  },
  mental: {
    stressLevel: 0,
    moodSwings: 0,
    anxietyIrritability: 0
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderStep(currentStep);
});

function renderStep(step) {
  const content = document.getElementById('step-content');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  // Update step indicator
  document.getElementById('current-step').textContent = step;
  const progress = (step / totalSteps) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
  
  // Show/hide prev button
  prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
  
  // Update next button text
  nextBtn.textContent = step === totalSteps ? '診断結果を見る' : '次へ';
  
  let html = '';
  
  switch(step) {
    case 1:
      html = `
        <h2 class="card-header">基本情報</h2>
        <div class="form-group">
          <label class="form-label">年齢帯</label>
          <select class="form-select" id="ageGroup" onchange="answers.ageGroup = this.value">
            <option value="">選択してください</option>
            <option value="20代" ${answers.ageGroup === '20代' ? 'selected' : ''}>20代</option>
            <option value="30代" ${answers.ageGroup === '30代' ? 'selected' : ''}>30代</option>
            <option value="40代" ${answers.ageGroup === '40代' ? 'selected' : ''}>40代</option>
            <option value="50代" ${answers.ageGroup === '50代' ? 'selected' : ''}>50代</option>
            <option value="60代以上" ${answers.ageGroup === '60代以上' ? 'selected' : ''}>60代以上</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">性別</label>
          <select class="form-select" id="gender" onchange="answers.gender = this.value">
            <option value="">選択してください</option>
            <option value="男性" ${answers.gender === '男性' ? 'selected' : ''}>男性</option>
            <option value="女性" ${answers.gender === '女性' ? 'selected' : ''}>女性</option>
            <option value="その他" ${answers.gender === 'その他' ? 'selected' : ''}>その他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">主な悩み（複数選択可）</label>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${['慢性コリ・痛み', '脳疲労', '睡眠', '美容', 'パフォーマンス', 'なんとなく不調'].map(concern => `
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" value="${concern}" 
                  ${answers.mainConcerns.includes(concern) ? 'checked' : ''}
                  onchange="toggleConcern('${concern}')">
                ${concern}
              </label>
            `).join('')}
          </div>
        </div>
      `;
      break;
      
    case 2:
      html = `
        <h2 class="card-header">慢性コリ・痛み</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">0（なし）〜 4（とても強い）で評価してください</p>
        ${createRangeInput('neckShoulder', '首肩こり', answers.chronicPain.neckShoulder, 'answers.chronicPain.neckShoulder')}
        ${createRangeInput('headache', '頭痛', answers.chronicPain.headache, 'answers.chronicPain.headache')}
        ${createRangeInput('lowerBack', '腰の違和感', answers.chronicPain.lowerBack, 'answers.chronicPain.lowerBack')}
        ${createRangeInput('upperBack', '背中の張り', answers.chronicPain.upperBack, 'answers.chronicPain.upperBack')}
      `;
      break;
      
    case 3:
      html = `
        <h2 class="card-header">脳疲労・睡眠</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">0（問題なし）〜 4（大きな問題）で評価してください</p>
        ${createRangeInput('sleepOnset', '寝付きの悪さ', answers.brainFatigue.sleepOnset, 'answers.brainFatigue.sleepOnset')}
        ${createRangeInput('nightWaking', '夜中に目が覚める', answers.brainFatigue.nightWaking, 'answers.brainFatigue.nightWaking')}
        ${createRangeInput('morningFatigue', '朝の疲労感', answers.brainFatigue.morningFatigue, 'answers.brainFatigue.morningFatigue')}
        ${createRangeInput('concentration', '集中力の低下', answers.brainFatigue.concentration, 'answers.brainFatigue.concentration')}
      `;
      break;
      
    case 4:
      html = `
        <h2 class="card-header">美容</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">0（気にならない）〜 4（とても気になる）で評価してください</p>
        ${createRangeInput('swelling', 'むくみ', answers.beauty.swelling, 'answers.beauty.swelling')}
        ${createRangeInput('skinDullness', '肌のくすみ・ハリ', answers.beauty.skinDullness, 'answers.beauty.skinDullness')}
        ${createRangeInput('faceLine', 'フェイスラインのたるみ', answers.beauty.faceLine, 'answers.beauty.faceLine')}
      `;
      break;
      
    case 5:
      html = `
        <h2 class="card-header">生活習慣</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">0（少ない/良い）〜 4（多い/悪い）で評価してください</p>
        ${createRangeInput('mealFrequency', '外食・コンビニ頻度', answers.lifestyle.mealFrequency, 'answers.lifestyle.mealFrequency')}
        ${createRangeInput('exerciseAmount', '運動不足', answers.lifestyle.exerciseAmount, 'answers.lifestyle.exerciseAmount')}
        ${createRangeInput('caffeine', 'カフェイン摂取', answers.lifestyle.caffeine, 'answers.lifestyle.caffeine')}
        ${createRangeInput('alcohol', 'アルコール摂取', answers.lifestyle.alcohol, 'answers.lifestyle.alcohol')}
        ${createRangeInput('screenTime', 'デジタルデバイス使用', answers.lifestyle.screenTime, 'answers.lifestyle.screenTime')}
      `;
      break;
      
    case 6:
      html = `
        <h2 class="card-header">メンタル状態（補助情報）</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">0（少ない）〜 4（多い）で評価してください</p>
        ${createRangeInput('stressLevel', 'ストレス度', answers.mental.stressLevel, 'answers.mental.stressLevel')}
        ${createRangeInput('moodSwings', '気分のムラ', answers.mental.moodSwings, 'answers.mental.moodSwings')}
        ${createRangeInput('anxietyIrritability', 'イライラ・不安感', answers.mental.anxietyIrritability, 'answers.mental.anxietyIrritability')}
      `;
      break;
  }
  
  content.innerHTML = html;
  currentStep = step;
}

function createRangeInput(id, label, value, path) {
  return `
    <div class="range-group">
      <label class="form-label">${label}: <span id="${id}-value">${value}</span></label>
      <input type="range" class="range-input" id="${id}" min="0" max="4" value="${value}"
        oninput="document.getElementById('${id}-value').textContent = this.value; ${path} = parseInt(this.value)" />
      <div class="range-labels">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
      </div>
    </div>
  `;
}

function toggleConcern(concern) {
  const index = answers.mainConcerns.indexOf(concern);
  if (index > -1) {
    answers.mainConcerns.splice(index, 1);
  } else {
    answers.mainConcerns.push(concern);
  }
}

function previousStep() {
  if (currentStep > 1) {
    renderStep(currentStep - 1);
  }
}

async function nextStep() {
  // Validate current step
  if (currentStep === 1) {
    if (!answers.ageGroup || !answers.gender || answers.mainConcerns.length === 0) {
      alert('すべての項目を入力してください');
      return;
    }
  }
  
  if (currentStep < totalSteps) {
    renderStep(currentStep + 1);
  } else {
    // Submit diagnosis
    await submitDiagnosisForm();
  }
}

async function submitDiagnosisForm() {
  const wizard = document.getElementById('diagnosis-wizard');
  const resultSection = document.getElementById('result-section');
  
  wizard.style.display = 'none';
  resultSection.innerHTML = '<div class="card"><div class="loading">診断中...</div></div>';
  resultSection.style.display = 'block';
  
  const result = await submitDiagnosis(answers);
  
  if (result.success) {
    displayResult(result.result);
  } else {
    resultSection.innerHTML = '<div class="card"><div class="error">' + result.error + '</div></div>';
  }
}

function displayResult(result) {
  const section = document.getElementById('result-section');
  
  let html = '<div class="card" style="background: #f0fdf4;">';
  html += '<h2 class="card-header" style="color: #10b981;">🎉 診断結果</h2>';
  
  html += '<div style="margin-bottom: 2rem;">';
  html += '<h3 style="margin-bottom: 0.5rem;">総合評価</h3>';
  html += '<p>' + result.summary + '</p>';
  html += '</div>';
  
  if (result.supplements && result.supplements.length > 0) {
    html += '<div style="margin-bottom: 2rem;">';
    html += '<h3 style="margin-bottom: 1rem;">あなたに合ったサプリメント</h3>';
    result.supplements.forEach(supp => {
      html += '<div class="supplement-card card" style="margin-bottom: 1rem;">';
      html += '<div class="supplement-name">' + supp.name + '</div>';
      html += '<p class="supplement-reason">' + supp.reason + '</p>';
      html += '<div class="supplement-effects">';
      supp.expectedEffects.forEach(effect => {
        html += '<span class="effect-tag">' + effect + '</span>';
      });
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }
  
  if (result.selfCare && result.selfCare.length > 0) {
    html += '<div style="margin-bottom: 2rem;">';
    html += '<h3 style="margin-bottom: 1rem;">おすすめセルフケア</h3>';
    result.selfCare.forEach(care => {
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
  
  html += '<div style="text-align: center; margin-top: 2rem;">';
  html += '<p style="margin-bottom: 1rem;">より詳しい分析をご希望の方は、ベーシックプラン以上をご検討ください</p>';
  html += '<a href="/signup" class="btn btn-primary">会員登録してプランを見る</a>';
  html += '</div>';
  
  html += '</div>';
  
  section.innerHTML = html;
}

function getCategoryLabel(category) {
  const labels = {
    'brainTraining': '🧠 脳トレ',
    'bodycare': '💆 ボディケア',
    'lifestyle': '🌱 生活習慣'
  };
  return labels[category] || category;
}
