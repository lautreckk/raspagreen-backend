-- ====================================
-- CRIAÇÃO DAS TABELAS PARA RASPADINHA
-- ====================================

-- 1. Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
  total_spent DECIMAL(10,2) DEFAULT 0.00 CHECK (total_spent >= 0),
  total_won DECIMAL(10,2) DEFAULT 0.00 CHECK (total_won >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de categorias de raspadinha
CREATE TABLE IF NOT EXISTS scratch_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  max_reward DECIMAL(10,2) NOT NULL CHECK (max_reward > 0),
  rtp_percentage INTEGER DEFAULT 85 CHECK (rtp_percentage BETWEEN 50 AND 95),
  active BOOLEAN DEFAULT true,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de prêmios disponíveis
CREATE TABLE IF NOT EXISTS prizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES scratch_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  probability_weight INTEGER DEFAULT 1 CHECK (probability_weight > 0),
  type TEXT CHECK (type IN ('cash', 'product')) DEFAULT 'cash',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de histórico de jogos
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES scratch_categories(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL,
  amount_spent DECIMAL(10,2) NOT NULL CHECK (amount_spent > 0),
  amount_won DECIMAL(10,2) DEFAULT 0.00 CHECK (amount_won >= 0),
  grid_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de controle RTP
CREATE TABLE IF NOT EXISTS rtp_control (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES scratch_categories(id) ON DELETE CASCADE UNIQUE,
  current_rtp DECIMAL(5,2) DEFAULT 0.00 CHECK (current_rtp >= 0),
  total_invested DECIMAL(12,2) DEFAULT 0.00 CHECK (total_invested >= 0),
  total_paid DECIMAL(12,2) DEFAULT 0.00 CHECK (total_paid >= 0),
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('purchase', 'win', 'deposit', 'withdraw')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
  external_id TEXT, -- Para referências de pagamento externo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_scratch_categories_active_slug ON scratch_categories(active, slug);
CREATE INDEX IF NOT EXISTS idx_prizes_category_active ON prizes(category_id, active);
CREATE INDEX IF NOT EXISTS idx_prizes_category_weight ON prizes(category_id, probability_weight);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_created ON game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_category_created ON game_sessions(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rtp_control_category ON rtp_control(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_game_session ON transactions(game_session_id);

-- 8. Comentários nas tabelas
COMMENT ON TABLE user_profiles IS 'Perfis de usuários com dados de carteira';
COMMENT ON TABLE scratch_categories IS 'Categorias de raspadinhas disponíveis';
COMMENT ON TABLE prizes IS 'Prêmios disponíveis para cada categoria';
COMMENT ON TABLE game_sessions IS 'Histórico de jogos realizados';
COMMENT ON TABLE rtp_control IS 'Controle de RTP por categoria';
COMMENT ON TABLE transactions IS 'Histórico de transações financeiras';

-- 9. Comentários nas colunas importantes
COMMENT ON COLUMN user_profiles.wallet_balance IS 'Saldo atual na carteira do usuário';
COMMENT ON COLUMN scratch_categories.rtp_percentage IS 'RTP alvo da categoria (50-95%)';
COMMENT ON COLUMN prizes.probability_weight IS 'Peso para cálculo de probabilidade';
COMMENT ON COLUMN game_sessions.grid_data IS 'Dados do grid 3x3 em formato JSON';
COMMENT ON COLUMN rtp_control.current_rtp IS 'RTP atual calculado da categoria';
COMMENT ON COLUMN transactions.external_id IS 'ID de referência para pagamentos externos';

NOTIFY pgrst, 'reload schema';