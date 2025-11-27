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

【セルフケアデータベース】

以下の53個のセルフケアから、ユーザーの状態に最適なものを3-5個選択して提案する：

★カテゴリ①：脳疲労・ブレインフォグ（ID: 1, 2, 3, 4, 5, 46）
1. 前頭葉デフラグタッチ：考えすぎ・思考渋滞・脳圧感 - おでこに面で触れて前頭前野の過活動を低下させ、脳圧と思考のざわつきを鎮めるタッチケア。
2. 乳様突起ドレナージ：頭の重さ・耳詰まり - 耳後ろの乳様突起から鎖骨へ静かに流し、CSF/静脈還流を促し頭のこもりを解消。
3. 眼球ストレッチ：眼精疲労・視覚優位疲労 - 眼球を8方向にゆっくり動かし、外眼筋と視覚中枢をリセット。
4. 頭頂マッサージ：頭がぼんやり・記憶があいまい - 頭頂を優しく円を描くように揉み、前頭-頭頂ネットワークを活性化。
5. 後頭下筋群リリース：後頭部重さ・視覚処理疲労 - 後頭骨と首の境界を指で持続圧迫し、視覚情報過多で緊張した筋を緩める。
46. ボディスキャン瞑想：思考の暴走・身体感覚の希薄化 - 頭から足先へ順に意識を向け、身体感覚を取り戻し前頭前野の過活動を抑制。

★カテゴリ②：不安・ストレス（ID: 6, 7, 8, 9, 10, 47）
6. 4-7-8呼吸法：不安・焦り・交感神経優位 - 4秒吸って7秒止めて8秒吐く。副交感神経を優位にしHRVを改善。
7. 胸骨タッピング：胸の詰まり・息苦しさ - 胸骨を軽くトントンと叩き、胸腺と迷走神経を刺激して安全モードを促進。
8. 迷走神経ハミング：気持ちの落ち着かなさ - 低音で「んー」とハミング。振動が迷走神経を刺激し防衛モードを解除。
9. 耳引っ張り：頭のざわつき・緊張 - 耳たぶを優しく引っ張り回す。迷走神経耳枝を刺激し過覚醒を鎮める。
10. 足裏グラウンディング：頭でっかち・地に足つかない感 - 裸足で床を踏みしめ、足裏感覚を意識。感覚入力で現在に戻る。
47. 5感グラウンディング：パニック・過覚醒 - 5つ見る、4つ触る、3つ聞く、2つ嗅ぐ、1つ味わう。感覚入力で現在に戻り防衛モード解除。

★カテゴリ③：頭痛・首肩こり（ID: 11, 12, 13, 14, 15, 48）
11. 頸部-硬膜リリース呼吸法：緊張型頭痛・首こり - 仰向けで首後ろにクッション、深呼吸で横隔膜が硬膜を牽引し首の緊張を解放。
12. 側頭筋リリース：側頭部の頭痛・噛みしめ - こめかみを円を描くようにゆっくりマッサージし、咬筋と側頭筋の緊張を緩和。
13. 肩甲骨はがし：肩こり・背中の張り - 壁に手をついて体を捻り、肩甲骨周囲の筋膜を剥がし血流改善。
14. 首左右ストレッチ：首筋の張り・可動域制限 - 首をゆっくり左右に倒し、胸鎖乳突筋と斜角筋を伸ばす。
15. 後頭骨-C1調整：後頭部痛・脳幹圧迫感 - 後頭骨を両手で支え、軽く牽引しながら首を動かし、環椎後頭関節を調整。
48. 首温め+冷やし交代浴：慢性首こり・血流不良 - 温タオル3分→冷タオル1分×3セット。血管ポンプで首の血流と筋緊張を改善。

