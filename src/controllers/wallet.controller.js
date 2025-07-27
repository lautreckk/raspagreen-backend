import { WalletService } from '../services/wallet.service.js'
import logger from '../utils/logger.js'

const walletService = new WalletService()

/**
 * Controller para operações de carteira
 */
export class WalletController {

  /**
   * Obter informações da carteira
   */
  async getWalletInfo(req, res) {
    try {
      const userId = req.user.id

      const walletInfo = await walletService.getWalletInfo(userId)

      res.json({
        success: true,
        data: walletInfo
      })
    } catch (error) {
      logger.error('Erro no controller de carteira:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar informações da carteira'
      })
    }
  }

  /**
   * Obter histórico de transações
   */
  async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const type = req.query.type || null

      const result = await walletService.getTransactionHistory(userId, page, limit, type)

      res.json({
        success: true,
        data: {
          transactions: result.transactions.map(transaction => ({
            id: transaction.id,
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            description: transaction.description,
            status: transaction.status,
            game_session: transaction.game_sessions ? {
              category_name: transaction.game_sessions.scratch_categories?.name,
              category_slug: transaction.game_sessions.scratch_categories?.slug
            } : null,
            external_id: transaction.external_id,
            created_at: transaction.created_at
          })),
          pagination: result.pagination
        }
      })
    } catch (error) {
      logger.error('Erro no controller de histórico de transações:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar histórico de transações'
      })
    }
  }

  /**
   * Adicionar saldo (depósito manual para testes)
   */
  async addBalance(req, res) {
    try {
      const userId = req.user.id
      const { amount, description } = req.body

      const transaction = await walletService.addBalance(userId, amount, description)

      res.status(201).json({
        success: true,
        message: 'Saldo adicionado com sucesso',
        data: {
          transaction_id: transaction.id,
          amount: parseFloat(transaction.amount),
          new_balance: null // Será calculado automaticamente pelo trigger
        }
      })
    } catch (error) {
      logger.error('Erro no controller de depósito:', error)
      
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao adicionar saldo'
      })
    }
  }

  /**
   * Solicitar saque
   */
  async requestWithdraw(req, res) {
    try {
      const userId = req.user.id
      const { amount, pix_key, description } = req.body

      // Verificar se pode sacar
      const canWithdraw = await walletService.canWithdraw(userId)
      if (!canWithdraw.canWithdraw) {
        return res.status(400).json({
          success: false,
          message: `Limite de saques diários atingido. Você já fez ${canWithdraw.withdrawalsToday} saques hoje.`,
          data: canWithdraw
        })
      }

      const transaction = await walletService.requestWithdraw(userId, amount, pix_key, description)

      res.status(201).json({
        success: true,
        message: 'Saque solicitado com sucesso',
        data: {
          transaction_id: transaction.id,
          amount: parseFloat(transaction.amount),
          status: transaction.status,
          description: transaction.description
        }
      })
    } catch (error) {
      logger.error('Erro no controller de saque:', error)
      
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao solicitar saque'
      })
    }
  }

  /**
   * Obter detalhes de uma transação
   */
  async getTransaction(req, res) {
    try {
      const { transactionId } = req.params
      const userId = req.user.id

      const transaction = await walletService.getTransaction(transactionId, userId)

      res.json({
        success: true,
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          description: transaction.description,
          status: transaction.status,
          game_session: transaction.game_sessions ? {
            id: transaction.game_sessions.id,
            category_name: transaction.game_sessions.scratch_categories?.name,
            category_slug: transaction.game_sessions.scratch_categories?.slug
          } : null,
          external_id: transaction.external_id,
          created_at: transaction.created_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de transação:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Transação não encontrada'
      })
    }
  }

  /**
   * Obter resumo financeiro
   */
  async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id
      const days = parseInt(req.query.days) || 30

      const summary = await walletService.getFinancialSummary(userId, days)

      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      logger.error('Erro no controller de resumo financeiro:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar resumo financeiro'
      })
    }
  }

  /**
   * Verificar limites de saque
   */
  async checkWithdrawLimits(req, res) {
    try {
      const userId = req.user.id

      const limits = await walletService.canWithdraw(userId)

      res.json({
        success: true,
        data: limits
      })
    } catch (error) {
      logger.error('Erro no controller de limites de saque:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao verificar limites de saque'
      })
    }
  }

  /**
   * Webhook para processar pagamentos (futuro Abacatepay)
   */
  async processPaymentWebhook(req, res) {
    try {
      // TODO: Implementar verificação de assinatura do webhook
      // TODO: Processar diferentes tipos de eventos do Abacatepay
      
      const { event_type, transaction_id, status, external_id } = req.body

      logger.info('Webhook de pagamento recebido', {
        event_type,
        transaction_id,
        status,
        external_id
      })

      // Por enquanto, apenas logar o webhook
      res.status(200).json({
        success: true,
        message: 'Webhook processado'
      })
    } catch (error) {
      logger.error('Erro no webhook de pagamento:', error)
      
      res.status(500).json({
        success: false,
        message: 'Erro ao processar webhook'
      })
    }
  }
}