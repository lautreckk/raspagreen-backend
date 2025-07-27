import { Router } from 'express'
import { body } from 'express-validator'
import { AuthController } from '../controllers/auth.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { authLimiter } from '../middleware/rateLimit.middleware.js'
import { 
  validateRegister, 
  validateLogin,
  handleValidationErrors 
} from '../middleware/validation.middleware.js'

const router = Router()
const authController = new AuthController()

/**
 * Rotas públicas (sem autenticação)
 */

// POST /auth/register - Registrar usuário
router.post('/register', 
  authLimiter,
  validateRegister,
  authController.register.bind(authController)
)

// POST /auth/login - Login
router.post('/login', 
  authLimiter,
  validateLogin,
  authController.login.bind(authController)
)

// POST /auth/logout - Logout
router.post('/logout', 
  authController.logout.bind(authController)
)

// POST /auth/request-password-reset - Solicitar reset de senha
router.post('/request-password-reset',
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    handleValidationErrors
  ],
  authController.requestPasswordReset.bind(authController)
)

// POST /auth/confirm-password-reset - Confirmar reset de senha
router.post('/confirm-password-reset',
  authLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Token é obrigatório'),
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
    handleValidationErrors
  ],
  authController.confirmPasswordReset.bind(authController)
)

/**
 * Rotas protegidas (requerem autenticação)
 */

// GET /auth/profile - Obter perfil
router.get('/profile', 
  verifyToken,
  authController.getProfile.bind(authController)
)

// PUT /auth/profile - Atualizar perfil
router.put('/profile', 
  verifyToken,
  [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Nome deve ter pelo menos 2 caracteres'),
    handleValidationErrors
  ],
  authController.updateProfile.bind(authController)
)

// GET /auth/stats - Obter estatísticas do usuário
router.get('/stats', 
  verifyToken,
  authController.getUserStats.bind(authController)
)

// GET /auth/check - Verificar se está autenticado
router.get('/check', 
  verifyToken,
  authController.checkAuth.bind(authController)
)

export default router