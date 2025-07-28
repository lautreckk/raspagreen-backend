import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config, validateEnvironment } from './config/environment.js'
import { testConnection } from './config/database.js'
import { generalLimiter } from './middleware/rateLimit.middleware.js'
import { logRequest, logError } from './utils/logger.js'
import logger from './utils/logger.js'

// Importar rotas
import authRoutes from './routes/auth.routes.js'
import scratchRoutes from './routes/scratch.routes.js'
import walletRoutes from './routes/wallet.routes.js'

const app = express()

/**
 * Middlewares de segurança e configuração
 */

// Helmet para segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS
const allowedOrigins = [
  config.frontend.url,
  'http://localhost:3000', 
  'http://localhost:5173',
  'https://raspagreen.netlify.app', // Netlify frontend
  'https://raspagreen.com', // Domínio customizado
  // URLs de produção serão adicionadas via variável de ambiente
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
]

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, etc)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // Em desenvolvimento, permitir qualquer origin local
    if (config.nodeEnv === 'development' && origin && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    // Permitir Netlify domains temporariamente
    if (origin && (origin.includes('netlify.app') || origin.includes('raspagreen'))) {
      return callback(null, true)
    }
    
    logger.warn(`CORS bloqueou origin: ${origin}`)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}))

// Parse JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting geral (desabilitado temporariamente para debug)
// app.use(generalLimiter)

// Logging de requisições
app.use(logRequest)

/**
 * Health check avançado
 */
app.get('/health', async (req, res) => {
  const status = global.serverStatus || { started: false, database: 'unknown' }
  
  // Testar conexão com banco em tempo real
  let dbHealth = 'unknown'
  try {
    const dbConnected = await testConnection()
    dbHealth = dbConnected ? 'connected' : 'failed'
  } catch (error) {
    dbHealth = 'error'
  }
  
  res.json({
    success: true,
    message: 'Raspadinha API está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0',
    status: {
      server: status.started ? 'running' : 'starting',
      database: dbHealth,
      uptime: status.startTime ? Math.floor((Date.now() - new Date(status.startTime)) / 1000) : 0
    }
  })
})

/**
 * Debug endpoints
 */
app.get('/api/debug/status', (req, res) => {
  const status = global.serverStatus || {}
  
  res.json({
    success: true,
    data: {
      server: {
        started: status.started || false,
        startTime: status.startTime || null,
        uptime: status.startTime ? Math.floor((Date.now() - new Date(status.startTime)) / 1000) : 0,
        environment: config.nodeEnv,
        port: config.port
      },
      database: {
        status: status.database || 'unknown',
        supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
      },
      frontend: {
        url: config.frontend.url,
        corsAllowed: true
      }
    }
  })
})

