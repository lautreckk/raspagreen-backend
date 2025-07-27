import { supabase } from '../config/database.js'
import logger from '../utils/logger.js'

/**
 * Service para operações de carteira
 */
export class WalletService {

  /**
   * Obter saldo e informações da carteira
   */
  async getWalletInfo(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_balance, total_spent, total_won')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Erro ao buscar carteira:', error)
        throw new Error('Erro ao buscar informações da carteira')
      }

      return {
        balance: parseFloat(data.wallet_balance),
        totalSpent: parseFloat(data.total_spent),
        totalWon: parseFloat(data.total_won),
        netResult: parseFloat(data.total_won) - parseFloat(data.total_spent)
      }
    } catch (error) {
      logger.error('Erro no service de carteira:', error)
      throw error
    }
  }

  /**
   * Obter histórico de transações
   */
  async getTransactionHistory(userId, page = 1, limit = 20, type = null) {
    try {
      const offset = (page - 1) * limit
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          game_sessions(
            scratch_categories(name, slug)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error, count } = await query.count('exact')

      if (error) {
        logger.error('Erro ao buscar transações:', error)
        throw new Error('Erro ao buscar histórico de transações')
      }

      return {
        transactions: data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      logger.error('Erro no service de transações:', error)
      throw error
    }
  }

  /**
   * Adicionar saldo (depósito manual para testes)
   * TODO: Integrar com Abacatepay no futuro
   */
  async addBalance(userId, amount, description = 'Depósito manual') {
    try {
      // Validar amount
      if (!amount || amount <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      // Criar transação de depósito
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          description: description,
          status: 'completed'
        })
        .select()
        .single()

      if (error) {
        logger.error('Erro ao criar depósito:', error)
        throw new Error('Erro ao processar depósito')
      }

      logger.info('Depósito realizado com sucesso', {
        userId,
        amount,
        transactionId: data.id
      })

      return data
    } catch (error) {
      logger.error('Erro no service de depósito:', error)
      throw error
    }
  }

  /**
   * Solicitar saque
   * TODO: Integrar com Abacatepay no futuro
   */
  async requestWithdraw(userId, amount, pixKey, description = 'Saque via PIX') {
    try {
      // Validar amount
      if (!amount || amount <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      if (amount < 10) {
        throw new Error('Valor mínimo para saque é R$ 10,00')
      }

      if (!pixKey || pixKey.trim().length === 0) {
        throw new Error('Chave PIX é obrigatória')
      }

      // Verificar saldo suficiente
      const walletInfo = await this.getWalletInfo(userId)
      if (walletInfo.balance < amount) {
        throw new Error('Saldo insuficiente')
      }

      // Criar transação de saque como pendente
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'withdraw',
          amount: amount,
          description: `${description} - PIX: ${pixKey}`,
          status: 'pending',
          external_id: null // Será preenchido quando integrar com Abacatepay
        })
        .select()
        .single()

      if (error) {
        logger.error('Erro ao criar saque:', error)
        throw new Error('Erro ao processar saque')
      }

      // TODO: Integrar com Abacatepay aqui
      // Por enquanto, vamos simular que o saque foi processado
      await this.processWithdraw(data.id, 'completed')

      logger.info('Saque solicitado com sucesso', {
        userId,
        amount,
        pixKey,
        transactionId: data.id
      })

      return data
    } catch (error) {
      logger.error('Erro no service de saque:', error)
      throw error
    }
  }

  /**
   * Processar saque (atualizar status)
   */
  async processWithdraw(transactionId, status, externalId = null) {
    try {
      const validStatuses = ['completed', 'failed', 'cancelled']
      if (!validStatuses.includes(status)) {
        throw new Error('Status inválido')
      }

      const updateData = { status }
      if (externalId) {
        updateData.external_id = externalId
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .eq('type', 'withdraw')
        .select()
        .single()

      if (error) {
        logger.error('Erro ao atualizar saque:', error)
        throw new Error('Erro ao processar saque')
      }

      logger.info('Status do saque atualizado', {
        transactionId,
        status,
        externalId
      })

      return data
    } catch (error) {
      logger.error('Erro no service de processamento de saque:', error)
      throw error
    }
  }

  /**
   * Obter transação específica
   */
  async getTransaction(transactionId, userId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          game_sessions(
            id,
            scratch_categories(name, slug)
          )
        `)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()

      if (error) {
        logger.error('Erro ao buscar transação:', error)
        throw new Error('Transação não encontrada')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de transação:', error)
      throw error
    }
  }

  /**
   * Obter resumo financeiro do usuário
   */
  async getFinancialSummary(userId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, amount, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())

      if (error) {
        logger.error('Erro ao buscar resumo:', error)
        throw new Error('Erro ao buscar resumo financeiro')
      }

      const summary = {
        period: `${days} dias`,
        totalTransactions: transactions.length,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSpent: 0,
        totalWon: 0,
        netResult: 0
      }

      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount)
        
        switch (transaction.type) {
          case 'deposit':
            summary.totalDeposits += amount
            break
          case 'withdraw':
            summary.totalWithdrawals += amount
            break
          case 'purchase':
            summary.totalSpent += amount
            break
          case 'win':
            summary.totalWon += amount
            break
        }
      })

      summary.netResult = summary.totalWon + summary.totalDeposits - summary.totalSpent - summary.totalWithdrawals

      return summary
    } catch (error) {
      logger.error('Erro no service de resumo financeiro:', error)
      throw error
    }
  }

  /**
   * Verificar se usuário pode fazer saque
   */
  async canWithdraw(userId) {
    try {
      // Verificar quantos saques foram feitos hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayWithdrawals, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'withdraw')
        .gte('created_at', today.toISOString())

      if (error && error.code !== 'PGRST116') {
        logger.error('Erro ao verificar saques:', error)
        throw new Error('Erro ao verificar limite de saques')
      }

      const withdrawalsToday = todayWithdrawals || 0
      const maxWithdrawalsPerDay = 3

      return {
        canWithdraw: withdrawalsToday < maxWithdrawalsPerDay,
        withdrawalsToday,
        maxWithdrawalsPerDay,
        remainingWithdrawals: Math.max(0, maxWithdrawalsPerDay - withdrawalsToday)
      }
    } catch (error) {
      logger.error('Erro no service de verificação de saque:', error)
      throw error
    }
  }
}