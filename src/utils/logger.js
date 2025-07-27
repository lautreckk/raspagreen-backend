import winston from 'winston'
import { config } from '../config/environment.js'

const { combine, timestamp, errors, json, simple, colorize } = winston.format

// Configuração dos logs
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    // Log de erros em arquivo
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // Log geral em arquivo
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
})

// Se não estiver em produção, também logar no console
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      simple()
    )
  }))
}

// Middlewares de log para Express
export const logRequest = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  })
  next()
}

export const logError = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  })
  next(err)
}

export default logger