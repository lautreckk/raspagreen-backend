import { Router } from 'express'
import { ScratchController } from '../controllers/scratch.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { gameLimiter, userGameLimiter } from '../middleware/rateLimit.middleware.js'
import { 
  validateScratchSlug,
  validatePagination,
  handleValidationErrors 
} from '../middleware/validation.middleware.js'
import { param } from 'express-validator'

const router = Router()
const scratchController = new ScratchController()

/**
 * Rotas públicas (sem autenticação)
 */

// GET /scratch - Listar todas as categorias
router.get('/', 
  scratchController.getCategories.bind(scratchController)
)

// GET /scratch/:slug - Obter detalhes de uma categoria
router.get('/:slug', 
  validateScratchSlug,
  scratchController.getCategoryBySlug.bind(scratchController)
)

// GET /scratch/:slug/rewards - Obter prêmios de uma categoria
router.get('/:slug/rewards', 
  validateScratchSlug,
  scratchController.getCategoryRewards.bind(scratchController)
)

// GET /scratch/:slug/stats - Obter estatísticas de uma categoria
router.get('/:slug/stats', 
  validateScratchSlug,
  scratchController.getCategoryStats.bind(scratchController)
)

/**
 * Rotas protegidas (requerem autenticação)
 */

// POST /scratch/:slug/buy - Comprar raspadinha
router.post('/:slug/buy', 
  verifyToken,
  gameLimiter,
  userGameLimiter,
  validateScratchSlug,
  scratchController.buyScratchCard.bind(scratchController)
)

// GET /scratch/games/history - Histórico de jogos do usuário
router.get('/games/history', 
  verifyToken,
  validatePagination,
  scratchController.getGameHistory.bind(scratchController)
)

// GET /scratch/games/:gameId - Detalhes de um jogo específico
router.get('/games/:gameId', 
  verifyToken,
  [
    param('gameId')
      .isUUID()
      .withMessage('ID do jogo inválido'),
    handleValidationErrors
  ],
  scratchController.getGameDetails.bind(scratchController)
)

// PUT /scratch/games/:gameId/complete - Marcar jogo como completado
router.put('/games/:gameId/complete', 
  verifyToken,
  [
    param('gameId')
      .isUUID()
      .withMessage('ID do jogo inválido'),
    handleValidationErrors
  ],
  scratchController.completeGame.bind(scratchController)
)

export default router