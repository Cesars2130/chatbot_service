const natural = require('natural');
const nlp = require('compromise');

/**
 * Servicio de clasificación de texto para preguntas de fitness
 * Mejorado: Lematización robusta y comparación con distancia de Levenshtein
 */
class TextClassificationService {
  constructor() {
    this.categories = {
      nutricion: {
        keywords: [
          
          'comer', 'alimentación', 'dieta', 'nutrición', 'comida', 'alimento', 'alimentos',
          'proteína', 'proteínas', 'carbohidratos', 'grasas', 'lípidos', 'fibra', 'azúcar',
          'vitaminas', 'minerales', 'calcio', 'hierro', 'magnesio', 'potasio', 'sodio',
          'hidratación', 'hidratar', 'agua', 'bebida', 'bebidas', 'líquido', 'líquidos',
          'suplementos', 'suplemento', 'proteína en polvo', 'creatina', 'bcaa', 'omega 3',
          'desayuno', 'almuerzo', 'cena', 'snack', 'merienda', 'colación',
          'antes', 'después', 'durante', 'pre-entrenamiento', 'post-entrenamiento',
          'bebida isotónica', 'batido', 'smoothie', 'jugo', 'té', 'café',
          'calorías', 'macronutrientes', 'micronutrientes', 'metabolismo', 'digestión',
          'pollo', 'pescado', 'huevos', 'leche', 'yogur', 'queso', 'frutas', 'verduras',
          'arroz', 'pasta', 'pan', 'avena', 'nueces', 'almendras', 'semillas'
        ],
        weight: 2
      },
      entrenamiento: {
        keywords: [
          'entrenar', 'ejercicio', 'ejercicios', 'rutina', 'rutinas', 'entrenamiento',
          'series', 'repeticiones', 'reps', 'sets', 'circuitos', 'superseries',
          'intensidad', 'frecuencia', 'volumen', 'progresión', 'sobrecarga',
          'plan', 'programa', 'sesión', 'periodización', 'ciclos', 'fases',
          'calentamiento', 'enfriamiento', 'warm up', 'cool down',
          'técnica', 'forma', 'postura', 'ejecución', 'movimiento', 'gesto',
          'resistencia', 'cardio', 'aeróbico', 'anaeróbico', 'endurance',
          'correr', 'carrera', 'running', 'jogging', 'trotar', 'sprint',
          'correr más rápido', 'mejorar resistencia', 'aumentar velocidad',
          'plan de entrenamiento', 'programa de entrenamiento', 'rutina semanal',
          'velocidad', 'distancia', 'kilómetros', 'km', 'minutos', 'tiempo',
          'ritmo', 'paso', 'cadencia', 'frecuencia cardíaca', 'fc',
          'objetivo', 'meta', 'lograr', 'alcanzar', 'conseguir',
          'entrenamiento cruzado', 'intervalos', 'fartlek', 'fuerza', 'hiit',
          'entrenamientos', 'workout', 'gimnasio', 'pesas', 'mancuernas',
          'sentadillas', 'peso muerto', 'press banca', 'dominadas', 'flexiones',
          'plancha', 'burpees', 'mountain climbers', 'jumping jacks'
        ],
        weight: 3
      },
      recuperacion: {
        keywords: [
          'recuperación', 'recuperar', 'descanso', 'descansar', 'reposo', 'pausa',
          'sueño', 'dormir', 'dormir bien', 'calidad del sueño', 'horas de sueño',
          'fatiga', 'cansancio', 'cansado', 'agotado', 'exhausto', 'tired',
          'relajar', 'relajación', 'relajarse', 'tranquilidad', 'paz',
          'recuperación muscular', 'regeneración', 'regenerar', 'reparación',
          'recuperación activa', 'recuperación pasiva', 'recuperación entre entrenamientos',
          'estiramiento', 'estirar', 'estiramientos', 'flexibilidad', 'mobilidad',
          'elongación', 'elongar', 'stretching', 'yoga', 'pilates',
          'masaje', 'masajear', 'automasaje', 'foam roller', 'rodillo', 'pelota',
          'hielo', 'calor', 'compresión', 'elevación', 'rice', 'crioterapia',
          'fisioterapia', 'terapia física', 'terapia manual', 'osteopatía',
          'quiropraxia', 'acupuntura', 'reflexología',
          'periodización', 'ciclos de descanso', 'días de descanso',
          'recuperación mental', 'estrés', 'ansiedad', 'meditación', 'mindfulness',
          'contraste', 'sauna', 'baño turco', 'hidroterapia', 'electroestimulación',
          'compresión graduada', 'vendaje neuromuscular', 'kinesiotape'
        ],
        weight: 2
      },
      prevencion: {
        keywords: [
          'lesión', 'lesiones', 'lesionado', 'lesionarse', 'daño', 'trauma',
          'prevención', 'prevenir', 'evitar', 'proteger', 'cuidar', 'cuidado',
          'dolor', 'dolores', 'molestia', 'molestias', 'incomodidad', 'malestar',
          'problema', 'problemas', 'inconveniente', 'dificultad', 'obstáculo',
          'seguridad', 'seguro', 'protección', 'precaución', 'cautela',
          'riesgo', 'peligro', 'amenaza', 'vulnerable', 'susceptible',
          'tratamiento', 'tratar', 'cura', 'sanar', 'curar', 'reparar',
          'rehabilitación', 'rehabilitar', 'recuperación de lesiones',
          'fisioterapia', 'terapia física', 'terapia ocupacional',
          'vendaje', 'venda', 'vendajes', 'soporte', 'férula', 'ortesis',
          'fortalecimiento', 'fortalecer', 'fortalecido', 'resistencia',
          'estiramiento', 'estirar', 'flexibilidad', 'mobilidad',
          'calentar', 'calentamiento', 'preparación', 'preparar',
          'enfriamiento', 'enfriar', 'relajar músculos',
          'propiocepción', 'equilibrio', 'estabilidad', 'coordinación',
          'control motor', 'patrón de movimiento'
        ],
        weight: 2
      },
      equipamiento: {
        keywords: [
          'zapatillas', 'tenis', 'calzado', 'zapatos', 'botas', 'sandalias',
          'zapatillas running', 'zapatillas trail', 'zapatillas gym',
          'zapatillas crossfit', 'zapatillas minimalistas', 'zapatillas maximalistas',
          'ropa', 'camiseta', 'pantalón', 'short', 'calcetas', 'calcetines',
          'leggings', 'mallas', 'top', 'sujetador deportivo', 'brasier deportivo',
          'chaqueta', 'sudaderas', 'hoodie', 'polo', 'camisa', 'falda deportiva',
          'gorra', 'sombrero', 'bandana', 'banda', 'diadema', 'visor',
          'gafas', 'lentes', 'gafas de sol', 'gafas deportivas',
          'reloj', 'smartwatch', 'pulsómetro', 'banda cardíaca', 'monitor cardíaco',
          'gps', 'podómetro', 'contador de pasos', 'fitness tracker',
          'app', 'aplicación', 'tecnología', 'gadget', 'dispositivo',
          'botella', 'botella de agua', 'termo', 'cantimplora', 'hidratación',
          'mochila', 'bolsa', 'bolso',
          'cinturón', 'cinturón de levantamiento', 'faja', 'soporte lumbar',
          'rodilleras', 'coderas', 'muñequeras', 'tobilleras',
          'auriculares', 'audífonos', 'headphones', 'bluetooth', 'inalámbricos',
          'cableados', 'earbuds', 'airpods',
          'pesas', 'mancuernas', 'barras', 'discos', 'kettlebells', 'pelotas',
          'bandas elásticas', 'resistance bands', 'cuerdas', 'cuerda de saltar',
          'mat', 'colchoneta', 'yoga mat', 'foam roller', 'rodillo',
          'bicicleta', 'bici', 'spinning', 'treadmill', 'cinta', 'eliptica',
          'stepper', 'escaladora', 'remadora', 'rowing machine',
          'accesorio', 'accesorios', 'herramienta', 'herramientas', 'material',
          'materiales', 'instrumento', 'instrumentos', 'aparato', 'aparatos',
          'mejores', 'usar', 'recomiendas', 'recomendación', 'opción',
          'deportivo', 'deportivos', 'fitness', 'gym', 'entrenamiento',
          'nike', 'adidas', 'puma', 'reebok', 'under armour', 'lululemon',
          'garmin', 'polar', 'suunto', 'fitbit', 'apple watch'
        ],
        weight: 1
      }
    };
    
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Preprocesa y lematiza el texto para mejorar la clasificación
   * @param {string} text - Texto a preprocesar
   * @returns {Array} - Array de lemas (palabras base)
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('El texto debe ser una cadena válida');
    }
    let processedText = text.toLowerCase();
    processedText = processedText.replace(/[^ -\w\sáéíóúñü]/g, ' ');
    processedText = processedText.replace(/\s+/g, ' ').trim();
    const doc = nlp(processedText);
    // Usar compromise para lematizar
    const lemmatized = doc.terms().out('array').map(t => nlp(t).normalize().terms().out('lemma'));
    // Si compromise no lematiza, usar el token original
    return lemmatized.map((lemma, i) => lemma || doc.terms().out('array')[i]);
  }

  /**
   * Lematiza el banco de palabras clave de cada categoría
   * @param {Array} keywords - Palabras clave originales
   * @returns {Array} - Palabras clave lematizadas
   */
  lemmatizeKeywords(keywords) {
    return keywords.map(word => {
      const doc = nlp(word.toLowerCase());
      const lemma = doc.terms().out('lemma');
      return lemma || word.toLowerCase();
    });
  }

  /**
   * Calcula la similitud entre el texto y una categoría usando lematización y distancia de Levenshtein
   * @param {Array} tokens - Lemas del texto a clasificar
   * @param {string} category - Categoría a evaluar
   * @returns {Object} - Score de similitud
   */
  calculateSimilarity(tokens, category) {
    // Lematizar el banco de palabras clave
    const categoryKeywords = this.lemmatizeKeywords(this.categories[category].keywords);
    let matchCount = 0;
    let totalScore = 0;
    const levenshteinThreshold = 2; // Permitir hasta 2 cambios
    tokens.forEach(token => {
      // Coincidencia exacta
      if (categoryKeywords.includes(token)) {
        matchCount++;
        totalScore += 1;
      } else {
        // Coincidencia por Levenshtein
        for (const keyword of categoryKeywords) {
          if (natural.LevenshteinDistance(token, keyword, {search: true}) <= levenshteinThreshold) {
            matchCount++;
            totalScore += 0.7; // Menor peso para coincidencia aproximada
            break;
          }
        }
      }
    });
    const baseScore = (matchCount / tokens.length) * 100;
    const weightedScore = baseScore * this.categories[category].weight;
    return {
      score: weightedScore,
      matchCount,
      totalTokens: tokens.length,
      matchRatio: matchCount / tokens.length
    };
  }

  /**
   * Clasifica una pregunta usando lematización y Levenshtein
   * @param {string} question - Pregunta a clasificar
   * @returns {Object} - Resultado de la clasificación
   */
  async classifyQuestion(question) {
    try {
      const tokens = this.preprocessText(question);
      const scores = {};
      let maxScore = 0;
      let bestCategory = null;
      let bestMatchCount = 0;

      for (const category of Object.keys(this.categories)) {
        const similarity = this.calculateSimilarity(tokens, category);
        scores[category] = similarity;

        if (similarity.score > maxScore || (similarity.score === maxScore && similarity.matchCount > bestMatchCount)) {
          maxScore = similarity.score;
          bestCategory = category;
          bestMatchCount = similarity.matchCount;
        }
      }

      // Lógica de palabras fuertes actualizada para usar Levenshtein
      const strongWordsMap = {
        nutricion: ['proteína', 'dieta', 'comer', 'alimentación', 'nutrición', 'calorías', 'hidratación'],
        entrenamiento: ['ejercicio', 'entrenar', 'rutina', 'correr', 'resistencia', 'velocidad', 'fuerza'],
        recuperacion: ['descanso', 'recuperación', 'estirar', 'estiramiento', 'relajar', 'dormir'],
        prevencion: ['lesión', 'prevención', 'dolor', 'seguridad', 'proteger', 'cuidar'],
        equipamiento: ['zapatillas', 'ropa', 'calzado', 'equipo', 'accesorio', 'tecnología']
      };

      for (const [category, strongWords] of Object.entries(strongWordsMap)) {
        const hasStrongWords = strongWords.some(word => 
          tokens.some(token => natural.LevenshteinDistance(token, word, { search: true }) <= 2)
        );
        if (hasStrongWords && scores[category].matchCount > 0) {
          scores[category].score *= 2;
          if (scores[category].score > maxScore) {
            maxScore = scores[category].score;
            bestCategory = category;
            bestMatchCount = scores[category].matchCount;
          }
        }
      }

      const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
      const confidence = totalScore > 0 ? (maxScore / totalScore) * 100 : 0;

      if (confidence < 20) {
        bestCategory = 'entrenamiento';
      }

      // Mapear categoría interna a nombre de BD
      const categoryMapping = {
        'nutricion': 'Nutrición',
        'entrenamiento': 'Entrenamiento',
        'recuperacion': 'Recuperación',
        'prevencion': 'Prevención',
        'equipamiento': 'Equipamiento'
      };

      const dbCategoryName = categoryMapping[bestCategory] || bestCategory;

      return {
        category: dbCategoryName, // Usar nombre de BD
        confidence: Math.round(confidence * 100) / 100,
        scores: scores,
        processedText: tokens.join(' '),
        originalText: question
      };
    } catch (error) {
      console.error('❌ Error en clasificación:', error);
      throw new Error(`Error al clasificar la pregunta: ${error.message}`);
    }
  }
}

const textClassificationService = new TextClassificationService();

module.exports = {
  classifyQuestion: (question) => textClassificationService.classifyQuestion(question),
  preprocessText: (text) => textClassificationService.preprocessText(text)
}; 