import type { 
  DiagnosisAnswers, 
  DiagnosisResult, 
  SupplementRecommendation,
  SelfCareRecommendation 
} from '../types';

type SupplementScores = {
  magnesium: number;
  cytokine: number;
  ala: number;
  bhb: number;
  multivitamin: number;
}

export function calculateSupplementScores(answers: DiagnosisAnswers): SupplementScores {
  const scores: SupplementScores = {
    magnesium: 0,
    cytokine: 0,
    ala: 0,
    bhb: 0,
    multivitamin: 0
  };
  
  // Magnesium - 慢性コリ・痛み、睡眠、ストレス
  scores.magnesium += answers.chronicPain.neckShoulder * 2;
  scores.magnesium += answers.chronicPain.headache * 2;
  scores.magnesium += answers.brainFatigue.sleepOnset * 1.5;
  scores.magnesium += answers.brainFatigue.nightWaking * 1.5;
  scores.magnesium += answers.mental.stressLevel * 1.5;
  scores.magnesium += answers.mental.anxietyIrritability * 1.5;
  
  // Cytokine (幹細胞上清液) - 美容、疲労回復、全般的リカバリー
  scores.cytokine += answers.beauty.skinDullness * 2.5;
  scores.cytokine += answers.beauty.faceLine * 2;
  scores.cytokine += answers.brainFatigue.morningFatigue * 2;
  scores.cytokine += answers.chronicPain.lowerBack * 1.5;
  scores.cytokine += answers.beauty.swelling * 2;
  
  // 5-ALA - エネルギー、集中力、パフォーマンス
  scores.ala += answers.brainFatigue.concentration * 3;
  scores.ala += answers.brainFatigue.morningFatigue * 2;
  scores.ala += answers.lifestyle.exerciseAmount * 1.5;
  if (answers.mainConcerns.includes('パフォーマンス')) {
    scores.ala += 5;
  }
  
  // BHB (ケトン体) - 脳疲労、集中力、エネルギー
  scores.bhb += answers.brainFatigue.concentration * 2.5;
  scores.bhb += answers.brainFatigue.morningFatigue * 2;
  scores.bhb += answers.mental.moodSwings * 1.5;
  scores.bhb += answers.lifestyle.mealFrequency * 1.5;
  if (answers.mainConcerns.includes('脳疲労')) {
    scores.bhb += 5;
  }
  
  // Multivitamin - 生活習慣、全般的ベース
  scores.multivitamin += answers.lifestyle.mealFrequency * 2;
  scores.multivitamin += answers.lifestyle.exerciseAmount * 1.5;
  scores.multivitamin += answers.brainFatigue.morningFatigue * 1;
  scores.multivitamin += answers.beauty.skinDullness * 1.5;
  scores.multivitamin += answers.mental.stressLevel * 1;
  
  return scores;
}

