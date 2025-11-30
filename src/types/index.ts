// Cloudflare bindings types
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  AI_PROVIDER: 'openai' | 'anthropic' | 'mock';
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  GOOGLE_SERVICE_ACCOUNT_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
}

// User types
export type User = {
  id: number;
  email: string;
  plan: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
}

export type UserWithPassword = User & {
  password_hash: string;
}

// Auth types
export type JWTPayload = {
  userId: number;
  email: string;
  plan: string;
}

// Diagnosis types
export type DiagnosisAnswers = {
  ageGroup: string;
  gender: string;
  mainConcerns: string[];
  chronicPain: {
    neckShoulder: number;
    headache: number;
    lowerBack: number;
    upperBack: number;
  };
  brainFatigue: {
    sleepOnset: number;
    nightWaking: number;
    morningFatigue: number;
    concentration: number;
  };
  beauty: {
    swelling: number;
    skinDullness: number;
    faceLine: number;
  };
  lifestyle: {
    mealFrequency: number;
    exerciseAmount: number;
    caffeine: number;
    alcohol: number;
    screenTime: number;
  };
  mental: {
    stressLevel: number;
    moodSwings: number;
    anxietyIrritability: number;
  };
}

export type SupplementRecommendation = {
  name: string;
  score: number;
  reason: string;
  expectedEffects: string[];
  purchaseLink?: string;
}

export type SelfCareRecommendation = {
  category: 'brainTraining' | 'bodycare' | 'lifestyle';
  title: string;
  description: string;
  duration?: string;
}

export type DiagnosisResult = {
  supplements: SupplementRecommendation[];
  selfCare: SelfCareRecommendation[];
  summary: string;
}

// AI Report types
export type AIConsultationInput = {
  currentConcerns: string;
  lifestyleRhythm: string;
  additionalNotes: string;
}

export type AIReport = {
  summary: string;
  factors: {
    chronicPain?: string;
    beauty?: string;
    performance?: string;
  };
  supplements: SupplementRecommendation[];
  selfCare: SelfCareRecommendation[];
  lifestyleImprovements: string[];
  mentalSupport: string;
}

// Coach log types
export type CoachLog = {
  id?: number;
  user_id: number;
  log_date: string;
  sleep_hours?: number;
  fatigue_level?: number;
  mood_level?: number;
  pain_level?: number;
  did_selfcare?: string;
  created_at?: string;
}

export type DailyPlan = {
  feedback: string;
  menu: {
    title: string;
    description: string;
    duration: string;
  }[];
}
