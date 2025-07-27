import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  
  // CORS
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Game Configuration
  game: {
    defaultRTP: 85, // 85% RTP padrão
    gridSize: 9, // Grid 3x3
    maxReveals: 3 // Máximo de revelações para finalizar
  },
  
  // Abacatepay (for future implementation)
  abacatepay: {
    apiKey: process.env.ABACATEPAY_API_KEY,
    webhookSecret: process.env.ABACATEPAY_WEBHOOK_SECRET
  }
}

// Validação de variáveis obrigatórias
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
]

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  console.log('✅ Environment variables validated')
}