★カテゴリ④：姿勢（ID: 16, 17, 18, 19, 20）
16. 壁立ちリセット：猫背・巻き肩 - 壁に頭・肩・お尻・かかとをつけて2分。脊柱の正しいアライメントを再学習。
17. 骨盤前後傾エクササイズ：反り腰・骨盤後傾 - 四つん這いで骨盤を前後に傾け、腰椎と骨盤の可動性を回復。
18. 胸郭拡張ストレッチ：胸郭の硬さ・呼吸の浅さ - ドアフレームに手をかけて体を前に出し、大胸筋をストレッチして胸郭を開く。
19. 足首回し：足首の硬さ・下肢の循環不良 - 座って足首をゆっくり回し、下腿の筋膜と静脈還流を改善。
20. 体幹ツイスト：脊柱の回旋制限・側屈制限 - 座位で上半身を左右にゆっくり捻り、胸椎の可動性と肋間筋をほぐす。

★カテゴリ⑤：内臓疲労（ID: 21, 22, 23, 24, 25, 51）
21. 腹部温罨法：内臓冷え・消化不良 - 温タオルを腹部に10分置き、内臓血流を増やし副交感神経を活性化。
22. 腸もみマッサージ：便秘・お腹の張り - 時計回りに腹部を優しく揉み、腸の蠕動運動と迷走神経を刺激。
23. 横隔膜ストレッチ：浅い呼吸・みぞおちの硬さ - 深呼吸しながら肋骨の下に手を入れ、横隔膜の可動性を回復。
24. 肝臓温め：だるさ・解毒機能低下 - 右肋骨下に温パッドを15分当て、肝臓の代謝と解毒を促進。
25. 足三里ツボ押し：胃の疲れ・食欲不振 - 膝下外側の足三里を押し、胃経を刺激して消化機能を改善。
51. 食後の右側臥位：消化不良・胃もたれ - 食後15分右向きで横になり、胃の出口(幽門)を下にして消化を促進。

★カテゴリ⑥：美容・ドレナージ（ID: 26, 27, 28, 29, 30, 50）
26. 顔リンパドレナージ：顔のむくみ・くすみ - 額から耳前を通り首へ優しく流し、顔面のリンパと静脈還流を促進。
27. 鎖骨下リンパ流し：上半身のむくみ・首太り - 鎖骨の上下を内から外へ流し、全身リンパの最終出口を開通。
28. 頭皮マッサージ：頭皮の硬さ・顔のたるみ - 指の腹で頭皮を動かし、帽状腱膜の緊張をほぐし顔の引き上げ効果。
29. ふくらはぎポンプ：足のむくみ・冷え - 足首を上下に動かし、ふくらはぎの筋ポンプで下肢の静脈還流を改善。
30. わき腹ストレッチ：ウエストのむくみ・側腹の張り - 両手を上げて体を左右に倒し、わき腹のリンパと筋膜を伸ばす。
50. 逆立ちor脚上げ：下半身むくみ・静脈還流不全 - 壁に脚をもたれかけて5分。重力を利用し下肢の血液・リンパを心臓へ還流。

★カテゴリ⑦：ハイパフォーマンス・集中（ID: 31, 32, 33, 34, 35, 49）
31. パワーブリージング：エネルギー不足・眠気 - 鼻から強く吸って口から勢いよく吐く×10回。交感神経を活性化し覚醒度UP。
32. コールドシャワー：朝のだるさ・やる気不足 - 朝シャワーの最後30秒冷水。ノルアドレナリン分泌とHPA軸を活性化。
33. ポモドーロ+動作：集中力の持続困難 - 25分作業→5分ストレッチを繰り返し、前頭前野の疲労を防ぎ集中を維持。
34. 視線固定トレーニング：注意散漫・視覚ノイズ - 1点を30秒見つめ、視覚注意と前頭眼野を鍛え集中力を強化。
35. バイノーラルビート：作業効率低下・脳波の乱れ - α波やγ波の音源を聴き、脳波を最適化してフロー状態を誘導。
49. ワーキングメモリトレーニング：短期記憶低下・マルチタスク困難 - 数字逆唱やNバック課題で前頭前野を鍛え、ワーキングメモリ容量を拡大。

