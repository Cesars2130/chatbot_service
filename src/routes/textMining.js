const express = require('express');
const router = express.Router();
const { classifyQuestion } = require('../services/textClassification');
const { validateQuestionInput } = require('../middleware/validation');
const { updateUserStats, saveQuestion, getUserStats, getUserWeeklyStats } = require('../services/userStats');

/**
 * @swagger
 * /api/text-mining/classify:
 *   post:
 *     summary: Clasifica una pregunta del usuario en categorías de fitness
 *     description: |
 *       Analiza una pregunta usando algoritmos de minería de texto y la clasifica en una de las 5 categorías:
 *       - **nutricion**: Preguntas sobre alimentación, suplementos, hidratación
 *       - **entrenamiento**: Preguntas sobre ejercicios, rutinas, técnicas
 *       - **recuperacion**: Preguntas sobre descanso, estiramientos, recuperación
 *       - **prevencion**: Preguntas sobre prevención de lesiones, fortalecimiento
 *       - **equipamiento**: Preguntas sobre ropa, calzado, tecnología deportiva
 *       
 *       La pregunta se guarda automáticamente en la base de datos y se actualizan las estadísticas del usuario.
 *     tags: [Text Mining]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionRequest'
 *           examples:
 *             nutricion:
 *               summary: Pregunta sobre nutrición
 *               value:
 *                 question: "¿Qué debo comer antes de correr?"
 *                 userId: 123
 *             entrenamiento:
 *               summary: Pregunta sobre entrenamiento
 *               value:
 *                 question: "¿Cómo mejorar mi resistencia?"
 *                 userId: 123
 *             recuperacion:
 *               summary: Pregunta sobre recuperación
 *               value:
 *                 question: "¿Cómo estirar después del ejercicio?"
 *                 userId: 123
 *             equipamiento:
 *               summary: Pregunta sobre equipamiento
 *               value:
 *                 question: "¿Qué zapatillas debo usar?"
 *                 userId: 123
 *     responses:
 *       200:
 *         description: Pregunta clasificada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificationResponse'
 *             examples:
 *               nutricion:
 *                 summary: Respuesta para pregunta de nutrición
 *                 value:
 *                   success: true
 *                   category: "nutricion"
 *                   confidence: 85.5
 *                   userStats:
 *                     preguntas_nutricion: 5
 *                     preguntas_entrenamiento: 12
 *                     preguntas_recuperacion: 3
 *                     preguntas_prevencion_lesiones: 2
 *                     preguntas_equipamiento: 1
 *                     score_ponderado: 45.5
 *                     ultima_actualizacion: "2024-01-15T10:30:00.000Z"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Datos de entrada inválidos"
 *               details: [
 *                 "La pregunta debe tener al menos 3 caracteres",
 *                 "El ID de usuario debe ser un número entero positivo"
 *               ]
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Error al clasificar la pregunta"
 *               message: "Error interno del servidor"
 */
