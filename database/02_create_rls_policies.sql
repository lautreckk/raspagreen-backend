-- ====================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ====================================

-- Habilitar RLS nas tabelas que precisam de controle de acesso
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ====================================
-- POLÍTICAS PARA USER_PROFILES
-- ====================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_can_view_own_profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Permitir inserção de perfil (criação automática)
CREATE POLICY "users_can_insert_own_profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ====================================
-- POLÍTICAS PARA GAME_SESSIONS
-- ====================================

-- Usuários podem ver apenas seus próprios jogos
CREATE POLICY "users_can_view_own_games" ON game_sessions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Sistema pode inserir jogos para usuários autenticados
CREATE POLICY "authenticated_users_can_insert_games" ON game_sessions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas seus próprios jogos (para marcar como completado)
CREATE POLICY "users_can_update_own_games" ON game_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ====================================
-- POLÍTICAS PARA TRANSACTIONS
-- ====================================

-- Usuários podem ver apenas suas próprias transações
CREATE POLICY "users_can_view_own_transactions" ON transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Sistema pode inserir transações para usuários autenticados
CREATE POLICY "authenticated_users_can_insert_transactions" ON transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar status de suas transações (para pagamentos)
CREATE POLICY "users_can_update_own_transactions" ON transactions
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ====================================
-- POLÍTICAS PARA TABELAS PÚBLICAS
-- ====================================

-- Categorias de raspadinha são públicas (apenas leitura)
CREATE POLICY "public_can_view_active_categories" ON scratch_categories
  FOR SELECT 
  USING (active = true);

-- Prêmios são públicos (apenas leitura) se a categoria estiver ativa
CREATE POLICY "public_can_view_active_prizes" ON prizes
  FOR SELECT 
  USING (
    active = true 
    AND EXISTS (
      SELECT 1 FROM scratch_categories 
      WHERE id = prizes.category_id 
      AND active = true
    )
  );

-- Controle RTP é visível para todos (apenas leitura)
CREATE POLICY "public_can_view_rtp_control" ON rtp_control
  FOR SELECT 
  USING (true);

-- ====================================
-- FUNÇÕES DE SEGURANÇA
-- ====================================

-- Função para verificar se usuário é admin (para futuras funcionalidades)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Por enquanto, retorna false. Implementar lógica de admin depois
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se transação pertence ao usuário
CREATE OR REPLACE FUNCTION user_owns_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = transaction_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- GRANTS E PERMISSÕES
-- ====================================

-- Permitir que usuários autenticados acessem as tabelas
GRANT SELECT ON scratch_categories TO authenticated;
GRANT SELECT ON prizes TO authenticated;
GRANT SELECT ON rtp_control TO authenticated;

GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON game_sessions TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- Permitir acesso a sequências
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';