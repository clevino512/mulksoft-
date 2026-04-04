const Log = require('../models/Log');
const Integration = require('../models/Integration');

// Récupérer les logs avec filtres
exports.getLogs = async (req, res) => {
  try {
    const {
      level,
      integrationId,
      startDate,
      endDate,
      search,
      limit = 50,
      page = 1
    } = req.query;
    
    const query = {};
    
    if (level && level !== 'all') query.level = level;
    if (integrationId && integrationId !== 'all') query.integrationId = integrationId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { 'details.error': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await Log.find(query)
      .populate('integrationId', 'name type')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Log.countDocuments(query);
    
    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Erreur getLogs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Logs pour une intégration spécifique
exports.getLogsByIntegration = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    
    // Vérifier que l'intégration existe
    const integration = await Integration.findById(integrationId);
    if (!integration) {
      return res.status(404).json({ 
        error: 'Intégration non trouvée',
        integrationId 
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await Log.find({ integrationId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Log.countDocuments({ integrationId });
    
    res.json({
      logs,
      total,
      integrationId,
      integrationName: integration.name,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Erreur getLogsByIntegration:', error);
    res.status(500).json({ error: error.message });
  }
};

// Statistiques des logs
exports.getLogsStats = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const total = await Log.countDocuments();
    const errors24h = await Log.countDocuments({
      level: 'error',
      timestamp: { $gte: twentyFourHoursAgo }
    });
    const warnings24h = await Log.countDocuments({
      level: 'warning',
      timestamp: { $gte: twentyFourHoursAgo }
    });
    
    const infoLogs = await Log.countDocuments({ level: 'info' });
    const successRate = total > 0 ? Math.round((infoLogs / total) * 100) : 100;
    
    res.json({ total, errors24h, warnings24h, successRate });
  } catch (error) {
    console.error('❌ Erreur getLogsStats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un log spécifique
exports.getLogById = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id).populate('integrationId', 'name type');
    if (!log) {
      return res.status(404).json({ error: 'Log non trouvé' });
    }
    res.json(log);
  } catch (error) {
    console.error('❌ Erreur getLogById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer les anciens logs
exports.deleteOldLogs = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const result = await Log.deleteMany({ timestamp: { $lt: cutoffDate } });
    
    res.json({
      message: `${result.deletedCount} logs supprimés`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Erreur deleteOldLogs:', error);
    res.status(500).json({ error: error.message });
  }
};