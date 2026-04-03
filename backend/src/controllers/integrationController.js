const Integration = require('../models/Integration');  // ✅ Pas d'accolades
const Log = require('../models/Log');

// Récupérer toutes les intégrations
exports.getAllIntegrations = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const integrations = await Integration.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Integration.countDocuments();
    
    res.json({
      integrations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ Erreur getAllIntegrations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une intégration par ID
exports.getIntegrationById = async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    res.json(integration);
  } catch (error) {
    console.error('❌ Erreur getIntegrationById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Créer une intégration
exports.createIntegration = async (req, res) => {
  console.log('📥 POST /api/integrations - Données reçues:', JSON.stringify(req.body, null, 2));
  
  try {
    // Validation des données requises
    if (!req.body.name) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }
    
    if (!req.body.config || !req.body.config.endpoint) {
      return res.status(400).json({ error: "L'URL est requise" });
    }
    
    // Création de l'intégration avec la structure attendue par votre modèle
    const integrationData = {
      name: req.body.name,
      type: req.body.type || 'REST',
      description: req.body.description || '',
      config: {
        endpoint: req.body.config.endpoint,
        method: req.body.config.method || 'GET',
        headers: req.body.config.headers || {},
        timeout: req.body.config.timeout || 30000,
        retryCount: req.body.config.retryCount || 3,
        retryDelay: req.body.config.retryDelay || 1000,
        authentication: {
          authType: req.body.config.authentication?.authType || 'none',
          credentials: req.body.config.authentication?.credentials || {}
        }
      },
      status: req.body.status || 'active',
      environment: req.body.environment || 'development',
      createdBy: req.user?.id || 'system',
      tags: req.body.tags || []
    };
    
    const integration = new Integration(integrationData);
    await integration.save();
    
    console.log('✅ Intégration créée avec ID:', integration._id);
    
    // Création du log (optionnelle)
    try {
      await Log.create({
        integrationId: integration._id,
        level: 'info',
        message: `Intégration ${integration.name} créée avec succès`,
        details: { action: 'create', user: req.user?.id || 'system' }
      });
    } catch (logError) {
      console.warn('⚠️ Erreur création log (non bloquante):', logError.message);
    }
    
    res.status(201).json(integration);
  } catch (error) {
    console.error('❌ Erreur createIntegration:', error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: 'Erreur de validation', details: errors });
    }
    
    // Gestion des erreurs de duplication (nom unique)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Une intégration avec ce nom existe déjà' });
    }
    
    res.status(400).json({ error: error.message });
  }
};

// Mettre à jour une intégration (complète)
exports.updateIntegration = async (req, res) => {
  try {
    const integration = await Integration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    
    // Log de mise à jour
    try {
      await Log.create({
        integrationId: integration._id,
        level: 'info',
        message: `Intégration ${integration.name} mise à jour`,
        details: { action: 'update' }
      });
    } catch (logError) {
      console.warn('⚠️ Erreur log:', logError.message);
    }
    
    res.json(integration);
  } catch (error) {
    console.error('❌ Erreur updateIntegration:', error);
    res.status(400).json({ error: error.message });
  }
};

// Mettre à jour partiellement une intégration
exports.patchIntegration = async (req, res) => {
  try {
    const integration = await Integration.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    
    res.json(integration);
  } catch (error) {
    console.error('❌ Erreur patchIntegration:', error);
    res.status(400).json({ error: error.message });
  }
};

// Tester une intégration
exports.testIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const integration = await Integration.findById(id);
    
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    
    console.log(`🧪 Test de l'intégration: ${integration.name}`);
    console.log(`📍 Endpoint: ${integration.config.endpoint}`);
    console.log(`🔧 Méthode: ${integration.config.method}`);
    
    // Simulation de test (à remplacer par votre vraie logique)
    const startTime = Date.now();
    
    // Simuler un appel API (remplacez par axios ou autre)
    const success = true; // Pour la simulation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responseTime = Date.now() - startTime;
    
    // Mise à jour des statistiques
    integration.updateExecutionStats(success, responseTime, success ? null : 'Erreur simulée');
    integration.addToHistory({
      timestamp: new Date(),
      status: success ? 'success' : 'error',
      responseTime,
      error: success ? null : 'Erreur de connexion simulée'
    });
    
    await integration.save();
    
    // Création du log de test
    try {
      await Log.create({
        integrationId: integration._id,
        level: success ? 'info' : 'error',
        message: `Test de l'intégration ${integration.name}: ${success ? 'Succès' : 'Échec'}`,
        details: { responseTime, success }
      });
    } catch (logError) {
      console.warn('⚠️ Erreur log:', logError.message);
    }
    
    res.json({
      success,
      responseTime,
      error: success ? null : 'Erreur de connexion simulée',
      message: success ? 'Test réussi' : 'Test échoué'
    });
  } catch (error) {
    console.error('❌ Erreur testIntegration:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une intégration
exports.deleteIntegration = async (req, res) => {
  try {
    const integration = await Integration.findByIdAndDelete(req.params.id);
    
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    
    // Log de suppression
    try {
      await Log.create({
        integrationId: integration._id,
        level: 'warning',
        message: `Intégration ${integration.name} supprimée`,
        details: { action: 'delete' }
      });
    } catch (logError) {
      console.warn('⚠️ Erreur log:', logError.message);
    }
    
    res.json({ message: 'Intégration supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteIntegration:', error);
    res.status(500).json({ error: error.message });
  }
};