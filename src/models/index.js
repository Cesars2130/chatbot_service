const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const ChatbotCategory = sequelize.define('ChatbotCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'chatbot_categories',
  timestamps: false
});


const ChatbotQuestion = sequelize.define('ChatbotQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,

    comment: 'ID del usuario (referencia externa desde otro microservicio)'
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chatbot_categories',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chatbot_questions',
  timestamps: false
});


ChatbotQuestion.belongsTo(ChatbotCategory, { foreignKey: 'category_id' });


const initializeCategories = async () => {
  try {
    const categories = [
      { name: 'nutricion' },
      { name: 'entrenamiento' },
      { name: 'recuperacion' },
      { name: 'prevencion' },
      { name: 'equipamiento' }
    ];

    for (const category of categories) {
      await ChatbotCategory.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
    }
    
    console.log(' Categorías del chatbot inicializadas correctamente');
  } catch (error) {
    console.error(' Error inicializando categorías:', error);
  }
};

module.exports = {
  sequelize,
  ChatbotCategory,
  ChatbotQuestion,
  initializeCategories
}; 