router.post('/classify', validateQuestionInput, async (req, res) => {
  try {
    const { question, userId } = req.body;
    
    console.log(`🔍 Clasificando pregunta para usuario ${userId}: "${question}"`);
    
    // Clasificar la pregunta
    const classificationResult = await classifyQuestion(question);
    
    // Guardar la pregunta en la base de datos
    await saveQuestion(userId, question, classificationResult.category);
    
    // Actualizar estadísticas del usuario
    const userStats = await updateUserStats(userId, classificationResult.category);
    
    const response = {
      success: true,
      category: classificationResult.category,
      confidence: classificationResult.confidence,
      userStats: userStats,
      timestamp: new Date().toISOString()
    };
    
    console.log(` Pregunta clasificada como: ${classificationResult.category} (confianza: ${classificationResult.confidence})`);
    
    res.json(response);
    
  } catch (error) {
    console.error(' Error en clasificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al clasificar la pregunta',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/text-mining/stats/{userId}:
 *   get:
 *     summary: Obtiene las estadísticas de clasificación de un usuario
 *     description: |
 *       Retorna las estadísticas completas de un usuario, incluyendo:
 *       - Número de preguntas por categoría
 *       - Score ponderado basado en los pesos de cada categoría
 *       - Fecha de última actualización
 *       
 *       Las estadísticas se calculan en tiempo real desde la base de datos.
 *     tags: [Text Mining]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del usuario (referencia externa)
 *         example: 123
 *     responses:
 *       200:
 *         description: Estadísticas del usuario obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatsResponse'
 *             example:
 *               success: true
 *               stats:
 *                 userId: 123
 *                 preguntas_nutricion: 5
 *                 preguntas_entrenamiento: 12
 *                 preguntas_recuperacion: 3
 *                 preguntas_prevencion_lesiones: 2
 *                 preguntas_equipamiento: 1
 *                 score_ponderado: 45.5
 *                 ultima_actualizacion: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Usuario no encontrado"
 *               message: "No se encontraron estadísticas para el usuario 999"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await getUserStats(parseInt(userId));
    
    res.json({
      success: true,
      stats: {
        userId: parseInt(userId),
        ...stats
      }
    });
    
  } catch (error) {
    console.error(' Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/text-mining/stats/{userId}/weekly:
 *   get:
 *     summary: Obtiene las estadísticas de clasificación de un usuario de los últimos días
 *     description: |
 *       Retorna las estadísticas de un usuario para los últimos N días, incluyendo:
 *       - Número de preguntas por categoría en el período especificado
 *       - Score ponderado del período
 *       - Fecha de inicio y fin del período
 *       - Total de preguntas realizadas
 *       
 *       Las estadísticas se calculan en tiempo real desde la base de datos.
 *     tags: [Text Mining]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del usuario (referencia externa)
 *         example: 123
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Número de días hacia atrás para calcular estadísticas (por defecto 7)
 *         example: 7
 *     responses:
 *       200:
 *         description: Estadísticas del usuario obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-10"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-17"
 *                     days:
 *                       type: integer
 *                       example: 7
 *                 stats:
 *                   type: object
 *                   properties:
 *                     preguntas_nutricion:
 *                       type: integer
 *                       example: 3
 *                     preguntas_entrenamiento:
 *                       type: integer
 *                       example: 8
 *                     preguntas_recuperacion:
 *                       type: integer
 *                       example: 2
 *                     preguntas_prevencion_lesiones:
 *                       type: integer
 *                       example: 1
 *                     preguntas_equipamiento:
 *                       type: integer
 *                       example: 0
 *                     score_ponderado:
 *                       type: number
 *                       format: float
 *                       example: 32.0
 *                     total_preguntas:
 *                       type: integer
 *                       example: 14
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats/:userId/weekly', async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 7;
    
    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro days inválido',
        message: 'El parámetro days debe estar entre 1 y 30'
      });
    }
    
    const stats = await getUserWeeklyStats(parseInt(userId), days);
    
    res.json({
      success: true,
      ...stats
    });
    
  } catch (error) {
    console.error(' Error obteniendo estadísticas semanales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas semanales',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/text-mining/categories:
 *   get:
 *     summary: Obtiene las categorías disponibles y sus pesos
 *     description: |
 *       Retorna información sobre las 5 categorías disponibles para clasificación:
 *       
 *       | Categoría | Peso | Descripción |
 *       |-----------|------|-------------|
 *       | entrenamiento | 3 | Preguntas sobre rutinas, ejercicios, técnicas |
 *       | nutricion | 2 | Preguntas sobre alimentación, suplementos |
 *       | recuperacion | 2 | Preguntas sobre descanso, recuperación |
 *       | prevencion | 2 | Preguntas sobre prevención de lesiones |
 *       | equipamiento | 1 | Preguntas sobre ropa, calzado, tecnología |
 *       
 *       Los pesos se utilizan para calcular el score ponderado del usuario.
 *     tags: [Text Mining]
 *     responses:
 *       200:
 *         description: Categorías obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriesResponse'
 *             example:
 *               success: true
 *               categories: [
 *                 {
 *                   name: "entrenamiento",
 *                   weight: 3,
 *                   description: "Preguntas sobre rutinas, ejercicios, técnicas"
 *                 },
 *                 {
 *                   name: "nutricion",
 *                   weight: 2,
 *                   description: "Preguntas sobre alimentación, suplementos"
 *                 },
 *                 {
 *                   name: "recuperacion",
 *                   weight: 2,
 *                   description: "Preguntas sobre descanso, recuperación"
 *                 },
 *                 {
 *                   name: "prevencion",
 *                   weight: 2,
 *                   description: "Preguntas sobre prevención de lesiones"
 *                 },
 *                 {
 *                   name: "equipamiento",
 *                   weight: 1,
 *                   description: "Preguntas sobre ropa, calzado, tecnología"
 *                 }
 *               ]
 */
router.get('/categories', (req, res) => {
  const categories = [
    { name: 'entrenamiento', weight: 3, description: 'Preguntas sobre rutinas, ejercicios, técnicas' },
    { name: 'nutricion', weight: 2, description: 'Preguntas sobre alimentación, suplementos' },
    { name: 'recuperacion', weight: 2, description: 'Preguntas sobre descanso, recuperación' },
    { name: 'prevencion', weight: 2, description: 'Preguntas sobre prevención de lesiones' },
    { name: 'equipamiento', weight: 1, description: 'Preguntas sobre ropa, calzado, tecnología' }
  ];
  
  res.json({
    success: true,
    categories: categories
  });
});

module.exports = router; 