export function generateSupplementRecommendations(
  scores: SupplementScores,
  answers: DiagnosisAnswers
): SupplementRecommendation[] {
  const supplements: SupplementRecommendation[] = [
    {
      name: 'マグネシウム',
      score: scores.magnesium,
      reason: '慢性的な首肩こりや睡眠の質の低下、ストレスレベルが高いことから、マグネシウム不足が考えられます。',
      expectedEffects: ['筋肉の緊張緩和', '睡眠の質向上', 'ストレス軽減', '神経系のリラックス']
    },
    {
      name: 'サイトカイン（臍帯由来幹細胞上清液）',
      score: scores.cytokine,
      reason: '美容面での悩みや疲労回復の遅れから、細胞レベルでのリカバリーサポートが有効です。',
      expectedEffects: ['肌質改善', '疲労回復促進', 'アンチエイジング', '全身のリカバリー']
    },
    {
      name: '5-ALA',
      score: scores.ala,
      reason: '集中力の低下や朝の疲労感から、ミトコンドリア機能の向上が必要と考えられます。',
      expectedEffects: ['エネルギー生成促進', '集中力向上', 'パフォーマンス向上', '持久力アップ']
    },
    {
      name: 'BHB（ケトン体）',
      score: scores.bhb,
      reason: '脳疲労や集中力の低下、気分のムラから、脳のエネルギー源としてケトン体が有効です。',
      expectedEffects: ['脳機能向上', 'メンタルクリア', '持続的エネルギー', '気分の安定']
    },
    {
      name: 'マルチビタミン',
      score: scores.multivitamin,
      reason: '生活習慣や食事の偏りから、基本的な栄養素の底上げが必要です。',
      expectedEffects: ['栄養バランス改善', '全般的な健康維持', '免疫力サポート', 'エネルギー代謝促進']
    }
  ];
  
  // Sort by score and return top 3
  return supplements
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function generateSelfCareRecommendations(
  answers: DiagnosisAnswers
): SelfCareRecommendation[] {
  const recommendations: SelfCareRecommendation[] = [];
  
  // 脳トレ - 眼球運動・呼吸
  if (answers.brainFatigue.concentration >= 2 || answers.mental.stressLevel >= 2) {
    recommendations.push({
      category: 'brainTraining',
      title: '眼球運動トレーニング',
      description: '目を上下左右にゆっくり動かし、首を動かさずに8の字を描く。脳の活性化と疲労回復に効果的。',
      duration: '5分'
    });
  }
  
  if (answers.mental.stressLevel >= 3 || answers.brainFatigue.sleepOnset >= 2) {
    recommendations.push({
      category: 'brainTraining',
      title: '4-7-8呼吸法',
      description: '4秒吸って、7秒止めて、8秒吐く。自律神経を整え、リラックス効果が高い。',
      duration: '5分'
    });
  }
  
  // 体のケア
  if (answers.chronicPain.neckShoulder >= 3 || answers.chronicPain.upperBack >= 2) {
    recommendations.push({
      category: 'bodycare',
      title: '首肩セルフケアストレッチ',
      description: '肩を大きく回し、首をゆっくり傾ける。血流改善とコリの解消に効果的。',
      duration: '10分'
    });
  }
  
  if (answers.beauty.swelling >= 2 || answers.beauty.faceLine >= 2) {
    recommendations.push({
      category: 'bodycare',
      title: 'フェイシャルマッサージ',
      description: '顎から耳、額からこめかみへリンパを流す。むくみ解消とフェイスライン改善。',
      duration: '5分'
    });
  }
  
  // 生活習慣改善
  if (answers.lifestyle.screenTime >= 3) {
    recommendations.push({
      category: 'lifestyle',
      title: 'デジタルデトックス',
      description: '就寝1時間前からスマホ・PC利用を控える。ブルーライトカット眼鏡の使用も推奨。'
    });
  }
  
  if (answers.brainFatigue.sleepOnset >= 2 || answers.brainFatigue.nightWaking >= 2) {
    recommendations.push({
      category: 'lifestyle',
      title: '睡眠環境の最適化',
      description: '寝室の温度を18-22度に保ち、就寝90分前の入浴で体温リズムを整える。'
    });
  }
  
  if (answers.lifestyle.exerciseAmount >= 3) {
    recommendations.push({
      category: 'lifestyle',
      title: '軽い運動習慣',
      description: '1日15分のウォーキングから始める。血流改善と自律神経のバランス調整に効果的。',
      duration: '15分'
    });
  }
  
  return recommendations;
}

export function generateDiagnosisResult(answers: DiagnosisAnswers): DiagnosisResult {
  const scores = calculateSupplementScores(answers);
  const supplements = generateSupplementRecommendations(scores, answers);
  const selfCare = generateSelfCareRecommendations(answers);
  
  const summary = `
あなたの主な悩みは「${answers.mainConcerns.join('、')}」です。
生活習慣と症状から、脳・自律神経・体のバランスを整えることが重要です。
特に${supplements[0].name}が最も適していると考えられます。
セルフケアと組み合わせることで、より効果的な改善が期待できます。
  `.trim();
  
  return {
    supplements,
    selfCare,
    summary
  };
}
