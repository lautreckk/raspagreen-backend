import { supabase } from '../config/database.js'
import { determinePrize, generateGameGrid, calculateNewRTP } from '../utils/probability.js'
import logger from '../utils/logger.js'

/**
 * Service para operações de jogos
 */
export class GameService {

  /**
   * Obter todas as categorias ativas
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('scratch_categories')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true })

      if (error) {
        logger.error('Erro ao buscar categorias:', error)
        throw new Error('Erro ao buscar categorias')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de categorias:', error)
      throw error
    }
  }

  /**
   * Obter categoria por slug
   */
  async getCategoryBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('scratch_categories')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single()

      if (error) {
        logger.error('Erro ao buscar categoria:', error)
        throw new Error('Categoria não encontrada')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de categoria:', error)
      throw error
    }
  }

  /**
   * Obter prêmios de uma categoria
   */
  async getPrizesByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('value', { ascending: true })

      if (error) {
        logger.error('Erro ao buscar prêmios:', error)
        throw new Error('Erro ao buscar prêmios')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de prêmios:', error)
      throw error
    }
  }

  /**
   * Obter controle RTP de uma categoria
   */
  async getRTPControl(categoryId) {
    try {
      const { data, error } = await supabase
        .from('rtp_control')
        .select('*')
        .eq('category_id', categoryId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        logger.error('Erro ao buscar RTP:', error)
        throw new Error('Erro ao buscar controle RTP')
      }

      // Se não existe, criar um novo registro
      if (!data) {
        const { data: newRTP, error: createError } = await supabase
          .from('rtp_control')
          .insert({
            category_id: categoryId,
            current_rtp: 0,
            total_invested: 0,
            total_paid: 0
          })
          .select()
          .single()

        if (createError) {
          logger.error('Erro ao criar RTP:', createError)
          throw new Error('Erro ao criar controle RTP')
        }

        return newRTP
      }

      return data
    } catch (error) {
      logger.error('Erro no service de RTP:', error)
      throw error
    }
  }

  /**
   * Comprar uma raspadinha
   */
  async buyScratchCard(userId, categorySlug) {
    try {
      // Buscar categoria
      const category = await this.getCategoryBySlug(categorySlug)
      
      // Verificar saldo do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wallet_balance')
        .eq('id', userId)
        .single()

      if (profileError) {
        logger.error('Erro ao buscar perfil:', profileError)
        throw new Error('Erro ao verificar saldo')
      }

      if (userProfile.wallet_balance < category.price) {
        throw new Error('Saldo insuficiente')
      }

      // Buscar prêmios e RTP
      const [prizes, rtpControl] = await Promise.all([
        this.getPrizesByCategory(category.id),
        this.getRTPControl(category.id)
      ])

      // Determinar prêmio baseado no RTP
      const winningPrize = determinePrize(prizes, rtpControl, category.price)
      const amountWon = winningPrize ? winningPrize.value : 0

      // Gerar grid do jogo
      const gameGrid = generateGameGrid(winningPrize, prizes)

      // Criar sessão de jogo
      const { data: gameSession, error: gameError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: userId,
          category_id: category.id,
          prize_id: winningPrize?.id || null,
          amount_spent: category.price,
          amount_won: amountWon,
          grid_data: gameGrid,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (gameError) {
        logger.error('Erro ao criar jogo:', gameError)
        throw new Error('Erro ao criar jogo')
      }

      // Criar transação de compra
      const { error: purchaseError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: category.price,
          description: `Compra de ${category.name}`,
          game_session_id: gameSession.id,
          status: 'completed'
        })

      if (purchaseError) {
        logger.error('Erro na transação de compra:', purchaseError)
        throw new Error('Erro na transação de compra')
      }

      // Se ganhou, criar transação de ganho
      if (amountWon > 0) {
        const { error: winError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'win',
            amount: amountWon,
            description: `Prêmio: ${winningPrize.name}`,
            game_session_id: gameSession.id,
            status: 'completed'
          })

        if (winError) {
          logger.error('Erro na transação de ganho:', winError)
          // Não falhar aqui, o jogo já foi criado
        }
      }

      logger.info('Jogo criado com sucesso', {
        userId,
        categorySlug,
        amountSpent: category.price,
        amountWon,
        prize: winningPrize?.name || 'Nenhum prêmio'
      })

      return {
        gameSession,
        category,
        prize: winningPrize,
        grid: gameGrid,
        amountSpent: category.price,
        amountWon
      }
    } catch (error) {
      logger.error('Erro no service de compra:', error)
      throw error
    }
  }

  /**
   * Obter histórico de jogos do usuário
   */
  async getUserGameHistory(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('game_sessions')
        .select(`
          *,
          scratch_categories!inner(name, slug, price),
          prizes(name, image_url, value, type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .count('exact')

      if (error) {
        logger.error('Erro ao buscar histórico:', error)
        throw new Error('Erro ao buscar histórico de jogos')
      }

      return {
        games: data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      logger.error('Erro no service de histórico:', error)
      throw error
    }
  }

  /**
   * Obter detalhes de um jogo específico
   */
  async getGameDetails(gameId, userId) {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          scratch_categories!inner(name, slug, price, banner_url),
          prizes(name, image_url, value, type)
        `)
        .eq('id', gameId)
        .eq('user_id', userId)
        .single()

      if (error) {
        logger.error('Erro ao buscar jogo:', error)
        throw new Error('Jogo não encontrado')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de detalhes do jogo:', error)
      throw error
    }
  }

  /**
   * Marcar jogo como completado
   */
  async completeGame(gameId, userId) {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', gameId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Erro ao completar jogo:', error)
        throw new Error('Erro ao completar jogo')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de completar jogo:', error)
      throw error
    }
  }

  /**
   * Obter estatísticas de uma categoria
   */
  async getCategoryStats(categoryId) {
    try {
      const { data: rtpData, error: rtpError } = await supabase
        .from('rtp_control')
        .select('*')
        .eq('category_id', categoryId)
        .single()

      if (rtpError && rtpError.code !== 'PGRST116') {
        logger.error('Erro ao buscar RTP:', rtpError)
        throw new Error('Erro ao buscar estatísticas')
      }

      const { data: gamesCount, error: countError } = await supabase
        .from('game_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)

      if (countError) {
        logger.error('Erro ao contar jogos:', countError)
      }

      return {
        rtp: rtpData || { current_rtp: 0, total_invested: 0, total_paid: 0 },
        totalGames: gamesCount || 0
      }
    } catch (error) {
      logger.error('Erro no service de estatísticas de categoria:', error)
      throw error
    }
  }
}