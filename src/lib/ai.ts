import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Bindings, AIConsultationInput, AIReport } from '../types';

const SYSTEM_PROMPT = `
あなたは「脳活labo Unibase」の専門AIヘルスアドバイザーです。
専門分野は脳活性化、自律神経調整、慢性的なコリや痛みの改善、美容、パフォーマンス向上です。

以下の点に注意してアドバイスしてください：
1. 医療行為ではなく、一般的な健康アドバイスとして提案する
2. 脳・自律神経・体のバランスの観点から総合的に分析する
3. サプリメント（マグネシウム、サイトカイン、5-ALA、BHB、マルチビタミンなど）の優先順位を示す
4. セルフケア（脳トレ、姿勢改善、呼吸法など）を具体的に提案する
5. 生活習慣の改善ポイントを明確にする
6. メンタル面も補助的にサポートする（ストレス・気分のゆらぎへの簡単なアドバイス）
7. 前向きで励ましのトーンを保つ

回答は以下のJSON形式で返してください：
{
  "summary": "状態の要約（100文字程度）",
  "factors": {
    "chronicPain": "慢性コリ・痛みに関する考えられる要因",
    "beauty": "美容に関する考えられる要因",
    "performance": "パフォーマンスに関する考えられる要因"
  },
  "supplements": [
    {
      "name": "サプリ名",
      "score": 90,
      "reason": "推奨理由",
      "expectedEffects": ["効果1", "効果2"]
    }
  ],
  "selfCare": [
    {
      "category": "brainTraining" | "bodycare" | "lifestyle",
      "title": "タイトル",
      "description": "説明",
      "duration": "5分"
    }
  ],
  "lifestyleImprovements": ["改善ポイント1", "改善ポイント2"],
  "mentalSupport": "メンタルサポートコメント"
}
`;

const COACH_SYSTEM_PROMPT = `
あなたは「脳活labo Unibase」のパーソナルコーチです。
ユーザーの日々の状態ログを分析し、今日のセルフケアメニューを提案します。

以下の点に注意してください：
1. ログから疲労度、気分、痛みのレベルを考慮する
2. 実行可能な3-5個のメニューを提案する
3. 各メニューは5-10分程度で完了できるものにする
4. 前向きで励ましのトーンを保つ
5. 過度な負担をかけないよう配慮する

回答は以下のJSON形式で返してください：
{
  "feedback": "今日の状態に対する簡単なフィードバック",
  "menu": [
    {
      "title": "メニュータイトル",
      "description": "具体的な説明",
      "duration": "5分"
    }
  ]
}
`;

/**
 * OpenAI APIを使用してAI相談を生成
 */
async function generateWithOpenAI(
  input: AIConsultationInput,
  env: Bindings
): Promise<AIReport> {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const userMessage = `
【現在の悩み】
${input.currentConcerns}

【生活リズム】
${input.lifestyleRhythm}

【その他気になること】
${input.additionalNotes}

上記の内容を分析し、JSON形式でアドバイスを生成してください。
  `.trim();

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return JSON.parse(content);
}

/**
 * Anthropic Claude APIを使用してAI相談を生成
 */
async function generateWithAnthropic(
  input: AIConsultationInput,
  env: Bindings
): Promise<AIReport> {
  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const userMessage = `
【現在の悩み】
${input.currentConcerns}

【生活リズム】
${input.lifestyleRhythm}

【その他気になること】
${input.additionalNotes}

上記の内容を分析し、JSON形式でアドバイスを生成してください。
  `.trim();

  const message = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Anthropic returned non-text response');
  }

  // ClaudeはJSON形式を返すように指示しているが、```json```で囲まれている場合がある
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return JSON.parse(jsonText);
}

/**
 * AI相談レポートを生成（プロバイダーを自動選択）
 */
export async function generateAIConsultation(
  input: AIConsultationInput,
  env: Bindings
): Promise<AIReport> {
  try {
    const provider = env.AI_PROVIDER || 'openai';
    
    // モックモードをチェック（開発用）
    if (provider === 'mock') {
      console.log('Using mock AI mode (no API calls)');
      return generateMockReport(input);
    }
    
    if (provider === 'anthropic') {
      return await generateWithAnthropic(input, env);
    } else {
      return await generateWithOpenAI(input, env);
    }
  } catch (error) {
    console.error('AI consultation error:', error);
    // エラー時はモックデータを返す
    console.log('Falling back to mock response due to error');
    return generateMockReport(input);
  }
}

/**
 * OpenAI APIを使用してコーチングプランを生成
 */
async function generateCoachPlanWithOpenAI(
  logs: any[],
  env: Bindings
): Promise<any> {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const userMessage = `
以下は直近7日間の状態ログです：

${logs.map((log, index) => `
【${index + 1}日前】
- 睡眠時間: ${log.sleep_hours || '未記録'}時間
- 疲労度: ${log.fatigue_level || '未記録'}/10
- 気分: ${log.mood_level || '未記録'}/10
- コリ・痛み: ${log.pain_level || '未記録'}/10
- セルフケア実施: ${log.did_selfcare || 'なし'}
`).join('\n')}

上記のログを分析し、今日のセルフケアメニューをJSON形式で提案してください。
  `.trim();

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return JSON.parse(content);
}

