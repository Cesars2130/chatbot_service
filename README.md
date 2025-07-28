# RunInsight Chatbot Mining Service

Servicio de microservicios para clasificación automática de preguntas del chatbot RunInsight usando minería de texto y algoritmos de clasificación.

## 🚀 Características

- **Clasificación Automática**: Analiza preguntas y las clasifica en 5 categorías de fitness
- **Lematización avanzada**: El texto y el banco de palabras clave se lematizan para mejorar la robustez ante variantes gramaticales.
- **Tolerancia a errores ortográficos**: Se utiliza la distancia de Levenshtein para detectar palabras clave aunque el usuario escriba con errores menores (hasta 2 letras de diferencia).
- **Base de Datos MySQL**: Almacenamiento persistente con Sequelize ORM
- **API RESTful**: Endpoints bien documentados con Swagger
- **Estadísticas de Usuario**: Seguimiento de preguntas por categoría
- **Health Checks**: Monitoreo de salud del servicio
- **Arquitectura de Microservicios**: Servicio independiente sin dependencias externas

---

### ¿Cómo funciona la clasificación?

1. **Lematización**: Todas las palabras del texto y del banco de palabras clave se reducen a su forma base (ej: "corriendo" → "correr").
2. **Comparación flexible**: Si una palabra del usuario no coincide exactamente con una palabra clave, se calcula la distancia de Levenshtein. Si la distancia es ≤ 2, se considera coincidencia parcial.
3. **Ponderación**: Las coincidencias exactas tienen mayor peso, las aproximadas menor, y se calcula un score ponderado por categoría.
4. **Resultado**: Se retorna la categoría con mayor score y el nivel de confianza.

---

## 📋 Categorías de Clasificación

| Categoría | Peso | Descripción |
|-----------|------|-------------|
| **entrenamiento** | 3 | Rutinas, ejercicios, técnicas, resistencia |
| **nutricion** | 2 | Alimentación, suplementos, hidratación |
| **recuperacion** | 2 | Descanso, estiramientos, recuperación |
| **prevencion** | 2 | Prevención de lesiones, fortalecimiento |
| **equipamiento** | 1 | Ropa, calzado, tecnología deportiva |

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de datos
- **Sequelize** - ORM para MySQL
- **Swagger** - Documentación de API
- **Railway** - Plataforma de despliegue

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### Configuración Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd chatbot-minning-service
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=runinsight_chatbot
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   PORT=3000
   NODE_ENV=development
   ```

4. **Crear base de datos**
   ```sql
   CREATE DATABASE runinsight_chatbot;
   ```

5. **Ejecutar migraciones**
   ```bash
   npm run migrate
   ```

6. **Iniciar servidor**
   ```bash
   npm start
   ```

## 📚 Documentación de la API

### Swagger UI

La documentación interactiva está disponible en:
- **Local**: http://localhost:3000/api-docs
- **Producción**: https://tu-dominio.com/api-docs

### Endpoints Principales

#### 🔍 Clasificar Pregunta
```http
POST /api/text-mining/classify
Content-Type: application/json

{
  "question": "¿Qué debo comer antes de correr?",
  "userId": 123
}
```

#### 📊 Obtener Estadísticas
```http
GET /api/text-mining/stats/123
```

#### 📈 Obtener Estadísticas por Período
```http
GET /api/text-mining/stats/123/weekly
GET /api/text-mining/stats/123/weekly?days=14
```

**Parámetros:**
- `userId` (path): ID del usuario
- `days` (query, opcional): Número de días hacia atrás (1-30, por defecto 7)

**Respuesta incluye:**
- Período analizado (fechas de inicio y fin)
- Estadísticas del período especificado
- Preguntas por categoría
- Score ponderado
- Total de preguntas

#### 📋 Obtener Categorías
```http
GET /api/text-mining/categories
```

#### 🏥 Health Check
```http
GET /api/health
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm test
```

### Probar Clasificación
```bash
node demo/test-expanded-keywords.js
```

### Probar Estadísticas por Período
```bash
node demo/test-weekly-stats.js
```

### Ejemplos de Preguntas

#### Nutrición
- "¿Qué debo comer antes de correr?"
- "¿Cuánta agua debo tomar?"
- "¿Son buenos los suplementos de proteína?"

#### Entrenamiento
- "¿Cómo mejorar mi resistencia?"
- "¿Cuál es la mejor rutina para principiantes?"
- "¿Cómo hacer sentadillas correctamente?"

#### Recuperación
- "¿Cómo estirar después del ejercicio?"
- "¿Cuánto tiempo debo descansar?"
- "¿Qué hacer para el dolor muscular?"

#### Prevención
- "¿Cómo prevenir lesiones de rodilla?"
- "¿Qué ejercicios fortalecen la espalda?"
- "¿Cómo evitar calambres?"

#### Equipamiento
- "¿Qué zapatillas debo usar?"
- "¿Es bueno usar reloj deportivo?"
- "¿Qué ropa usar para correr?"

## 🚀 Despliegue

### Railway (Recomendado)

1. **Conectar repositorio** a Railway
2. **Configurar variables de entorno**:
   - `DB_HOST`
   - `DB_PORT` 
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `PORT`
   - `NODE_ENV=production`
3. **Desplegar automáticamente**

### Variables de Entorno de Producción

```env
DB_HOST=tu-host-mysql
DB_PORT=3306
DB_NAME=runinsight_chatbot
DB_USER=tu_usuario_prod
DB_PASSWORD=tu_password_prod
PORT=3000
NODE_ENV=production
```

## 📊 Estructura de Base de Datos

### Tabla: `chatbot_categories`
```sql
CREATE TABLE chatbot_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: `chatbot_questions`
```sql
CREATE TABLE chatbot_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  question TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);
```

### Tabla: `user_stats`
```sql
CREATE TABLE user_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  preguntas_nutricion INT DEFAULT 0,
  preguntas_entrenamiento INT DEFAULT 0,
  preguntas_recuperacion INT DEFAULT 0,
  preguntas_prevencion_lesiones INT DEFAULT 0,
  preguntas_equipamiento INT DEFAULT 0,
  score_ponderado DECIMAL(10,2) DEFAULT 0.00,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_score (score_ponderado)
);
```

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo con nodemon
npm test           # Ejecutar tests
npm run migrate    # Ejecutar migraciones de BD
```

## 📈 Monitoreo

### Health Checks
- **Health**: `/api/health` - Estado general del servicio
- **Ready**: `/api/health/ready` - Servicio listo para tráfico
- **Live**: `/api/health/live` - Proceso vivo

### Métricas
- Uptime del servicio
- Uso de memoria
- Estado de servicios internos
- Versión del servicio

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Email**: support@runinsight.com
- **Documentación**: `/api-docs`
- **Issues**: GitHub Issues

---

**RunInsight Team** - Haciendo el fitness más inteligente 🤖💪 