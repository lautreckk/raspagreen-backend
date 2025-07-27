import { body, param, query, validationResult } from 'express-validator'

/**
 * Middleware para processar erros de validação
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    })
  }
  
  next()
}

/**
 * Validações para autenticação
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('full_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  handleValidationErrors
]

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  handleValidationErrors
]

/**
 * Validações para jogos
 */
export const validateScratchSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug inválido'),
  handleValidationErrors
]

/**
 * Validações para carteira
 */
export const validateDepositAmount = [
  body('amount')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Valor deve estar entre R$1 e R$10.000'),
  handleValidationErrors
]

export const validateWithdrawAmount = [
  body('amount')
    .isFloat({ min: 10, max: 50000 })
    .withMessage('Valor deve estar entre R$10 e R$50.000'),
  body('pix_key')
    .trim()
    .notEmpty()
    .withMessage('Chave PIX é obrigatória'),
  handleValidationErrors
]

/**
 * Validações para paginação
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve estar entre 1 e 100'),
  handleValidationErrors
]

/**
 * Validações para admin
 */
export const validateCategoryCreate = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres'),
  body('slug')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug deve conter apenas letras, números e hífens'),
  body('price')
    .isFloat({ min: 0.01, max: 1000 })
    .withMessage('Preço deve estar entre R$0,01 e R$1.000'),
  body('max_reward')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Prêmio máximo deve estar entre R$1 e R$1.000.000'),
  body('rtp_percentage')
    .optional()
    .isInt({ min: 50, max: 95 })
    .withMessage('RTP deve estar entre 50% e 95%'),
  handleValidationErrors
]

export const validatePrizeCreate = [
  body('category_id')
    .isUUID()
    .withMessage('ID da categoria inválido'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('image_url')
    .isURL()
    .withMessage('URL da imagem inválida'),
  body('value')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Valor deve estar entre R$0,01 e R$1.000.000'),
  body('probability_weight')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Peso de probabilidade deve estar entre 1 e 10.000'),
  body('type')
    .isIn(['cash', 'product'])
    .withMessage('Tipo deve ser cash ou product'),
  handleValidationErrors
]