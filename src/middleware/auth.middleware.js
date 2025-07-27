import jwt from 'jsonwebtoken'
import { supabase } from '../config/database.js'
import { config } from '../config/environment.js'
import logger from '../utils/logger.js'

/**
 * Middleware para verificar token JWT
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      })
    }
    
    const token = authHeader.substring(7) // Remove "Bearer "
    
    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      logger.warn('Token inválido:', { error: error?.message })
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      })
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = row not found
      logger.error('Erro ao buscar perfil:', profileError)
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
    
    // Se não existe perfil, criar um
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          wallet_balance: 0.00,
          total_spent: 0.00,
          total_won: 0.00
        })
        .select()
        .single()
      
      if (createError) {
        logger.error('Erro ao criar perfil:', createError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar perfil do usuário'
        })
      }
      
      req.user = { ...user, profile: newProfile }
    } else {
      req.user = { ...user, profile }
    }
    
    next()
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * Middleware para verificar se usuário é admin (opcional para futuras funcionalidades)
 */
export async function verifyAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      })
    }
    
    // Verificar se usuário tem role admin
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('active', true)
      .single()
    
    if (error || !adminUser) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      })
    }
    
    req.user.isAdmin = true
    next()
  } catch (error) {
    logger.error('Erro no middleware de admin:', error)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
}