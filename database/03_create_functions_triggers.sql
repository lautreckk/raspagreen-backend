-- ====================================
-- FUNCTIONS E TRIGGERS
-- ====================================

-- ====================================
-- FUNÇÃO PARA ATUALIZAR SALDO DA CARTEIRA
-- ====================================
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processar se a transação estiver completa
  IF NEW.status = 'completed' THEN
    -- Tipos que adicionam saldo
    IF NEW.type IN ('win', 'deposit') THEN
      UPDATE user_profiles 
      SET 
        wallet_balance = wallet_balance + NEW.amount,
        total_won = CASE 
          WHEN NEW.type = 'win' THEN total_won + NEW.amount 
          ELSE total_won 
        END,
        updated_at = NOW()
      WHERE id = NEW.user_id;
      
    -- Tipos que removem saldo
    ELSIF NEW.type IN ('purchase', 'withdraw') THEN
      UPDATE user_profiles 
      SET 
        wallet_balance = wallet_balance - NEW.amount,
        total_spent = CASE 
          WHEN NEW.type = 'purchase' THEN total_spent + NEW.amount 
          ELSE total_spent 
        END,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- TRIGGER PARA ATUALIZAR SALDO AUTOMATICAMENTE
-- ====================================
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- ====================================
-- FUNÇÃO PARA ATUALIZAR RTP
-- ====================================
CREATE OR REPLACE FUNCTION update_rtp_control()
RETURNS TRIGGER AS $$
DECLARE
  new_total_invested DECIMAL(12,2);
  new_total_paid DECIMAL(12,2);
  new_rtp DECIMAL(5,2);
BEGIN
  -- Inserir ou atualizar controle RTP
  INSERT INTO rtp_control (category_id, total_invested, total_paid, current_rtp)
  VALUES (NEW.category_id, NEW.amount_spent, NEW.amount_won, 
    CASE 
      WHEN NEW.amount_spent > 0 THEN (NEW.amount_won / NEW.amount_spent) * 100
      ELSE 0 
    END)
  ON CONFLICT (category_id) 
  DO UPDATE SET
    total_invested = rtp_control.total_invested + NEW.amount_spent,
    total_paid = rtp_control.total_paid + NEW.amount_won,
    current_rtp = CASE 
      WHEN (rtp_control.total_invested + NEW.amount_spent) > 0 
      THEN ((rtp_control.total_paid + NEW.amount_won) / (rtp_control.total_invested + NEW.amount_spent)) * 100
      ELSE 0 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- TRIGGER PARA ATUALIZAR RTP
-- ====================================
DROP TRIGGER IF EXISTS trigger_update_rtp ON game_sessions;
CREATE TRIGGER trigger_update_rtp
  AFTER INSERT ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_rtp_control();

-- ====================================
-- FUNÇÃO PARA ATUALIZAR TIMESTAMPS
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- TRIGGERS PARA UPDATED_AT
-- ====================================
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_scratch_categories_updated_at ON scratch_categories;
CREATE TRIGGER trigger_update_scratch_categories_updated_at
  BEFORE UPDATE ON scratch_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_prizes_updated_at ON prizes;
CREATE TRIGGER trigger_update_prizes_updated_at
  BEFORE UPDATE ON prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_rtp_control_updated_at ON rtp_control;
CREATE TRIGGER trigger_update_rtp_control_updated_at
  BEFORE UPDATE ON rtp_control
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- FUNÇÃO PARA VALIDAR SALDO SUFICIENTE
-- ====================================
CREATE OR REPLACE FUNCTION check_sufficient_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Só verificar para transações que removem saldo
  IF NEW.type IN ('purchase', 'withdraw') AND NEW.status = 'completed' THEN
    SELECT wallet_balance INTO current_balance
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    IF current_balance < NEW.amount THEN
      RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Valor solicitado: %', 
        current_balance, NEW.amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- TRIGGER PARA VERIFICAR SALDO
-- ====================================
DROP TRIGGER IF EXISTS trigger_check_sufficient_balance ON transactions;
CREATE TRIGGER trigger_check_sufficient_balance
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_sufficient_balance();

-- ====================================
-- FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ====================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- TRIGGER PARA CRIAR PERFIL NA CRIAÇÃO DO USUÁRIO
-- ====================================
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ====================================
-- FUNÇÃO PARA OBTER DADOS COMPLETOS DE JOGO
-- ====================================
CREATE OR REPLACE FUNCTION get_game_with_details(game_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT to_json(game_data) INTO result
  FROM (
    SELECT 
      gs.*,
      sc.name as category_name,
      sc.slug as category_slug,
      p.name as prize_name,
      p.image_url as prize_image,
      p.value as prize_value,
      p.type as prize_type
    FROM game_sessions gs
    JOIN scratch_categories sc ON gs.category_id = sc.id
    LEFT JOIN prizes p ON gs.prize_id = p.id
    WHERE gs.id = game_id
      AND gs.user_id = auth.uid()
  ) game_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- FUNÇÃO PARA ESTATÍSTICAS DO USUÁRIO
-- ====================================
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT to_json(stats) INTO result
  FROM (
    SELECT 
      up.wallet_balance,
      up.total_spent,
      up.total_won,
      (up.total_won - up.total_spent) as net_result,
      COUNT(gs.id) as total_games,
      COUNT(gs.prize_id) as total_wins,
      CASE 
        WHEN COUNT(gs.id) > 0 
        THEN ROUND((COUNT(gs.prize_id)::decimal / COUNT(gs.id)) * 100, 2)
        ELSE 0 
      END as win_percentage
    FROM user_profiles up
    LEFT JOIN game_sessions gs ON up.id = gs.user_id
    WHERE up.id = user_uuid
    GROUP BY up.id, up.wallet_balance, up.total_spent, up.total_won
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';