/**
 * Anthropic Claude APIを使用してコーチングプランを生成
 */
async function generateCoachPlanWithAnthropic(
  logs: any[],
  env: Bindings
): Promise<any> {
  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const userMessage = `
以下は直近7日間の状態ログです：

${logs.map((log, index) => `
【${index + 1}日前】
- 睡眠時間: ${log.sleep_hours || '未記録'}時間
- 疲労度: ${log.fatigue_level || '未記録'}/10
- 気分: ${log.mood_level || '未記録'}/10
- コリ・痛み: ${log.pain_level || '未記録'}/10
- セルフケア実施: ${log.did_selfcare || 'なし'}
`).join('\n')}

上記のログを分析し、今日のセルフケアメニューをJSON形式で提案してください。
  `.trim();

  const message = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: COACH_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Anthropic returned non-text response');
  }

  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return JSON.parse(jsonText);
}

/**
 * デイリーコーチングプランを生成（プロバイダーを自動選択）
 */
export async function generateDailyCoachPlan(
  logs: any[],
  env: Bindings
): Promise<any> {
  try {
    const provider = env.AI_PROVIDER || 'openai';
    
    // モックモードをチェック（開発用）
    if (provider === 'mock') {
      console.log('Using mock AI mode (no API calls)');
      return generateMockCoachPlan();
    }
    
    if (provider === 'anthropic') {
      return await generateCoachPlanWithAnthropic(logs, env);
    } else {
      return await generateCoachPlanWithOpenAI(logs, env);
    }
  } catch (error) {
    console.error('Coach plan generation error:', error);
    // エラー時はモックデータを返す
    console.log('Falling back to mock response due to error');
    return generateMockCoachPlan();
  }
}

/**
 * モックレポート生成（開発・エラー時用）
 */
function generateMockReport(input: AIConsultationInput): AIReport {
  return {
    summary: 'あなたの症状から、慢性的な疲労と脳のエネルギー不足が考えられます。自律神経のバランスを整えることが重要です。',
    factors: {
      chronicPain: '長時間のデスクワークによる首肩の筋緊張と血流の低下が考えられます。',
      beauty: '睡眠不足とストレスにより、肌のターンオーバーが乱れている可能性があります。',
      performance: '脳のエネルギー不足により、集中力と作業効率が低下しています。'
    },
    supplements: [
      {
        name: 'BHB（ケトン体）',
        score: 95,
        reason: '脳のエネルギー源として即効性があり、集中力向上に効果的です。',
        expectedEffects: ['脳機能向上', 'メンタルクリア', '持続的エネルギー']
      },
      {
        name: 'マグネシウム',
        score: 88,
        reason: '筋肉の緊張緩和と睡眠の質向上に役立ちます。',
        expectedEffects: ['筋肉リラックス', '睡眠改善', 'ストレス軽減']
      },
      {
        name: 'サイトカイン',
        score: 82,
        reason: '細胞レベルでの回復を促進し、美容面もサポートします。',
        expectedEffects: ['疲労回復', '肌質改善', 'アンチエイジング']
      }
    ],
    selfCare: [
      {
        category: 'brainTraining',
        title: '4-7-8呼吸法',
        description: '4秒吸って7秒止めて8秒吐く。自律神経を整えます。',
        duration: '5分'
      },
      {
        category: 'bodycare',
        title: '首肩ストレッチ',
        description: '1時間ごとに肩を回し、首を左右に傾けます。',
        duration: '3分'
      },
      {
        category: 'lifestyle',
        title: '睡眠環境改善',
        description: '就寝90分前の入浴と寝室の温度調整を行いましょう。'
      }
    ],
    lifestyleImprovements: [
      '1時間ごとに5分の休憩を取り、軽いストレッチを行う',
      '就寝2時間前からブルーライトを避ける',
      '朝食でタンパク質を摂取し、血糖値を安定させる',
      '昼休みに10分間の散歩を取り入れる'
    ],
    mentalSupport: '完璧を目指さず、小さな改善を積み重ねることが大切です。今日できることから始めて、自分を褒めてあげてください。少しずつ体調が整っていくことを感じられるはずです。'
  };
}

/**
 * モックコーチングプラン生成（開発・エラー時用）
 */
function generateMockCoachPlan(): any {
  return {
    feedback: '睡眠時間は良好ですが、疲労度が高めです。今日は軽めのセルフケアを重点的に行いましょう。',
    menu: [
      {
        title: '朝の眼球運動',
        description: '目を上下左右にゆっくり動かし、8の字を描きます。',
        duration: '3分'
      },
      {
        title: '昼休みのストレッチ',
        description: '首肩を中心にゆっくりとほぐします。',
        duration: '5分'
      },
      {
        title: '夕方の呼吸法',
        description: '4-7-8呼吸で自律神経を整えます。',
        duration: '5分'
      }
    ]
  };
}
