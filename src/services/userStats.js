const { ChatbotQuestion, ChatbotCategory } = require('../models');
const { Op } = require('sequelize');



class UserStatsService {
  constructor() {

    this.categoryWeights = {
      entrenamiento: 3,
      nutricion: 2,
      recuperacion: 2,
      prevencion: 2,
      equipamiento: 1
    };
  }


  /**
   * Obtiene las estadísticas de un usuario desde la base de datos
   * @param {number} userId - ID del usuario
   * @returns {Object} - Estadísticas del usuario
   */
  async getUserStats(userId) {
    try {
      const questionStats = await ChatbotQuestion.findAll({
        where: { user_id: userId },
        include: [{ model: ChatbotCategory, attributes: ['name'] }],
        attributes: [
          [ChatbotQuestion.sequelize.fn('COUNT', ChatbotQuestion.sequelize.col('ChatbotQuestion.id')), 'count'],
          'category_id'
        ],
        group: ['category_id', 'ChatbotCategory.name']
      });

      // Inicializar estadísticas
      const stats = {
        preguntas_nutricion: 0,
        preguntas_entrenamiento: 0,
        preguntas_recuperacion: 0,
        preguntas_prevencion_lesiones: 0,
        preguntas_equipamiento: 0,
        score_ponderado: 0,
        total_preguntas: 0,
        ultima_actualizacion: new Date().toISOString()
      };

      // Mapear resultados de la BD a los nombres esperados
      const categoryMapping = {
        'Nutrición': 'preguntas_nutricion',
        'Entrenamiento': 'preguntas_entrenamiento', 
        'Recuperación': 'preguntas_recuperacion',
        'Prevención': 'preguntas_prevencion_lesiones',
        'Equipamiento': 'preguntas_equipamiento'
      };

      questionStats.forEach(stat => {
        const categoryName = stat.ChatbotCategory.name;
        const mappedKey = categoryMapping[categoryName];
        if (mappedKey) {
          stats[mappedKey] = parseInt(stat.dataValues.count);
          stats.total_preguntas += parseInt(stat.dataValues.count);
        }
      });

      // Calcular score ponderado
      stats.score_ponderado = this.calculateWeightedScore(stats);

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del usuario:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }


  async updateUserStats(userId, category) {
    try {
      console.log(`Actualizando estadísticas para usuario ${userId}, categoría: ${category}`);
      

      const categoryRecord = await ChatbotCategory.findOne({
        where: { name: category }
      });

      if (!categoryRecord) {
        throw new Error(`Categoría no encontrada: ${category}`);
      }


      const stats = await this.getUserStats(userId);
      
      console.log(`Estadísticas actualizadas para usuario ${userId}`);
      return stats;

    } catch (error) {
      console.error(' Error actualizando estadísticas:', error);
      throw new Error(`Error al actualizar estadísticas: ${error.message}`);
    }
  }


  /**
   * Guarda una pregunta clasificada en la base de datos
   * @param {number} userId - ID del usuario
   * @param {string} question - Pregunta del usuario
   * @param {string} categoryName - Nombre de la categoría
   * @returns {Object} - Pregunta guardada
   */
  async saveQuestion(userId, question, categoryName) {
    try {
      // Buscar la categoría por nombre
      const category = await ChatbotCategory.findOne({
        where: { name: categoryName }
      });

      if (!category) {
        throw new Error(`Categoría no encontrada: ${categoryName}`);
      }

      // Guardar la pregunta
      const savedQuestion = await ChatbotQuestion.create({
        user_id: userId,
        question: question,
        category_id: category.id,
        created_at: new Date()
      });

      console.log(`💾 Pregunta guardada: ID=${savedQuestion.id}, Usuario=${userId}, Categoría=${categoryName}`);
      return savedQuestion;
    } catch (error) {
      console.error('❌ Error guardando pregunta:', error);
      throw new Error(`Error al guardar la pregunta: ${error.message}`);
    }
  }

  /**
   * Calcula el score ponderado basado en las estadísticas del usuario
   * @param {Object} stats - Estadísticas del usuario
   * @returns {number} - Score ponderado
   */
  calculateWeightedScore(stats) {
    let totalScore = 0;
    
    // Calcular score para cada categoría
    totalScore += stats.preguntas_entrenamiento * this.categoryWeights.entrenamiento;
    totalScore += stats.preguntas_nutricion * this.categoryWeights.nutricion;
    totalScore += stats.preguntas_recuperacion * this.categoryWeights.recuperacion;
    totalScore += stats.preguntas_prevencion_lesiones * this.categoryWeights.prevencion;
    totalScore += stats.preguntas_equipamiento * this.categoryWeights.equipamiento;
    
    return Math.round(totalScore * 100) / 100;
  }

  /**
   * Obtiene las preferencias del usuario basadas en sus preguntas
   * @param {number} userId - ID del usuario (referencia externa)
   * @returns {Object} - Preferencias del usuario
   */
  async getUserPreferences(userId) {
    try {
      const stats = await this.getUserStats(userId);
      
      // Encontrar la categoría con más preguntas
      const categories = [
        { name: 'entrenamiento', count: stats.preguntas_entrenamiento },
        { name: 'nutricion', count: stats.preguntas_nutricion },
        { name: 'recuperacion', count: stats.preguntas_recuperacion },
        { name: 'prevencion', count: stats.preguntas_prevencion_lesiones },
        { name: 'equipamiento', count: stats.preguntas_equipamiento }
      ];

      const maxCategory = categories.reduce((max, current) => 
        current.count > max.count ? current : max
      );

      return {
        primaryInterest: maxCategory.name,
        totalQuestions: Object.values(stats).filter(val => typeof val === 'number' && val > 0).reduce((a, b) => a + b, 0),
        categoryDistribution: categories,
        weightedScore: stats.score_ponderado
      };

    } catch (error) {
      console.error('❌ Error obteniendo preferencias:', error);
      throw new Error(`Error al obtener preferencias: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas agregadas de todos los usuarios
   * @returns {Object} - Estadísticas globales
   */
  async getGlobalStats() {
    try {
      const globalStats = {
        totalUsers: 0,
        totalQuestions: 0,
        categoryDistribution: {
          entrenamiento: 0,
          nutricion: 0,
          recuperacion: 0,
          prevencion: 0,
          equipamiento: 0
        },
        averageWeightedScore: 0
      };

      // Obtener estadísticas globales desde la base de datos
      const questionStats = await ChatbotQuestion.findAll({
        include: [{
          model: ChatbotCategory,
          attributes: ['name']
        }],
        attributes: [
          [ChatbotQuestion.sequelize.fn('COUNT', ChatbotQuestion.sequelize.col('ChatbotQuestion.id')), 'count'],
          'category_id'
        ],
        group: ['category_id', 'ChatbotCategory.name']
      });

      // Contar usuarios únicos
      const uniqueUsers = await ChatbotQuestion.count({
        distinct: true,
        col: 'user_id'
      });

      globalStats.totalUsers = uniqueUsers;

      // Mapear resultados
      const categoryMapping = {
        'nutricion': 'nutricion',
        'entrenamiento': 'entrenamiento',
        'recuperacion': 'recuperacion',
        'prevencion': 'prevencion',
        'equipamiento': 'equipamiento'
      };

      questionStats.forEach(stat => {
        const categoryName = stat.ChatbotCategory.name;
        const fieldName = categoryMapping[categoryName];
        if (fieldName) {
          const count = parseInt(stat.dataValues.count);
          globalStats.categoryDistribution[fieldName] = count;
          globalStats.totalQuestions += count;
        }
      });

      return globalStats;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas globales:', error);
      throw new Error(`Error al obtener estadísticas globales: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas semanales de un usuario
   * @param {number} userId - ID del usuario (referencia externa)
   * @param {number} days - Número de días hacia atrás (por defecto 7)
   * @returns {Object} - Estadísticas del período especificado
   */
  async getUserWeeklyStats(userId, days = 7) {
    try {
      console.log(`📊 Obteniendo estadísticas para usuario ${userId}, últimos ${days} días`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Obtener estadísticas del período especificado
      const stats = await this.getStatsForPeriod(userId, startDate, endDate);
      
      const weeklyStats = {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: days
        },
        stats: stats
      };
      
      console.log(`✅ Estadísticas obtenidas para usuario ${userId}`);
      return weeklyStats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas para un período específico
   * @param {number} userId - ID del usuario
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Object} - Estadísticas del período
   */
  async getStatsForPeriod(userId, startDate, endDate) {
    try {
      const questionStats = await ChatbotQuestion.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{ model: ChatbotCategory, attributes: ['name'] }],
        attributes: [
          [ChatbotQuestion.sequelize.fn('COUNT', ChatbotQuestion.sequelize.col('ChatbotQuestion.id')), 'count'],
          'category_id'
        ],
        group: ['category_id', 'ChatbotCategory.name']
      });

      // Inicializar estadísticas
      const stats = {
        preguntas_nutricion: 0,
        preguntas_entrenamiento: 0,
        preguntas_recuperacion: 0,
        preguntas_prevencion_lesiones: 0,
        preguntas_equipamiento: 0,
        score_ponderado: 0,
        total_preguntas: 0
      };

      // Mapear resultados de la BD a los nombres esperados
      const categoryMapping = {
        'Nutrición': 'preguntas_nutricion',
        'Entrenamiento': 'preguntas_entrenamiento', 
        'Recuperación': 'preguntas_recuperacion',
        'Prevención': 'preguntas_prevencion_lesiones',
        'Equipamiento': 'preguntas_equipamiento'
      };

      questionStats.forEach(stat => {
        const categoryName = stat.ChatbotCategory.name;
        const mappedKey = categoryMapping[categoryName];
        if (mappedKey) {
          stats[mappedKey] = parseInt(stat.dataValues.count);
          stats.total_preguntas += parseInt(stat.dataValues.count);
        }
      });

      // Calcular score ponderado
      stats.score_ponderado = this.calculateWeightedScore(stats);

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del período:', error);
      throw new Error(`Error al obtener estadísticas del período: ${error.message}`);
    }
  }
}

// Instancia singleton del servicio
const userStatsService = new UserStatsService();

/**
 * Inicializa las categorías en la base de datos
 */
async function initializeCategories() {
  try {
    const categories = [
      { name: 'Nutrición' },
      { name: 'Entrenamiento' },
      { name: 'Recuperación' },
      { name: 'Prevención' },
      { name: 'Equipamiento' }
    ];

    for (const category of categories) {
      await ChatbotCategory.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
    }

    console.log('✅ Categorías inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando categorías:', error);
    throw error;
  }
}

// Exportar funciones
module.exports = {
  updateUserStats: (userId, category) => userStatsService.updateUserStats(userId, category),
  getUserStats: (userId) => userStatsService.getUserStats(userId),
  getUserPreferences: (userId) => userStatsService.getUserPreferences(userId),
  getGlobalStats: () => userStatsService.getGlobalStats(),
  saveQuestion: (userId, question, category) => userStatsService.saveQuestion(userId, question, category),
  calculateWeightedScore: (stats) => userStatsService.calculateWeightedScore(stats),
  initializeCategories,
  getUserWeeklyStats: (userId, days) => userStatsService.getUserWeeklyStats(userId, days)
}; 