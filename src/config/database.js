import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Exportar clientes apenas se variáveis estão disponíveis
let supabase = null
let supabasePublic = null

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  if (process.env.SUPABASE_ANON_KEY) {
    supabasePublic = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY)
  }
} else {
  console.warn('⚠️ Variáveis do Supabase não configuradas - rodando sem banco')
}

// Exportar clientes (podem ser null)
export { supabase, supabasePublic }

// Função para verificar conexão com o banco
export async function testConnection() {
  try {
    // Se não há cliente configurado, retorna false
    if (!supabase) {
      console.warn('⚠️ Cliente Supabase não configurado')
      return false
    }
    
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