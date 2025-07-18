const Joi = require('joi');


const questionClassificationSchema = Joi.object({
  question: Joi.string()
    .required()
    .min(3)
    .max(1000)
    .messages({
      'string.empty': 'La pregunta no puede estar vacía',
      'string.min': 'La pregunta debe tener al menos 3 caracteres',
      'string.max': 'La pregunta no puede exceder 1000 caracteres',
      'any.required': 'La pregunta es requerida'
    }),
  userId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un número entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es requerido'
    })
});

/**
 * Middleware para validar datos de entrada en clasificación de preguntas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const validateQuestionInput = (req, res, next) => {
  try {
    const { error, value } = questionClassificationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: errorMessages
      });
    }

    // Asignar datos validados al request
    req.validatedData = value;
    next();
    
  } catch (validationError) {
    console.error('Error en validación:', validationError);
    return res.status(500).json({
      success: false,
      error: 'Error interno en validación'
    });
  }
};

/**
 * Esquema de validación para obtener estadísticas de usuario
 */
const userStatsSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID de usuario debe ser un número',
      'number.integer': 'El ID de usuario debe ser un número entero',
      'number.positive': 'El ID de usuario debe ser positivo',
      'any.required': 'El ID de usuario es requerido'
    })
});

/**
 * Middleware para validar parámetros de usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const validateUserId = (req, res, next) => {
  try {
    const { error, value } = userStatsSchema.validate({
      userId: parseInt(req.params.userId)
    }, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'ID de usuario inválido',
        details: errorMessages
      });
    }

    // Asignar datos validados al request
    req.validatedUserId = value.userId;
    next();
    
  } catch (validationError) {
    console.error(' Error en validación de userId:', validationError);
    return res.status(500).json({
      success: false,
      error: 'Error interno en validación'
    });
  }
};

/**
 * Middleware para validar límites de rate limiting
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const validateRateLimit = (req, res, next) => {
  // Implementar lógica de rate limiting aquí
  // Por ahora solo pasamos al siguiente middleware
  next();
};

/**
 * Middleware para sanitizar texto de entrada
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const sanitizeText = (req, res, next) => {
  if (req.body.question) {
    // Remover caracteres potencialmente peligrosos
    req.body.question = req.body.question
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  next();
};

module.exports = {
  validateQuestionInput,
  validateUserId,
  validateRateLimit,
  sanitizeText
}; 