app.get('/api/debug/env', (req, res) => {
  res.json({
    success: true,
    data: {
      environment: config.nodeEnv,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      frontendUrl: config.frontend.url,
      // Não expor valores reais das variáveis
      supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 20)}...` : 'NOT_SET'
    }
  })
})

/**
 * Rota de configuração para o frontend
 */
app.get('/api/core', (req, res) => {
  res.json({
    success: true,
    message: 'API Core configurada',
    endpoints: {
      auth: '/api/auth',
      scratch: '/api/scratch', 
      wallet: '/api/wallet'
    },
    version: '1.0.0'
  })
})

/**
 * Rotas de compatibilidade para frontend
 */

// Rota para obter saldo do usuário (com fallback)
app.get('/api/user/balance', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    // Se não tem token, retorna saldo guest
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        success: true,
        data: {
          balance: 0.00,
          currency: 'BRL',
          authenticated: false,
          last_updated: new Date().toISOString()
        }
      })
    }
    
    // Tentar obter saldo real do Supabase
    try {
      const token = authHeader.substring(7)
      const { supabase } = await import('./config/database.js')
      
      // Verificar se Supabase está disponível
      if (!supabase) {
        throw new Error('Supabase não configurado')
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        throw new Error('Token inválido')
      }
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        logger.warn('Erro ao buscar perfil, usando fallback:', profileError.message)
        throw new Error('Profile not found')
      }
      
      return res.json({
        success: true,
        data: {
          balance: parseFloat(profile.wallet_balance) || 0.00,
          currency: 'BRL',
          authenticated: true,
          last_updated: new Date().toISOString()
        }
      })
      
    } catch (dbError) {
      logger.warn('Erro no Supabase, usando fallback:', dbError.message)
      
      // Fallback: retornar saldo mock para usuário autenticado
      return res.json({
        success: true,
        data: {
          balance: 100.00, // Saldo de teste
          currency: 'BRL',
          authenticated: true,
          mockData: true,
          last_updated: new Date().toISOString()
        }
      })
    }
    
  } catch (error) {
    logger.error('Erro ao obter saldo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter saldo'
    })
  }
})

// Rota para informações do usuário (com Supabase e fallback)
app.get('/api/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    // Se não tem token, retorna usuário guest
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        success: true,
        data: {
          id: null,
          email: null,
          name: 'Visitante',
          authenticated: false
        }
      })
    }
    
    // Tentar obter dados reais do Supabase
    try {
      const token = authHeader.substring(7)
      const { supabase } = await import('./config/database.js')
      
      // Verificar se Supabase está disponível
      if (!supabase) {
        throw new Error('Supabase não configurado')
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        throw new Error('Token inválido')
      }
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
          authenticated: true,
          last_login: user.last_sign_in_at
        }
      })
      
    } catch (dbError) {
      logger.warn('Erro no Supabase, usando fallback:', dbError.message)
      
      // Fallback: retornar dados mock para usuário autenticado
      return res.json({
        success: true,
        data: {
          id: 'mock-user-id',
          email: 'mock@example.com',
          name: 'Usuário Mock',
          authenticated: true,
          mockData: true
        }
      })
    }
    
  } catch (error) {
    logger.error('Erro ao obter usuário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do usuário'
    })
  }
})

// Rota para soma/estatísticas (com Supabase e fallback)
app.get('/api/sum', async (req, res) => {
  try {
    // Tentar obter estatísticas reais do Supabase
    try {
      const { supabase } = await import('./config/database.js')
      
      // Verificar se Supabase está disponível
      if (!supabase) {
        throw new Error('Supabase não configurado')
      }
      
      // Buscar estatísticas em paralelo
      const [usersResult, gamesResult, winnersResult] = await Promise.allSettled([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('game_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('game_sessions').select('amount_won').gt('amount_won', 0)
      ])
      
      let totalUsers = 0
      let totalGames = 0
      let totalWinnings = 0.00
      
      if (usersResult.status === 'fulfilled' && usersResult.value.count !== null) {
        totalUsers = usersResult.value.count
      }
      
      if (gamesResult.status === 'fulfilled' && gamesResult.value.count !== null) {
        totalGames = gamesResult.value.count
      }
      
      if (winnersResult.status === 'fulfilled' && winnersResult.value.data) {
        totalWinnings = winnersResult.value.data.reduce((sum, game) => {
          return sum + parseFloat(game.amount_won || 0)
        }, 0)
      }
      
      return res.json({
        success: true,
        data: {
          total_users: totalUsers,
          total_games: totalGames,
          total_winnings: totalWinnings
        }
      })
      
    } catch (dbError) {
      logger.warn('Erro no Supabase, usando fallback:', dbError.message)
      
      // Fallback: retornar dados mock
      return res.json({
        success: true,
        data: {
          total_users: 127,
          total_games: 1543,
          total_winnings: 2847.50,
          mockData: true
        }
      })
    }
    
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    })
  }
})

// Rota para configurações do sistema (com Supabase e fallback)
app.get('/api/cec', async (req, res) => {
  try {
    // Tentar verificar configurações dinâmicas no Supabase
    try {
      const { supabase } = await import('./config/database.js')
      
      // Verificar se Supabase está disponível
      if (!supabase) {
        throw new Error('Supabase não configurado')
      }
      
      // Verificar se categorias estão ativas
      const { data: categories, error: catError } = await supabase
        .from('scratch_categories')
        .select('id, active')
        .eq('active', true)
        .limit(1)
      
      const hasActiveGames = !catError && categories && categories.length > 0
      
      return res.json({
        success: true,
        data: {
          maintenance: false,
          version: '1.0.0',
          features: {
            registration: true,
            games: hasActiveGames,
            withdraw: hasActiveGames
          },
          database: {
            connected: true,
            active_categories: categories?.length || 0
          }
        }
      })
      
    } catch (dbError) {
      logger.warn('Erro no Supabase, usando fallback:', dbError.message)
      
      // Fallback: configurações básicas
      return res.json({
        success: true,
        data: {
          maintenance: false,
          version: '1.0.0',
          features: {
            registration: true,
            games: true,
            withdraw: false // Sem banco, sem saques
          },
          database: {
            connected: false,
            active_categories: 0
          },
          mockData: true
        }
      })
    }
    
  } catch (error) {
    logger.error('Erro ao obter configurações:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações'
    })
  }
})

// Rota para execução/run (compatibilidade)
app.post('/api/run', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Run endpoint disponível',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Erro no endpoint run:', error)
    res.status(500).json({
      success: false,
      message: 'Erro no endpoint run'
    })
  }
})

/**
 * Rotas da API
 */
app.use('/api/auth', authRoutes)
app.use('/api/scratch', scratchRoutes)
app.use('/api/wallet', walletRoutes)

/**
 * Rota raiz
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bem-vindo à API da Raspadinha!',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health'
  })
})

/**
 * Middleware para rotas não encontradas
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  })
})

/**
 * Middleware de tratamento de erros
 */
app.use(logError)
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err)
  
  res.status(err.status || 500).json({
    success: false,
    message: config.nodeEnv === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  })
})

/**
 * Inicialização do servidor
 */
async function startServer() {
  try {
    // Validar variáveis de ambiente (não crítico em desenvolvimento)
    try {
      validateEnvironment()
      logger.info('✅ Variáveis de ambiente validadas')
    } catch (envError) {
      logger.warn('⚠️ Problema com variáveis de ambiente:', envError.message)
      if (config.nodeEnv === 'production') {
        throw envError // Falha crítica em produção
      }
      logger.info('🔄 Continuando em modo de desenvolvimento...')
    }
    
    // Testar conexão com banco (não crítico para inicialização)
    let dbStatus = 'disconnected'
    try {
      const dbConnected = await testConnection()
      dbStatus = dbConnected ? 'connected' : 'failed'
      if (dbConnected) {
        logger.info('✅ Banco de dados conectado')
      } else {
        logger.warn('⚠️ Banco de dados não conectado - rodando em modo limitado')
      }
    } catch (dbError) {
      logger.error('❌ Erro ao conectar com banco:', dbError.message)
      logger.info('🔄 Servidor continuará sem banco de dados...')
    }
    
    // Iniciar servidor SEMPRE (mesmo sem banco)
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Servidor iniciado na porta ${config.port}`)
      logger.info(`🌍 Ambiente: ${config.nodeEnv}`)
      logger.info(`📡 Frontend URL: ${config.frontend.url}`)
      logger.info(`🔗 API URL: http://localhost:${config.port}`)
      logger.info(`❤️  Health Check: http://localhost:${config.port}/health`)
      logger.info(`🗄️ Banco de dados: ${dbStatus}`)
      
      // Status global para monitoramento
      global.serverStatus = {
        started: true,
        database: dbStatus,
        startTime: new Date().toISOString()
      }
    })
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} recebido. Encerrando servidor...`)
      server.close(() => {
        logger.info('Servidor encerrado com sucesso')
        process.exit(0)
      })
      
      // Forçar encerramento após 30 segundos
      setTimeout(() => {
        logger.error('Forçando encerramento do servidor')
        process.exit(1)
      }, 30000)
    }
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}

export default app