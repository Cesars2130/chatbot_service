require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const healthRoutes = require('./routes/health');
const textMiningRoutes = require('./routes/textMining');

const { initializeDatabase } = require('./config/database');
const { initializeCategories } = require('./services/userStats');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RunInsight Chatbot Mining Service API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
}));

app.get('/', (req, res) => {
  res.json({
    message: 'RunInsight Chatbot Mining Service API',
    version: '1.0.0',
    description: 'API para clasificación automática de preguntas del chatbot RunInsight',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      textMining: '/api/text-mining',
      categories: '/api/text-mining/categories'
    },
    contact: {
      email: 'support@runinsight.com'
    }
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/text-mining', textMiningRoutes);

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: {
      documentation: '/api-docs',
      health: '/api/health',
      textMining: '/api/text-mining'
    }
  });
});

async function initializeApp() {
  try {
    console.log('Inicializando RunInsight Chatbot Mining Service...');
    
    await initializeDatabase();
    console.log('Base de datos inicializada');
  
    await initializeCategories();
    console.log('Categorías inicializadas');
    
    app.listen(PORT, () => {
      console.log(` Servidor ejecutándose en puerto ${PORT}`);
 
    });
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

initializeApp();

module.exports = app; 