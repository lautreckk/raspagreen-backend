import { GameService } from '../services/game.service.js'
import logger from '../utils/logger.js'

const gameService = new GameService()

/**
 * Controller para operações de raspadinha
 */
export class ScratchController {

  /**
   * Listar todas as categorias ativas
   */
  async getCategories(req, res) {
    try {
      const categories = await gameService.getCategories()

      res.json({
        success: true,
        data: categories.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          price: parseFloat(category.price),
          max_reward: parseFloat(category.max_reward),
          rtp_percentage: category.rtp_percentage,
          banner_url: category.banner_url,
          created_at: category.created_at
        }))
      })
    } catch (error) {
      logger.error('Erro no controller de categorias:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar categorias'
      })
    }
  }

  /**
   * Obter detalhes de uma categoria específica
   */
  async getCategoryBySlug(req, res) {
    try {
      const { slug } = req.params

      const category = await gameService.getCategoryBySlug(slug)
      const prizes = await gameService.getPrizesByCategory(category.id)

      res.json({
        success: true,
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          price: parseFloat(category.price),
          max_reward: parseFloat(category.max_reward),
          rtp_percentage: category.rtp_percentage,
          banner_url: category.banner_url,
          created_at: category.created_at,
          rewards: prizes.map(prize => ({
            id: prize.id,
            name: prize.name,
            image_url: prize.image_url,
            value: parseFloat(prize.value),
            type: prize.type,
            probability_weight: prize.probability_weight
          }))
        }
      })
    } catch (error) {
      logger.error('Erro no controller de categoria:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Categoria não encontrada'
      })
    }
  }

  /**
   * Obter prêmios de uma categoria
   */
  async getCategoryRewards(req, res) {
    try {
      const { slug } = req.params

      const category = await gameService.getCategoryBySlug(slug)
      const prizes = await gameService.getPrizesByCategory(category.id)

      res.json({
        success: true,
        data: prizes.map(prize => ({
          id: prize.id,
          name: prize.name,
          image_url: prize.image_url,
          value: parseFloat(prize.value),
          type: prize.type
          // Não retornar probability_weight para o frontend
        }))
      })
    } catch (error) {
      logger.error('Erro no controller de prêmios:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Categoria não encontrada'
      })
    }
  }

  /**
   * Comprar uma raspadinha
   */
  async buyScratchCard(req, res) {
    try {
      const { slug } = req.params
      const userId = req.user.id

      const result = await gameService.buyScratchCard(userId, slug)

      res.status(201).json({
        success: true,
        message: 'Raspadinha comprada com sucesso',
        data: {
          game_id: result.gameSession.id,
          category: {
            name: result.category.name,
            slug: result.category.slug,
            price: parseFloat(result.category.price)
          },
          prize: result.prize ? {
            id: result.prize.id,
            name: result.prize.name,
            image_url: result.prize.image_url,
            value: parseFloat(result.prize.value),
            type: result.prize.type
          } : null,
          grid: result.grid.map(item => item ? {
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            value: parseFloat(item.value),
            type: item.type
          } : null),
          amount_spent: parseFloat(result.amountSpent),
          amount_won: parseFloat(result.amountWon),
          created_at: result.gameSession.created_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de compra:', error)
      
      let statusCode = 500
      if (error.message.includes('Saldo insuficiente')) {
        statusCode = 400
      } else if (error.message.includes('não encontrada')) {
        statusCode = 404
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao comprar raspadinha'
      })
    }
  }

  /**
   * Obter histórico de jogos do usuário
   */
  async getGameHistory(req, res) {
    try {
      const userId = req.user.id
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20

      const result = await gameService.getUserGameHistory(userId, page, limit)

      res.json({
        success: true,
        data: {
          games: result.games.map(game => ({
            id: game.id,
            category: {
              name: game.scratch_categories.name,
              slug: game.scratch_categories.slug,
              price: parseFloat(game.scratch_categories.price)
            },
            prize: game.prizes ? {
              name: game.prizes.name,
              image_url: game.prizes.image_url,
              value: parseFloat(game.prizes.value),
              type: game.prizes.type
            } : null,
            amount_spent: parseFloat(game.amount_spent),
            amount_won: parseFloat(game.amount_won),
            completed_at: game.completed_at,
            created_at: game.created_at
          })),
          pagination: result.pagination
        }
      })
    } catch (error) {
      logger.error('Erro no controller de histórico:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar histórico'
      })
    }
  }

  /**
   * Obter detalhes de um jogo específico
   */
  async getGameDetails(req, res) {
    try {
      const { gameId } = req.params
      const userId = req.user.id

      const game = await gameService.getGameDetails(gameId, userId)

      res.json({
        success: true,
        data: {
          id: game.id,
          category: {
            name: game.scratch_categories.name,
            slug: game.scratch_categories.slug,
            price: parseFloat(game.scratch_categories.price),
            banner_url: game.scratch_categories.banner_url
          },
          prize: game.prizes ? {
            name: game.prizes.name,
            image_url: game.prizes.image_url,
            value: parseFloat(game.prizes.value),
            type: game.prizes.type
          } : null,
          grid_data: game.grid_data,
          amount_spent: parseFloat(game.amount_spent),
          amount_won: parseFloat(game.amount_won),
          completed_at: game.completed_at,
          created_at: game.created_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de detalhes do jogo:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Jogo não encontrado'
      })
    }
  }

  /**
   * Marcar jogo como completado
   */
  async completeGame(req, res) {
    try {
      const { gameId } = req.params
      const userId = req.user.id

      const game = await gameService.completeGame(gameId, userId)

      res.json({
        success: true,
        message: 'Jogo marcado como completado',
        data: {
          id: game.id,
          completed_at: game.completed_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de completar jogo:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Jogo não encontrado'
      })
    }
  }

  /**
   * Obter estatísticas de uma categoria
   */
  async getCategoryStats(req, res) {
    try {
      const { slug } = req.params

      const category = await gameService.getCategoryBySlug(slug)
      const stats = await gameService.getCategoryStats(category.id)

      res.json({
        success: true,
        data: {
          category: {
            name: category.name,
            slug: category.slug,
            rtp_target: category.rtp_percentage
          },
          rtp: {
            current: parseFloat(stats.rtp.current_rtp),
            total_invested: parseFloat(stats.rtp.total_invested),
            total_paid: parseFloat(stats.rtp.total_paid),
            last_reset: stats.rtp.last_reset
          },
          total_games: stats.totalGames
        }
      })
    } catch (error) {
      logger.error('Erro no controller de estatísticas de categoria:', error)
      
      res.status(404).json({
        success: false,
        message: error.message || 'Categoria não encontrada'
      })
    }
  }
}