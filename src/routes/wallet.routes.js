import { Router } from 'express'
import { WalletController } from '../controllers/wallet.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { financialLimiter, withdrawLimiter } from '../middleware/rateLimit.middleware.js'
import { 
  validateDepositAmount,
  validateWithdrawAmount,
  validatePagination,
  handleValidationErrors 
} from '../middleware/validation.middleware.js'
import { body, param, query } from 'express-validator'

const router = Router()
const walletController = new WalletController()

/**
 * Todas as rotas requerem autenticação
 */
router.use(verifyToken)

// GET /wallet - Obter informações da carteira
router.get('/', 
  walletController.getWalletInfo.bind(walletController)
)

// GET /wallet/transactions - Histórico de transações
router.get('/transactions', 
  validatePagination,
  [
    query('type')
      .optional()
      .isIn(['purchase', 'win', 'deposit', 'withdraw'])
      .withMessage('Tipo de transação inválido'),
    handleValidationErrors
  ],
  walletController.getTransactionHistory.bind(walletController)
)

// GET /wallet/transactions/:transactionId - Detalhes de uma transação
router.get('/transactions/:transactionId', 
  [
    param('transactionId')
      .isUUID()
      .withMessage('ID da transação inválido'),
    handleValidationErrors
  ],
  walletController.getTransaction.bind(walletController)
)

// GET /wallet/summary - Resumo financeiro
router.get('/summary', 
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Dias deve ser entre 1 e 365'),
    handleValidationErrors
  ],
  walletController.getFinancialSummary.bind(walletController)
)

// GET /wallet/withdraw/limits - Verificar limites de saque
router.get('/withdraw/limits', 
  walletController.checkWithdrawLimits.bind(walletController)
)

// POST /wallet/deposit - Adicionar saldo (para testes)
router.post('/deposit', 
  financialLimiter,
  validateDepositAmount,
  walletController.addBalance.bind(walletController)
)

// POST /wallet/withdraw - Solicitar saque
router.post('/withdraw', 
  financialLimiter,
  withdrawLimiter,
  validateWithdrawAmount,
  walletController.requestWithdraw.bind(walletController)
)

/**
 * Rota para webhook (sem autenticação)
 */

// POST /wallet/webhook/payment - Webhook para pagamentos
router.post('/webhook/payment', 
  // Remover middleware de autenticação para webhook
  (req, res, next) => {
    // TODO: Implementar verificação de assinatura do webhook aqui
    next()
  },
  walletController.processPaymentWebhook.bind(walletController)
)

export default router