const Integration = require('../models/Integration');
const Log = require('../models/Log');

// Statistiques globales du dashboard
exports.getStats = async (req, res) => {
  try {
    const total = await Integration.countDocuments();
    const activeCount = await Integration.countDocuments({ status: 'active' });
    const inactiveCount = await Integration.countDocuments({ status: 'inactive' });
    const errorCount = await Integration.countDocuments({ status: 'error' });
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errorLogs24h = await Log.countDocuments({
      level: 'error',
      timestamp: { $gte: twentyFourHoursAgo }
    });
    
    const logs24h = await Log.countDocuments({
      timestamp: { $gte: twentyFourHoursAgo }
    });
    
    const successRate = logs24h > 0 
      ? Math.round(((logs24h - errorLogs24h) / logs24h) * 100)
      : 100;
    
    res.json({
      totalCalls: logs24h,
      successRate,
      total,
      activeCount,
      inactiveCount,
      errorCount,
      errorCount24h: errorLogs24h
    });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Statistiques pour une intégration spécifique
exports.getIntegrationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'intégration existe
    const integration = await Integration.findById(id);
    if (!integration) {
      return res.status(404).json({ error: 'Intégration non trouvée' });
    }
    
    const totalCalls = await Log.countDocuments({ integrationId: id });
    const successCalls = await Log.countDocuments({ integrationId: id, level: 'info' });
    const failedCalls = await Log.countDocuments({ integrationId: id, level: 'error' });
    
    const successRate = totalCalls > 0 
      ? Math.round((successCalls / totalCalls) * 100)
      : 0;
    
    const recentLogs = await Log.find({ integrationId: id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      integrationId: id,
      integrationName: integration.name,
      totalCalls,
      successCalls,
      failedCalls,
      successRate,
      recentLogs
    });
  } catch (error) {
    console.error('❌ Erreur getIntegrationStats:', error);
    res.status(500).json({ error: error.message });
  }
};