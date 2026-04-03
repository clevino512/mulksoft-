const mongoose = require('mongoose');

// Schéma pour les métriques horaires
const hourlyMetricSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  totalExecutions: {
    type: Number,
    default: 0
  },
  successfulExecutions: {
    type: Number,
    default: 0
  },
  failedExecutions: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  minResponseTime: {
    type: Number,
    default: 0
  },
  maxResponseTime: {
    type: Number,
    default: 0
  }
});

// Schéma pour les statistiques globales
const globalStatsSchema = new mongoose.Schema({
  // Statistiques générales
  totalIntegrations: {
    type: Number,
    default: 0
  },
  activeIntegrations: {
    type: Number,
    default: 0
  },
  inactiveIntegrations: {
    type: Number,
    default: 0
  },
  errorIntegrations: {
    type: Number,
    default: 0
  },
  
  // Statistiques d'exécution
  totalExecutions: {
    type: Number,
    default: 0
  },
  totalSuccessfulExecutions: {
    type: Number,
    default: 0
  },
  totalFailedExecutions: {
    type: Number,
    default: 0
  },
  globalSuccessRate: {
    type: Number,
    default: 0
  },
  
  // Temps de réponse
  globalAvgResponseTime: {
    type: Number,
    default: 0
  },
  bestResponseTime: {
    type: Number,
    default: 0
  },
  worstResponseTime: {
    type: Number,
    default: 0
  },
  
  // Métriques par type d'intégration
  byType: {
    type: Map,
    of: {
      count: Number,
      successRate: Number,
      avgResponseTime: Number
    },
    default: new Map()
  },
  
  // Métriques par statut
  byStatus: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // Métriques horaires (dernières 24h)
  hourlyMetrics: {
    type: [hourlyMetricSchema],
    default: []
  },
  
  // Métriques quotidiennes (derniers 30 jours)
  dailyMetrics: {
    type: [{
      date: Date,
      totalExecutions: Number,
      successRate: Number,
      avgResponseTime: Number
    }],
    default: []
  },
  
  // Top des intégrations
  topIntegrations: {
    byExecutions: {
      type: [{
        integrationId: mongoose.Schema.Types.ObjectId,
        name: String,
        count: Number
      }],
      default: []
    },
    byErrors: {
      type: [{
        integrationId: mongoose.Schema.Types.ObjectId,
        name: String,
        errorCount: Number
      }],
      default: []
    },
    byResponseTime: {
      type: [{
        integrationId: mongoose.Schema.Types.ObjectId,
        name: String,
        avgResponseTime: Number
      }],
      default: []
    }
  },
  
  // Métriques de performance
  performance: {
    uptime: {
      type: Number,
      default: 100,
      description: 'Pourcentage de disponibilité'
    },
    errorRate: {
      type: Number,
      default: 0
    },
    throughput: {
      type: Number,
      default: 0,
      description: 'Nombre d\'exécutions par heure'
    }
  },
  
  // Dernière mise à jour
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  
  // Période
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'all'],
    default: 'all'
  }
}, {
  timestamps: true
});

// Index
globalStatsSchema.index({ lastUpdate: -1 });
globalStatsSchema.index({ period: 1 });

