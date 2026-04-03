const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importer les routes
const integrationRoutes = require('./routes/integrations');
const logRoutes = require('./routes/logs');
const statsRoutes = require('./routes/stats');

const app = express();

// ==================== MIDDLEWARES ====================
app.use(helmet()); // Sécurité
app.use(cors()); // CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL encoded
app.use(morgan('dev')); // Logs des requêtes

// Middleware de logging personnalisé (optionnel, morgan fait déjà ça)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ==================== CONNEXION MONGODB ====================
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connecté avec succès');
  console.log('📊 Base de données:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:', err.message);
  console.error('💡 Vérifiez que MongoDB est démarré ou que votre URI est correcte');
});

// ==================== ROUTES API ====================
app.use('/api/integrations', integrationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/stats', statsRoutes);

// ==================== ROUTES DE TEST ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API fonctionne correctement!',
    timestamp: new Date(),
    routes: {
      integrations: '/api/integrations',
      logs: '/api/logs',
      stats: '/api/stats'
    }
  });
});

// ==================== GESTION DES ERREURS ====================
// Middleware pour les routes non trouvées (404)
app.use((req, res, next) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.url} non trouvée`,
    message: 'Vérifiez que l\'URL est correcte'
  });
});

// Middleware de gestion des erreurs global (doit être le dernier)
app.use((err, req, res, next) => {
  console.error('🔥 ERREUR GLOBALE:', err.stack);
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Erreur de validation', details: errors });
  }
  
  // Erreur de duplication (index unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `La valeur pour ${field} existe déjà` });
  }
  
  // Erreur générique
  res.status(500).json({ 
    error: err.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 MuleSoft Integration Platform - Backend          ║
╠
╚══════════════════════════════════════════════════════════╝
  `);
});