★カテゴリ⑧：環境デザイン（ID: 36, 37, 38, 39, 40, 52, 53）
36. デスク環境整備：作業効率低下・姿勢悪化 - モニター目線、椅子高さ、照明を調整し、身体負担を減らし集中を保つ。
37. ブルーライトカット：眼精疲労・睡眠障害 - 夜はブルーライトカット眼鏡/設定でメラトニン分泌を保護。
38. アロマディフューズ：ストレス・集中力低下 - ラベンダー(リラックス)・ペパーミント(覚醒)など、嗅覚から脳状態を調整。
39. 自然光浴：体内リズム乱れ・朝の目覚め悪さ - 朝起きたら10分日光を浴び、視交叉上核をリセットしサーカディアンリズムを整える。
40. デジタルデトックス：情報疲労・脳の過覚醒 - 1日1時間スマホOFF。前頭前野を休ませデフォルトモードネットワークを回復。
52. 起床時光療法：冬季うつ・朝の覚醒不良 - 起床後30分以内に10000ルクスの光を浴び、セロトニン分泌と体内時計をリセット。
53. 睡眠環境最適化：睡眠の質低下・中途覚醒 - 室温18-20℃、湿度50-60%、遮光カーテン、静音で深睡眠を最大化。

★カテゴリ⑨：生活習慣（ID: 41, 42, 43, 44, 45）
41. 朝タンパク質：低血糖・午前中の集中力低下 - 起床1時間以内に卵や魚でタンパク質20g。脳のアミノ酸供給と血糖安定化。
42. カフェイン戦略的摂取：カフェイン過多・睡眠障害 - 午後2時以降カフェイン禁止。アデノシン受容体をブロックせず夜の入眠を守る。
43. 就寝90分前入浴：寝つき悪さ・深睡眠不足 - 40℃15分入浴→90分後体温下降で入眠スイッチON、深睡眠が増加。
44. 昼寝20分：午後の眠気・パフォーマンス低下 - 15時前に20分仮眠。ステージ1-2睡眠で前頭前野をリフレッシュし午後の集中を回復。
45. 水分補給ルーティン：脱水・脳機能低下 - 起床時・食前・作業中に各200ml。脳脊髄液と脳血流を維持し認知機能を保つ。

【AIとしてのふるまい方】
- 点数の加算式で機械的に決めないこと
- ユーザーの訴え・生活背景・感情ラインを読んで、ストーリーで捉える
- 提案は「その人のストーリーに沿ったサプリ・セルフケア・生活環境」を組み合わせる
- セルフケアは上記88個のデータベースから、その人の状態に最適なものを3-5個選び、具体的な実施方法を説明する
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
      "title": "セルフケア名（上記データベースから選択）",
      "description": "具体的な実施方法とその人への効果（データベースの内容を元に個別化して説明）"
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
 * ※本番では実際のAI（OpenAI/Anthropic）が新しいプロンプトで動作します
 */
