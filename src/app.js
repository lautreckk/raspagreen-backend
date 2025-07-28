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
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parse JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting geral
app.use(generalLimiter)

// Logging de requisições
app.use(logRequest)

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Raspadinha API está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
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
    // Validar variáveis de ambiente
    validateEnvironment()
    
    // Testar conexão com banco
    const dbConnected = await testConnection()
    if (!dbConnected) {
      throw new Error('Falha na conexão com o banco de dados')
    }
    
    // Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Servidor iniciado na porta ${config.port}`)
      logger.info(`🌍 Ambiente: ${config.nodeEnv}`)
      logger.info(`📡 Frontend URL: ${config.frontend.url}`)
      logger.info(`🔗 API URL: http://localhost:${config.port}`)
      logger.info(`❤️  Health Check: http://localhost:${config.port}/health`)
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