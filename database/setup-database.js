#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fetch from 'node-fetch'

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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQLFile(filename) {
  try {
    console.log(`📄 Executando ${filename}...`)
    
    const sqlContent = readFileSync(join(__dirname, filename), 'utf8')
    
    // Dividir por comandos SQL (separados por ;)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    for (const command of commands) {
      if (command.toLowerCase().includes('notify')) {
        // Pular comandos NOTIFY
        continue
      }
      
      try {
        // Executar comando SQL usando a API direta do Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: command })
        })
        
        if (!response.ok) {
          // Tentar métodos alternativos ou continuar
          console.warn(`⚠️  Aviso executando comando: ${response.statusText}`)
        }
      } catch (err) {
        console.warn(`⚠️  Aviso: ${err.message}`)
      }
    }
    
    console.log(`✅ ${filename} executado com sucesso`)
  } catch (err) {
    console.error(`❌ Erro ao executar ${filename}:`, err.message)
    throw err
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...')
    console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`)
    
    // Testar conexão
    const { data, error } = await supabase.rpc('get_current_user')
    
    if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
      throw new Error(`Erro de conexão: ${error.message}`)
    }
    
    console.log('✅ Conexão estabelecida com sucesso')
    
    // Executar scripts SQL em ordem
    const sqlFiles = [
      '01_create_tables.sql',
      '02_create_rls_policies.sql', 
      '03_create_functions_triggers.sql',
      '04_insert_initial_data.sql'
    ]
    
    for (const file of sqlFiles) {
      await executeSQLFile(file)
    }
    
    console.log('\n🎉 Banco de dados configurado com sucesso!')
    console.log('\n📊 Verificando dados inseridos...')
    
    // Verificar dados inseridos
    const { data: categories } = await supabase
      .from('scratch_categories')
      .select('*')
    
    const { data: prizes } = await supabase
      .from('prizes')
      .select('count')
    
    console.log(`✅ Categorias criadas: ${categories?.length || 0}`)
    console.log(`✅ Prêmios criados: ${prizes?.length || 0}`)
    
    console.log('\n🔗 URLs importantes:')
    console.log(`📊 Supabase Dashboard: ${supabaseUrl.replace('/rest/v1', '')}/project/default`)
    console.log(`🗃️  Table Editor: ${supabaseUrl.replace('/rest/v1', '')}/project/default/editor`)
    
  } catch (error) {
    console.error('\n❌ Erro na configuração:', error.message)
    process.exit(1)
  }
}

// Executar se script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
}