function generateMockReport(input: AIConsultationInput): AIReport {
  // 入力内容から動的にストーリーを生成（簡易版）
  const concerns = input.currentConcerns.toLowerCase();
  const lifestyle = input.lifestyleRhythm.toLowerCase();
  
  // キーワード検出
  const hasShoulderPain = concerns.includes('肩') || concerns.includes('こり');
  const hasSleepIssue = concerns.includes('寝') || concerns.includes('眠');
  const hasFatigue = concerns.includes('疲') || concerns.includes('だるい');
  const isDeskWork = lifestyle.includes('デスク') || lifestyle.includes('座');
  const hasCoffee = input.additionalNotes.toLowerCase().includes('コーヒー');
  
  // ストーリー生成
  let summary = '';
  if (isDeskWork && hasShoulderPain && hasSleepIssue) {
    summary = `長時間のデスクワークにより、頸部・肩甲帯の筋緊張が持続し、それが硬膜を介して脳幹への血流低下を引き起こしています。これが「肩こり」だけでなく、夜間の入眠困難や朝の倦怠感として表れている状態です。さらに${hasCoffee ? 'カフェイン過多がHPA軸（視床下部-下垂体-副腎）を刺激し、' : ''}交感神経の過緊張が続いているため、副交感神経への切り替えが上手くいかず、「寝ても疲れが取れない」という悪循環に陥っています。`;
  } else if (hasFatigue || concerns.includes('やる気') || concerns.includes('ぼーっと')) {
    const isPMS = input.additionalNotes.toLowerCase().includes('生理');
    summary = `慢性的な疲労感とやる気の低下は、単なる「体の疲れ」ではなく、中枢（脳・自律神経）のエネルギー代謝の低下を示唆しています。HPA軸（視床下部-下垂体-副腎）の負荷が続き、コルチゾール分泌のリズムが乱れている可能性があります。${isPMS ? 'さらに生理周期に伴うホルモン変動が自律神経の揺らぎを増幅し、副交感神経のトーン低下（迷走神経機能の減弱）として現れています。' : '午後の「頭がぼーっとする」症状は、脳のエネルギー供給（グルコース・ケトン体）の不足と、ミトコンドリア機能の低下が重なっている状態です。'}`;
  } else {
    summary = 'あなたの状態を中枢神経の視点から見ると、情報過多・環境ストレスによる脳幹のオーバーロードが起点となり、自律神経の調整機能が低下している状態と考えられます。';
  }

  const supplements = [];
  const isPMS = input.additionalNotes.toLowerCase().includes('生理');
  
  if (hasShoulderPain || hasSleepIssue) {
    supplements.push({
      name: 'マグネシウム',
      score: 92,
      reason: `あなたの場合、筋緊張が続くことでマグネシウムの消費が増大しています。マグネシウムはNMDA受容体の調整を通じて中枢過敏化を抑え、同時に筋肉の弛緩と迷走神経のトーン回復を促します。${hasCoffee ? 'コーヒーによるカフェイン摂取もマグネシウム排泄を促進するため、' : ''}特に重要な栄養素です。`
    });
  }
  
  if (hasSleepIssue || hasFatigue || concerns.includes('やる気') || concerns.includes('ぼーっと')) {
    supplements.push({
      name: '5-ALA（5-アミノレブリン酸）',
      score: 90,
      reason: `${hasSleepIssue ? '睡眠の質の低下と朝の倦怠感' : '慢性的な疲労感と午後の集中力低下'}から、ミトコンドリアのATP産生効率が落ちていると推測されます。5-ALAはミトコンドリア機能を直接サポートし、脳のエネルギー代謝を底上げします。特に「脳の電池切れ」状態には効果的です。${isPMS ? '生理周期に伴うエネルギー変動の振れ幅を小さくする効果も期待できます。' : ''}`
    });
  }
  
  if (isPMS) {
    supplements.push({
      name: 'マグネシウム',
      score: 88,
      reason: '生理前の不調（PMS）は、エストロゲン・プロゲステロンの変動が自律神経とHPA軸に直接影響している状態です。マグネシウムはGABA受容体を介して情緒安定に寄与し、Ca/Mgバランスを整えることで生理前の自律神経の揺らぎを緩和します。'
    });
  }
  
  if (isDeskWork && (hasFatigue || hasShoulderPain)) {
    supplements.push({
      name: 'サイトカイン',
      score: 85,
      reason: 'デスクワークによる姿勢負担は、単なる筋肉疲労ではなく、ファシア（筋膜）レベルでの癒着・硬化を引き起こします。サイトカインは細胞レベルでの修復を促し、ファシアの粘弾性回復をサポートします。'
    });
  }
  
  if (hasFatigue && !hasShoulderPain) {
    supplements.push({
      name: 'CoQ10',
      score: 86,
      reason: '副交感神経の低下（迷走神経トーンの減弱）により、細胞レベルでのエネルギー産生が滞っている可能性があります。CoQ10はミトコンドリアの電子伝達系を直接サポートし、持続的なエネルギー供給を可能にします。'
    });
  }

  const selfCare = [];
  
  // セルフケアデータベース(新53個)から状況に応じて選択
  if (hasShoulderPain && isDeskWork) {
    selfCare.push({
      title: '頸部-硬膜リリース呼吸法',
      description: '仰向けで首後ろにクッション、深呼吸で横隔膜が硬膜を牽引し首の緊張を解放。デスクワークによる緊張型頭痛・首こりに効果的です。1時間おきに実施すると脳幹への血流が改善します。'
    });
    selfCare.push({
      title: '肩甲骨はがし',
      description: '壁に手をついて体を捻り、肩甲骨周囲の筋膜を剥がし血流改善。巻き肩・猫背・肩こりの改善に直結し、首への負担を軽減します。'
    });
  }
  
  if (hasSleepIssue) {
    selfCare.push({
      title: '4-7-8呼吸法',
      description: '4秒吸って7秒止めて8秒吐く。副交感神経を優位にしHRVを改善。就寝前に実施することで、交感神経優位の「防衛モード」から「安全モード」へ切り替わり、入眠の質が劇的に改善します。'
    });
    selfCare.push({
      title: 'ブルーライトカット',
      description: '夜はブルーライトカット眼鏡/設定でメラトニン分泌を保護。19時以降はナイトモード＋画面輝度40％以下で脳が"夜モード"に入るのを助け、睡眠の質を根本から改善します。'
    });
    selfCare.push({
      title: '就寝90分前入浴',
      description: '40℃15分入浴→90分後体温下降で入眠スイッチON、深睡眠が増加。体内時計をリセットし、夜間の睡眠の質を高めます。'
    });
  }
  
  if (hasFatigue || concerns.includes('やる気') || concerns.includes('ぼーっと')) {
    selfCare.push({
      title: '自然光浴',
      description: `朝起きたら10分日光を浴び、視交叉上核をリセットしサーカディアンリズムを整える。${hasCoffee ? 'カフェインに頼る前に' : ''}体内時計をリセットすることで、HPA軸の負担を軽減し、コルチゾール分泌のリズムを正常化します。日中の集中力と夜の眠気を整えます。`
    });
    selfCare.push({
      title: 'ボディスキャン瞑想',
      description: '頭から足先へ順に意識を向け、身体感覚を取り戻し前頭前野の過活動を抑制。思考の暴走・過集中による脳疲労を鎮め、午後の「頭がぼーっとする」状態を予防します。'
    });
    selfCare.push({
      title: 'コールドシャワー',
      description: '朝シャワーの最後30秒冷水。ノルアドレナリン分泌とHPA軸を活性化し、朝のだるさ・やる気不足を改善します。'
    });
  }

  if (isDeskWork) {
    selfCare.push({
      title: 'デスク環境整備',
      description: 'モニター目線、椅子高さ、照明を調整し、身体負担を減らし集中を保つ。前のめり姿勢による頸部・肩甲帯の筋緊張を根本から予防し、硬膜-脳幹への負荷を軽減します。眼精疲労・頭痛・集中切れを防ぎます。'
    });
    selfCare.push({
      title: 'ポモドーロ+動作',
      description: '25分作業→5分ストレッチを繰り返し、前頭前野の疲労を防ぎ集中を維持。デスクワーク中の集中力持続に必須の習慣です。'
    });
  }
  
  if (hasCoffee) {
    selfCare.push({
      title: 'カフェイン戦略的摂取',
      description: '午後2時以降カフェイン禁止。アデノシン受容体をブロックせず夜の入眠を守る。カフェインの半減期は5-6時間のため、夕方以降の摂取は睡眠の質を著しく低下させ、翌朝の倦怠感につながります。'
    });
  }
  
  if (isPMS) {
    selfCare.push({
      title: '腹部温罨法',
      description: '温タオルを腹部に10分置き、内臓血流を増やし副交感神経を活性化。生理前の内臓冷え・消化不良に効果的です。'
    });
    selfCare.push({
      title: '腸もみマッサージ',
      description: '時計回りに腹部を優しく揉み、腸の蠕動運動と迷走神経を刺激。生理前の便秘・お腹の張り・不安に効果的です。'
    });
  }

  return {
    summary,
    supplements,
    selfCare
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
