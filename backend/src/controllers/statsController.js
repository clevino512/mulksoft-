const Integration = require('../models/Integration');
const Log = require('../models/Log');

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
      total,
      activeCount,
      inactiveCount,
      errorCount,
      successRate,
      errorCount24h: errorLogs24h
    });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ error: error.message });
  }
};