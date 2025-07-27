#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🚀 Configurando projeto Raspadinha Backend...\n')

try {
  // 1. Verificar se .env existe
  const envPath = join(projectRoot, '.env')
  if (!existsSync(envPath)) {
    console.log('⚠️  Arquivo .env não encontrado!')
    console.log('📝 Copie o arquivo .env.example para .env e configure suas credenciais do Supabase')
    console.log('🔗 Como obter credenciais: https://supabase.com/dashboard\n')
    
    try {
      execSync('cp .env.example .env', { cwd: projectRoot })
      console.log('✅ Arquivo .env criado a partir do .env.example')
      console.log('⚠️  Configure suas credenciais do Supabase no arquivo .env\n')
    } catch (error) {
      console.log('❌ Erro ao criar .env. Copie manualmente o .env.example\n')
    }
  } else {
    console.log('✅ Arquivo .env encontrado\n')
  }

  // 2. Instalar dependências
  console.log('📦 Instalando dependências...')
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' })
  console.log('✅ Dependências instaladas\n')

  // 3. Verificar estrutura de pastas
  console.log('📁 Verificando estrutura de pastas...')
  const dirs = ['logs', 'src/controllers', 'src/services', 'src/middleware', 'src/routes', 'src/utils', 'src/config', 'database']
  
  dirs.forEach(dir => {
    const dirPath = join(projectRoot, dir)
    if (existsSync(dirPath)) {
      console.log(`✅ ${dir}/`)
    } else {
      console.log(`❌ ${dir}/ - FALTANDO`)
    }
  })
  console.log()

  // 4. Verificar arquivos principais
  console.log('📄 Verificando arquivos principais...')
  const files = [
    'src/app.js',
    'database/setup-database.js',
    'package.json',
    '.env.example'
  ]
  
  files.forEach(file => {
    const filePath = join(projectRoot, file)
    if (existsSync(filePath)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} - FALTANDO`)
    }
  })
  console.log()

  // 5. Instruções finais
  console.log('🎯 Próximos passos:')
  console.log('1. Configure suas credenciais do Supabase no arquivo .env')
  console.log('2. Execute: node database/setup-database.js')
  console.log('3. Execute: npm run dev')
  console.log('4. Acesse: http://localhost:3000/health\n')

  console.log('📚 Documentação:')
  console.log('- README.md - Documentação completa')
  console.log('- database/README.md - Documentação do banco de dados\n')

  console.log('✨ Setup concluído com sucesso!')

} catch (error) {
  console.error('❌ Erro durante o setup:', error.message)
  process.exit(1)
}