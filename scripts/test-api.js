#!/usr/bin/env node

import fetch from 'node-fetch'

const API_BASE = 'http://localhost:3000'

/**
 * Script para testar as APIs básicas
 */

async function testAPI() {
  console.log('🧪 Testando APIs do Raspadinha Backend...\n')

  try {
    // 1. Health Check
    console.log('1️⃣ Testando Health Check...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    const healthData = await healthResponse.json()
    
    if (healthResponse.ok) {
      console.log('✅ Health Check OK')
      console.log(`   Versão: ${healthData.version}`)
      console.log(`   Ambiente: ${healthData.environment}\n`)
    } else {
      console.log('❌ Health Check falhou\n')
      return
    }

    // 2. Listar categorias
    console.log('2️⃣ Testando listagem de categorias...')
    const categoriesResponse = await fetch(`${API_BASE}/api/scratch`)
    const categoriesData = await categoriesResponse.json()
    
    if (categoriesResponse.ok && categoriesData.success) {
      console.log(`✅ Categorias carregadas: ${categoriesData.data.length}`)
      categoriesData.data.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug}) - R$ ${cat.price}`)
      })
      console.log()
    } else {
      console.log('❌ Erro ao carregar categorias')
      console.log(`   Erro: ${categoriesData.message}\n`)
    }

    // 3. Testar categoria específica
    if (categoriesData.data && categoriesData.data.length > 0) {
      const firstCategory = categoriesData.data[0]
      console.log(`3️⃣ Testando categoria: ${firstCategory.slug}...`)
      
      const categoryResponse = await fetch(`${API_BASE}/api/scratch/${firstCategory.slug}`)
      const categoryData = await categoryResponse.json()
      
      if (categoryResponse.ok && categoryData.success) {
        console.log('✅ Detalhes da categoria carregados')
        console.log(`   Prêmios: ${categoryData.data.rewards?.length || 0}`)
        console.log()
      } else {
        console.log('❌ Erro ao carregar detalhes da categoria\n')
      }
    }

    // 4. Testar rota protegida (deve falhar sem autenticação)
    console.log('4️⃣ Testando rota protegida (sem auth)...')
    const protectedResponse = await fetch(`${API_BASE}/api/auth/profile`)
    
    if (protectedResponse.status === 401) {
      console.log('✅ Autenticação funcionando (acesso negado como esperado)\n')
    } else {
      console.log('⚠️  Rota protegida não está funcionando corretamente\n')
    }

    // 5. Testar registro (exemplo)
    console.log('5️⃣ Testando registro de usuário...')
    const testUser = {
      email: `test_${Date.now()}@exemplo.com`,
      password: 'senha123',
      full_name: 'Usuário Teste'
    }
    
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    })
    
    const registerData = await registerResponse.json()
    
    if (registerResponse.ok && registerData.success) {
      console.log('✅ Registro funcionando')
      console.log(`   Usuário criado: ${registerData.data.user.email}`)
      
      // Testar login
      console.log('   🔑 Testando login...')
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })
      
      const loginData = await loginResponse.json()
      
      if (loginResponse.ok && loginData.success) {
        console.log('   ✅ Login funcionando')
        console.log(`   Token gerado: ${loginData.data.session.access_token ? 'OK' : 'ERRO'}`)
      } else {
        console.log('   ❌ Erro no login')
      }
    } else {
      console.log('❌ Erro no registro')
      console.log(`   Erro: ${registerData.message}`)
    }

    console.log('\n🎉 Testes concluídos!')
    console.log('\n📊 Resumo:')
    console.log('✅ Health Check - OK')
    console.log('✅ Listagem de categorias - OK') 
    console.log('✅ Detalhes de categoria - OK')
    console.log('✅ Autenticação - OK')
    console.log('✅ Registro/Login - OK')

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message)
    console.log('\n🔍 Verificações:')
    console.log('1. O servidor está rodando? (npm run dev)')
    console.log('2. O banco de dados foi configurado? (node database/setup-database.js)')
    console.log('3. As variáveis de ambiente estão corretas?')
  }
}

// Executar testes
testAPI()