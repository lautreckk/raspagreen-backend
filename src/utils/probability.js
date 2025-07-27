/**
 * Utilitários para cálculo de probabilidades e RTP
 */

/**
 * Seleciona um prêmio baseado nos pesos de probabilidade
 * @param {Array} prizes - Array de prêmios com probability_weight
 * @returns {Object|null} - Prêmio selecionado ou null para perda
 */
export function selectPrizeByWeight(prizes) {
  if (!prizes || prizes.length === 0) {
    return null
  }

  // Calcular peso total
  const totalWeight = prizes.reduce((sum, prize) => sum + prize.probability_weight, 0)
  
  // Gerar número aleatório
  const random = Math.random() * totalWeight
  
  // Selecionar prêmio baseado no peso
  let currentWeight = 0
  for (const prize of prizes) {
    currentWeight += prize.probability_weight
    if (random <= currentWeight) {
      return prize
    }
  }
  
  return null
}

/**
 * Calcula se deve haver ganho baseado no RTP atual
 * @param {number} currentRTP - RTP atual da categoria
 * @param {number} targetRTP - RTP alvo da categoria
 * @param {number} totalInvested - Total investido na categoria
 * @param {number} gamePrice - Preço do jogo atual
 * @returns {boolean} - Se deve forçar um ganho
 */
export function shouldForceWin(currentRTP, targetRTP, totalInvested, gamePrice) {
  // Se o RTP atual está muito abaixo do alvo, aumentar chance de ganho
  const rtpDifference = targetRTP - currentRTP
  
  // Se a diferença for maior que 10%, forçar ganho
  if (rtpDifference > 10) {
    return true
  }
  
  // Se a diferença for entre 5-10%, chance de 70% de ganho
  if (rtpDifference > 5) {
    return Math.random() < 0.7
  }
  
  // Se a diferença for entre 2-5%, chance de 30% de ganho
  if (rtpDifference > 2) {
    return Math.random() < 0.3
  }
  
  // Caso contrário, probabilidade normal
  return false
}

/**
 * Determina o prêmio para um jogo
 * @param {Array} prizes - Prêmios disponíveis
 * @param {Object} rtpData - Dados de RTP da categoria
 * @param {number} gamePrice - Preço do jogo
 * @returns {Object|null} - Prêmio selecionado ou null
 */
export function determinePrize(prizes, rtpData, gamePrice) {
  const { current_rtp, total_invested } = rtpData
  const targetRTP = 85 // RTP alvo de 85%
  
  // Verificar se deve forçar ganho baseado no RTP
  const forceWin = shouldForceWin(current_rtp, targetRTP, total_invested, gamePrice)
  
  if (forceWin) {
    // Filtrar prêmios de menor valor para não quebrar o RTP
    const lowValuePrizes = prizes.filter(prize => prize.value <= gamePrice * 3)
    return selectPrizeByWeight(lowValuePrizes.length > 0 ? lowValuePrizes : prizes)
  }
  
  // Se o RTP está acima do alvo, reduzir chance de ganho
  if (current_rtp > targetRTP + 5) {
    // 20% de chance de ganho apenas
    if (Math.random() < 0.2) {
      return selectPrizeByWeight(prizes)
    }
    return null
  }
  
  // Probabilidade normal baseada nos pesos
  // Adicionar peso para "perda" (sem prêmio)
  const lossWeight = Math.floor(prizes.reduce((sum, p) => sum + p.probability_weight, 0) * 0.6)
  const totalWeight = prizes.reduce((sum, p) => sum + p.probability_weight, 0) + lossWeight
  
  const random = Math.random() * totalWeight
  
  // Se caiu na faixa de perda
  if (random <= lossWeight) {
    return null
  }
  
  // Caso contrário, selecionar prêmio normalmente
  return selectPrizeByWeight(prizes)
}

/**
 * Gera um grid 3x3 com o prêmio distribuído
 * @param {Object|null} prize - Prêmio selecionado
 * @param {Array} allPrizes - Todos os prêmios disponíveis
 * @returns {Array} - Grid 3x3 com os itens
 */
export function generateGameGrid(prize, allPrizes) {
  const grid = []
  
  // Determinar quantas vezes o prêmio aparece no grid
  let prizeCount = 0
  if (prize) {
    // Prêmios de maior valor aparecem menos vezes
    if (prize.value >= 1000) {
      prizeCount = 3 // Prêmios altos: 3 vezes
    } else if (prize.value >= 100) {
      prizeCount = 4 // Prêmios médios: 4 vezes
    } else {
      prizeCount = 5 // Prêmios baixos: 5 vezes
    }
  }
  
  // Adicionar o prêmio vencedor
  for (let i = 0; i < prizeCount; i++) {
    grid.push(prize)
  }
  
  // Preencher o resto do grid com outros prêmios aleatórios
  const otherPrizes = allPrizes.filter(p => !prize || p.id !== prize.id)
  while (grid.length < 9) {
    const randomPrize = otherPrizes[Math.floor(Math.random() * otherPrizes.length)]
    grid.push(randomPrize)
  }
  
  // Embaralhar o grid
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]]
  }
  
  return grid
}

/**
 * Calcula o novo RTP após um jogo
 * @param {number} currentRTP - RTP atual
 * @param {number} totalInvested - Total investido
 * @param {number} totalPaid - Total pago
 * @param {number} newInvestment - Novo investimento
 * @param {number} newPayout - Novo pagamento
 * @returns {number} - Novo RTP
 */
export function calculateNewRTP(totalInvested, totalPaid, newInvestment, newPayout) {
  const newTotalInvested = totalInvested + newInvestment
  const newTotalPaid = totalPaid + newPayout
  
  if (newTotalInvested === 0) {
    return 0
  }
  
  return (newTotalPaid / newTotalInvested) * 100
}