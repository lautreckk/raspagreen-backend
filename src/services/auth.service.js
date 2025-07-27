import { supabase, supabasePublic } from '../config/database.js'
import logger from '../utils/logger.js'

/**
 * Service para operações de autenticação
 */
export class AuthService {
  
  /**
   * Registrar novo usuário
   */
  async register(email, password, fullName) {
    try {
      const { data, error } = await supabasePublic.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        logger.error('Erro no registro:', error)
        throw new Error(error.message)
      }

      // Se o usuário foi criado, criar o perfil
      if (data.user) {
        await this.createUserProfile(data.user.id, fullName, email)
      }

      return {
        user: data.user,
        session: data.session
      }
    } catch (error) {
      logger.error('Erro no service de registro:', error)
      throw error
    }
  }

  /**
   * Login do usuário
   */
  async login(email, password) {
    try {
      const { data, error } = await supabasePublic.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        logger.error('Erro no login:', error)
        throw new Error(error.message)
      }

      return {
        user: data.user,
        session: data.session
      }
    } catch (error) {
      logger.error('Erro no service de login:', error)
      throw error
    }
  }

  /**
   * Logout do usuário
   */
  async logout(accessToken) {
    try {
      const { error } = await supabase.auth.admin.signOut(accessToken)

      if (error) {
        logger.error('Erro no logout:', error)
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      logger.error('Erro no service de logout:', error)
      throw error
    }
  }

  /**
   * Verificar token e obter usuário
   */
  async verifyToken(token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        throw new Error('Token inválido')
      }

      return user
    } catch (error) {
      logger.error('Erro na verificação de token:', error)
      throw error
    }
  }

  /**
   * Obter perfil completo do usuário
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Erro ao buscar perfil:', error)
        throw new Error('Erro ao buscar perfil do usuário')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de perfil:', error)
      throw error
    }
  }

  /**
   * Criar perfil do usuário
   */
  async createUserProfile(userId, fullName, email) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: fullName || email?.split('@')[0],
          wallet_balance: 0.00,
          total_spent: 0.00,
          total_won: 0.00
        })
        .select()
        .single()

      if (error) {
        logger.error('Erro ao criar perfil:', error)
        throw new Error('Erro ao criar perfil do usuário')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de criação de perfil:', error)
      throw error
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(userId, updates) {
    try {
      const allowedFields = ['full_name']
      const filteredUpdates = {}
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = value
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...filteredUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Erro ao atualizar perfil:', error)
        throw new Error('Erro ao atualizar perfil')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de atualização de perfil:', error)
      throw error
    }
  }

  /**
   * Solicitar reset de senha
   */
  async requestPasswordReset(email) {
    try {
      const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      })

      if (error) {
        logger.error('Erro no reset de senha:', error)
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      logger.error('Erro no service de reset de senha:', error)
      throw error
    }
  }

  /**
   * Confirmar reset de senha
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      const { data, error } = await supabasePublic.auth.updateUser({
        password: newPassword
      }, {
        accessToken: token
      })

      if (error) {
        logger.error('Erro na confirmação de reset:', error)
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      logger.error('Erro no service de confirmação de reset:', error)
      throw error
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats', { user_uuid: userId })

      if (error) {
        logger.error('Erro ao buscar estatísticas:', error)
        throw new Error('Erro ao buscar estatísticas')
      }

      return data
    } catch (error) {
      logger.error('Erro no service de estatísticas:', error)
      throw error
    }
  }
}