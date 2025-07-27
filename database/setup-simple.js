#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  console.log('Configure o arquivo .env com suas credenciais do Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function createTables() {
  console.log('🏗️  Criando tabelas...')
  
  // 1. User profiles
  const { error: e1 } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        full_name TEXT,
        wallet_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
        total_spent DECIMAL(10,2) DEFAULT 0.00 CHECK (total_spent >= 0),
        total_won DECIMAL(10,2) DEFAULT 0.00 CHECK (total_won >= 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })
  
  // 2. Scratch categories
  const { error: e2 } = await supabase.rpc('exec', {
    sql: `
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
    `
  })
  
  // 3. Prizes
  const { error: e3 } = await supabase.rpc('exec', {
    sql: `
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
    `
  })
  
  // 4. Game sessions
  const { error: e4 } = await supabase.rpc('exec', {
    sql: `
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
    `
  })
  
  // 5. RTP Control
  const { error: e5 } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS rtp_control (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        category_id UUID REFERENCES scratch_categories(id) ON DELETE CASCADE UNIQUE,
        current_rtp DECIMAL(5,2) DEFAULT 0.00 CHECK (current_rtp >= 0),
        total_invested DECIMAL(12,2) DEFAULT 0.00 CHECK (total_invested >= 0),
        total_paid DECIMAL(12,2) DEFAULT 0.00 CHECK (total_paid >= 0),
        last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })
  
  // 6. Transactions
  const { error: e6 } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('purchase', 'win', 'deposit', 'withdraw')) NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        description TEXT,
        game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
        status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
        external_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })
  
  console.log('✅ Tabelas criadas')
}

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...')
    console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`)
    
    await createTables()
    
    console.log('\n🎉 Banco de dados configurado com sucesso!')
    
  } catch (error) {
    console.error('\n❌ Erro na configuração:', error.message)
    process.exit(1)
  }
}

// Executar se script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
}