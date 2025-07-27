import rateLimit from 'express-rate-limit'
import { config } from '../config/environment.js'

/**
 * Rate limiting geral para todas as rotas
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Rate limiting mais restritivo para autenticação
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})

/**
 * Rate limiting para jogos (compra de raspadinhas)
 */
export const gameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 jogos por minuto por IP
  message: {
    success: false,
    message: 'Muitos jogos em pouco tempo. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Rate limiting para transações financeiras
 */
export const financialLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // 3 transações por 5 minutos
  message: {
    success: false,
    message: 'Muitas transações em pouco tempo. Aguarde alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Rate limiting por usuário autenticado
 */
export function createUserLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    keyGenerator: (req) => {
      // Se usuário autenticado, usar ID do usuário, senão usar IP
      return req.user?.id || req.ip
    },
    standardHeaders: true,
    legacyHeaders: false
  })
}

/**
 * Rate limiting específico para usuário em jogos
 */
export const userGameLimiter = createUserLimiter(
  60 * 1000, // 1 minuto
  20, // 20 jogos por minuto por usuário
  'Você está jogando muito rápido. Aguarde um momento.'
)

/**
 * Rate limiting para saques
 */
export const withdrawLimiter = createUserLimiter(
  24 * 60 * 60 * 1000, // 24 horas
  3, // 3 saques por dia
  'Limite de saques diários atingido. Tente novamente amanhã.'
)