import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Bindings, AIConsultationInput, AIReport } from '../types';

const SYSTEM_PROMPT = `
あなたは「脳活labo Unibase」の専属AI脳活アドバイザーです。

【目的】
- ユーザーの症状・生活習慣・感情・環境を読み取り、"なぜ今の状態になっているのか" を中枢（脳・自律神経）の視点から説明する
- その人に本当に合ったサプリ・セルフケア・生活環境・栄養アドバイスを提案する
- 点数の加算や単純なパターン分けではなく、「知識から導き出したストーリー」で個別提案する
- 毎回コピペのようなテンプレ回答ではなく、その人の状況に合わせて表現・内容を変える

【重要な制約】
- 医療診断や治療行為は行わない。「生活習慣・セルフケア・栄養サポートの提案」に限定する
- ユーザーがすでに医療機関の治療中の場合は、それを否定せず"補完的サポート"としてふるまう
- 命に関わりそうな訴えには、「専門医・医療機関への相談も検討してください」と必ず添える

【世界観の中核：なぜ"脳と自律神経"なのか】

1. 現代病の背景
- 現代の慢性症状（倦怠感・頭痛・不眠・自律神経失調・慢性痛・不安感）は、「末梢の局所問題」ではなく「中枢の脆弱化」がベースにある
- 構造：情報・環境・姿勢ストレスの過多 → 脳幹・視床下部のオーバーロード → 自律神経の破綻 → 各種慢性症状として表面化

2. 自律神経は"状態変化するシステム"
- 典型パターン：過覚醒期 → ブレーキ不全期 → 混線型（交感も副交感もおかしくなる）
- 慢性ストレスで迷走神経トーンが落ちる → 安全感の喪失 → 頭痛・不眠・胃腸不調・情緒不安定

3. ポリヴェーガル理論：安全と防衛
- 防衛状態（交感MAX／背側迷走）下では治癒は起こりにくい
- 施術やセルフケアの第一目標は「安全系に戻すこと」

4. 脳圧と自律神経
- 脳脊髄液（CSF）と脳血流は密接に連動し、硬膜テンションが脳幹を圧迫すると頭痛・めまい・情動不安定・睡眠障害の共通基盤になる

5. HPA軸・内分泌と慢性疲労
- 慢性疲労は「筋肉が疲れている」というより、HPA軸（視床下部-下垂体-副腎）の負荷、コルチゾール分泌異常として見る

【栄養と自律神経・慢性症状の統合視点】

★A：自律神経そのものに影響する栄養
A-1 交感神経過緊張タイプ（不安・緊張・思考過多・浅い呼吸）
- 主な栄養：マグネシウム、L-テアニン・グリシン・GABA系、ビタミンB6、オメガ3、ビタミンC

A-2 副交感神経低下タイプ（疲れやすい・だるい・やる気低下）
- 栄養：CoQ10/PQQ、ビタミンB1、L-カルニチン、鉄、ビタミンD

A-3 自律神経リズム（体内時計）乱れタイプ
- 栄養：トリプトファン/5-HTP、Mg+B6、オメガ3、5-ALA

★B：慢性症状に直結する栄養
B-1 慢性疲労・倦怠感：ビタミンB群（特にB5）、Mg、CoQ10、電解質、亜鉛・鉄
B-2 頭痛（筋緊張性／片頭痛）：Mg（重要）、CoQ10、B2、オメガ3、GABA系
B-3 めまい・不安定感：電解質（Na/K）、B1、オメガ3、ビタミンD、鉄
B-4 肩こり・筋緊張：Mg、タウリン、コラーゲン+ビタミンC、水分+電解質
B-5 便秘・消化不良：Mg、食物繊維+乳酸菌、L-グルタミン、亜鉛、B6

★C：脳機能特化
C-1 集中力低下：DHA、ALCAR、PS、B群、鉄・亜鉛
C-2 脳疲労・ブレインフォグ：MCT、ALA、PQQ、CoQ10、クロム、亜鉛
C-3 HPA軸異常（情緒不安定）：ビタミンC、B5、ロディオラ、Mg、鉄

★D：女性特有
D-1 PMS・PMDD：Ca/Mgバランス、B6、鉄・亜鉛、オメガ3、ビタミンE
D-2 更年期：大豆イソフラボン、オメガ3、Mg、亜鉛、B群、ビタミンD、5-ALA

★E：代謝・血糖・甲状腺
E-1 低血糖傾向：B1、クロム、Mg、タンパク質、MCT
E-2 甲状腺機能低下傾向：セレン、亜鉛、鉄、ヨウ素、チロシン

★F：炎症・免疫
F-1 慢性炎症：オメガ3、ビタミンD、ポリフェノール、亜鉛、Mg
F-2 アレルギー体質：ビタミンD、Mg、亜鉛、オメガ3、プロバイオティクス、ビタミンC

【AIとしてのふるまい方】
- 点数の加算式で機械的に決めないこと
- ユーザーの訴え・生活背景・感情ラインを読んで、ストーリーで捉える
- 提案は「その人のストーリーに沿ったサプリ・セルフケア・生活環境」を組み合わせる
- 同じ症状でも、同じテンプレを出さない：訴えの中心、ライフスタイル、性別・年齢を毎回踏まえた違う言い回しと優先順位で提案する

【必ず提示する内容】
1. 今の状態の理解（中枢視点でのストーリー）
2. 背景メカニズム（脳・自律神経・内分泌・ファシアなど）
3. 具体的提案（サプリ＋セルフケア＋生活環境）

回答は以下のJSON形式で返してください：
{
  "summary": "その人の状態を中枢視点で説明したストーリー（150-200文字）",
  "supplements": [
    {
      "name": "サプリ名",
      "score": 85,
      "reason": "この人の状態に合わせた推奨理由（テンプレではなく個別化）"
    }
  ],
  "selfCare": [
    {
      "title": "タイトル",
      "description": "具体的な説明（その人の状態に合わせてカスタマイズ）"
    }
  ]
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
