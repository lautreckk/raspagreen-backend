import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente principal com service role para operações administrativas
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cliente público para operações de usuário
export const supabasePublic = createClient(
  supabaseUrl, 
  process.env.SUPABASE_ANON_KEY
)

// Função para verificar conexão com o banco
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('scratch_categories')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Erro na conexão com Supabase:', error)
      return false
    }
    
    console.log('✅ Conexão com Supabase estabelecida')
    return true
  } catch (err) {
    console.error('❌ Erro ao conectar com Supabase:', err)
    return false
  }
}