-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'basic', 'premium')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Diagnosis results table
CREATE TABLE IF NOT EXISTS diagnosis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  answers_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI reports table (for basic plan consultations)
CREATE TABLE IF NOT EXISTS ai_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  input_text TEXT NOT NULL,
  report_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Coach logs table (for premium plan)
CREATE TABLE IF NOT EXISTS coach_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  log_date DATE NOT NULL,
  sleep_hours REAL,
  fatigue_level INTEGER CHECK(fatigue_level BETWEEN 0 AND 10),
  mood_level INTEGER CHECK(mood_level BETWEEN 0 AND 10),
  pain_level INTEGER CHECK(pain_level BETWEEN 0 AND 10),
  did_selfcare TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscriptions table (for future Stripe integration)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('free', 'basic', 'premium')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'cancelled')),
  current_period_start DATETIME,
  current_period_end DATETIME,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Consultation usage tracking (for basic plan limits)
CREATE TABLE IF NOT EXISTS consultation_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_user_id ON diagnosis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_created_at ON diagnosis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_coach_logs_user_id ON coach_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_logs_date ON coach_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_usage_user_month ON consultation_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