// Méthodes statiques
globalStatsSchema.statics = {
  // Mettre à jour les statistiques en temps réel
  updateStats: async function(executionData) {
    const stats = await this.findOne({ period: 'all' });
    
    if (!stats) {
      // Créer les stats si elles n'existent pas
      const newStats = new this({
        period: 'all',
        lastUpdate: new Date()
      });
      return newStats.save();
    }
    
    // Mettre à jour les compteurs
    stats.totalExecutions++;
    if (executionData.success) {
      stats.totalSuccessfulExecutions++;
    } else {
      stats.totalFailedExecutions++;
    }
    
    // Calculer le taux de succès
    stats.globalSuccessRate = 
      (stats.totalSuccessfulExecutions / stats.totalExecutions) * 100;
    
    // Mettre à jour les temps de réponse
    if (executionData.responseTime) {
      if (stats.globalAvgResponseTime === 0) {
        stats.globalAvgResponseTime = executionData.responseTime;
      } else {
        stats.globalAvgResponseTime = 
          (stats.globalAvgResponseTime + executionData.responseTime) / 2;
      }
      
      if (executionData.responseTime < stats.bestResponseTime || stats.bestResponseTime === 0) {
        stats.bestResponseTime = executionData.responseTime;
      }
      if (executionData.responseTime > stats.worstResponseTime) {
        stats.worstResponseTime = executionData.responseTime;
      }
    }
    
    // Mettre à jour les métriques horaires
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    
    const hourlyMetric = stats.hourlyMetrics.find(
      m => m.timestamp.getTime() === currentHour.getTime()
    );
    
    if (hourlyMetric) {
      hourlyMetric.totalExecutions++;
      if (executionData.success) {
        hourlyMetric.successfulExecutions++;
      } else {
        hourlyMetric.failedExecutions++;
      }
      
      // Mettre à jour les temps de réponse
      if (executionData.responseTime) {
        const oldAvg = hourlyMetric.averageResponseTime;
        const count = hourlyMetric.totalExecutions;
        hourlyMetric.averageResponseTime = 
          ((oldAvg * (count - 1)) + executionData.responseTime) / count;
        
        if (executionData.responseTime < hourlyMetric.minResponseTime || hourlyMetric.minResponseTime === 0) {
          hourlyMetric.minResponseTime = executionData.responseTime;
        }
        if (executionData.responseTime > hourlyMetric.maxResponseTime) {
          hourlyMetric.maxResponseTime = executionData.responseTime;
        }
      }
    } else {
      stats.hourlyMetrics.push({
        timestamp: currentHour,
        totalExecutions: 1,
        successfulExecutions: executionData.success ? 1 : 0,
        failedExecutions: executionData.success ? 0 : 1,
        averageResponseTime: executionData.responseTime || 0,
        minResponseTime: executionData.responseTime || 0,
        maxResponseTime: executionData.responseTime || 0
      });
    }
    
    // Garder seulement les dernières 24 heures
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.hourlyMetrics = stats.hourlyMetrics.filter(
      m => m.timestamp >= twentyFourHoursAgo
    );
    
    // Mettre à jour les métriques quotidiennes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyMetric = stats.dailyMetrics.find(
      m => m.date.getTime() === today.getTime()
    );
    
    if (dailyMetric) {
      dailyMetric.totalExecutions++;
      dailyMetric.successRate = 
        ((dailyMetric.successRate * (dailyMetric.totalExecutions - 1) + (executionData.success ? 100 : 0)) / 
        dailyMetric.totalExecutions);
      
      if (executionData.responseTime) {
        dailyMetric.avgResponseTime = 
          (dailyMetric.avgResponseTime + executionData.responseTime) / dailyMetric.totalExecutions;
      }
    } else {
      stats.dailyMetrics.push({
        date: today,
        totalExecutions: 1,
        successRate: executionData.success ? 100 : 0,
        avgResponseTime: executionData.responseTime || 0
      });
    }
    
    // Garder seulement les 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    stats.dailyMetrics = stats.dailyMetrics.filter(
      m => m.date >= thirtyDaysAgo
    );
    
    // Mettre à jour les métriques de performance
    const lastHourMetrics = stats.hourlyMetrics.filter(
      m => m.timestamp >= new Date(Date.now() - 60 * 60 * 1000)
    );
    
    if (lastHourMetrics.length > 0) {
      const totalLastHour = lastHourMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
      stats.performance.throughput = totalLastHour;
      stats.performance.errorRate = 
        (stats.totalFailedExecutions / stats.totalExecutions) * 100;
      
      // Calculer l'uptime (basé sur les succès des dernières 24h)
      const last24hMetrics = stats.hourlyMetrics;
      const totalLast24h = last24hMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
      const successLast24h = last24hMetrics.reduce((sum, m) => sum + m.successfulExecutions, 0);
      stats.performance.uptime = totalLast24h > 0 ? (successLast24h / totalLast24h) * 100 : 100;
    }
    
    stats.lastUpdate = new Date();
    await stats.save();
    
    return stats;
  },
  
  // Obtenir les statistiques pour une période spécifique
  getStatsForPeriod: async function(period = 'all') {
    let stats = await this.findOne({ period });
    
    if (!stats) {
      // Créer des stats vides pour cette période
      stats = new this({ period });
      await stats.save();
    }
    
    return stats;
  },
  
  // Réinitialiser les statistiques
  resetStats: async function() {
    await this.deleteMany({});
    const newStats = new this({ period: 'all' });
    return newStats.save();
  }
};

// Exporter le modèle
module.exports = mongoose.model('Stats', globalStatsSchema);