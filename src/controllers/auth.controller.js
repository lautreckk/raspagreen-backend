import { AuthService } from '../services/auth.service.js'
import logger from '../utils/logger.js'

const authService = new AuthService()

/**
 * Controller para operações de autenticação
 */
export class AuthController {

  /**
   * Registrar novo usuário
   */
  async register(req, res) {
    try {
      const { email, password, full_name } = req.body

      const result = await authService.register(email, password, full_name)

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.user_metadata?.full_name
          },
          session: result.session
        }
      })
    } catch (error) {
      logger.error('Erro no controller de registro:', error)
      
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao registrar usuário'
      })
    }
  }

  /**
   * Login do usuário
   */
  async login(req, res) {
    try {
      const { email, password } = req.body

      const result = await authService.login(email, password)

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.user_metadata?.full_name
          },
          session: result.session
        }
      })
    } catch (error) {
      logger.error('Erro no controller de login:', error)
      
      res.status(401).json({
        success: false,
        message: error.message || 'Credenciais inválidas'
      })
    }
  }

  /**
   * Logout do usuário
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.substring(7) // Remove "Bearer "

      if (token) {
        await authService.logout(token)
      }

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      })
    } catch (error) {
      logger.error('Erro no controller de logout:', error)
      
      // Mesmo com erro, retornar sucesso no logout
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      })
    }
  }

  /**
   * Obter perfil do usuário autenticado
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id

      const profile = await authService.getUserProfile(userId)

      res.json({
        success: true,
        data: {
          id: profile.id,
          full_name: profile.full_name,
          wallet_balance: parseFloat(profile.wallet_balance),
          total_spent: parseFloat(profile.total_spent),
          total_won: parseFloat(profile.total_won),
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de perfil:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar perfil'
      })
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id
      const updates = req.body

      const profile = await authService.updateUserProfile(userId, updates)

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          id: profile.id,
          full_name: profile.full_name,
          wallet_balance: parseFloat(profile.wallet_balance),
          total_spent: parseFloat(profile.total_spent),
          total_won: parseFloat(profile.total_won),
          updated_at: profile.updated_at
        }
      })
    } catch (error) {
      logger.error('Erro no controller de atualização de perfil:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar perfil'
      })
    }
  }

  /**
   * Solicitar reset de senha
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body

      await authService.requestPasswordReset(email)

      res.json({
        success: true,
        message: 'Email de recuperação enviado com sucesso'
      })
    } catch (error) {
      logger.error('Erro no controller de reset de senha:', error)
      
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao solicitar reset de senha'
      })
    }
  }

  /**
   * Confirmar reset de senha
   */
  async confirmPasswordReset(req, res) {
    try {
      const { token, new_password } = req.body

      await authService.confirmPasswordReset(token, new_password)

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      })
    } catch (error) {
      logger.error('Erro no controller de confirmação de reset:', error)
      
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao alterar senha'
      })
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id

      const stats = await authService.getUserStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Erro no controller de estatísticas:', error)
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar estatísticas'
      })
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  async checkAuth(req, res) {
    try {
      // Se chegou até aqui, o usuário está autenticado (middleware passou)
      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.profile?.full_name
          }
        }
      })
    } catch (error) {
      logger.error('Erro no controller de check auth:', error)
      
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      })
    }
  }
}