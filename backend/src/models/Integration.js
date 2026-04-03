const mongoose = require('mongoose');

// Schéma pour l'authentification
const authenticationSchema = new mongoose.Schema({
  authType: {
    type: String,
    enum: ['none', 'basic', 'bearer', 'apiKey', 'oauth2'],
    default: 'none'
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tokenUrl: String,
  refreshToken: String
}, { _id: false });

// Schéma pour la configuration
const configSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} n'est pas une URL valide!`
    }
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
    default: 'GET'
  },
  headers: {
    type: Map,
    of: String,
    default: new Map()
  },
  timeout:    { type: Number, default: 30000 },
  retryCount: { type: Number, default: 3, min: 0, max: 10 },
  retryDelay: { type: Number, default: 1000 },
  authentication: {
    type: authenticationSchema,
    default: () => ({ authType: 'none', credentials: {} })
  },
  transformResponse: String,
  validationRules: mongoose.Schema.Types.Mixed
}, { _id: false });

// Schéma pour l'historique d'exécution
const executionHistorySchema = new mongoose.Schema({
  timestamp:       { type: Date, default: Date.now },
  status:          { type: String, enum: ['success', 'error', 'pending'], required: true },
  responseTime:    Number,
  error:           String,
  responseCode:    Number,
  requestPayload:  mongoose.Schema.Types.Mixed,
  responsePayload: mongoose.Schema.Types.Mixed
}, { _id: false });

// Schéma principal
const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    unique: true,
    minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    default: ''
  },
  type: {
    type: String,
    enum: ['REST', 'SOAP', 'MuleSoft', 'Database', 'GraphQL', 'WebSocket'],
    required: [true, 'Le type est requis'],
    default: 'REST'
  },
  config: { type: configSchema, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'degraded', 'maintenance'],
    default: 'inactive'
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'unhealthy', 'unknown', 'degraded'],
    default: 'unknown'
  },
  lastExecution:    { type: Date, default: null },
  lastSuccess:      { type: Date, default: null },
  lastError:        { type: Date, default: null },
  lastErrorMessage: { type: String, default: null },
  executionStats: {
    totalExecutions:      { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions:     { type: Number, default: 0 },
    averageResponseTime:  { type: Number, default: 0 },
    lastResponseTime:     { type: Number, default: null },
    uptime:               { type: Number, default: 0 }
  },
  executionHistory: { type: [executionHistorySchema], default: [] },
  schedule: {
    enabled:        { type: Boolean, default: false },
    cronExpression: String,
    timezone:       { type: String, default: 'UTC' },
    lastRun:        Date,
    nextRun:        Date
  },
  alerts: {
    enabled:         { type: Boolean, default: false },
    onError:         { type: Boolean, default: true },
    onSuccess:       { type: Boolean, default: false },
    emailRecipients: { type: [String], default: [] },
    webhookUrl:      { type: String, default: null },
    errorThreshold:  { type: Number, default: 3 }
  },
  version:     { type: Number, default: 1 },
  createdBy:   { type: String, default: 'system' },
  updatedBy:   { type: String, default: 'system' },
  tags:        { type: [String], default: [] },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  auditLog: {
    type: [{
      action:    String,
      user:      String,
      timestamp: { type: Date, default: Date.now },
      changes:   mongoose.Schema.Types.Mixed
    }],
    default: []
  }
}, { timestamps: true });

// Index
integrationSchema.index({ status: 1, createdAt: -1 });
integrationSchema.index({ type: 1, status: 1 });
integrationSchema.index({ environment: 1, status: 1 });
integrationSchema.index({ 'config.endpoint': 1 });
integrationSchema.index({ tags: 1 });
integrationSchema.index({ createdAt: -1 });
integrationSchema.index({ lastExecution: -1 });
integrationSchema.index({ 'schedule.enabled': 1, 'schedule.nextRun': 1 });

// ✅ MIDDLEWARE PRE-SAVE CORRIGÉ
integrationSchema.pre('save', async function() {
  try {
    if (this.isNew) {
      this.auditLog.push({
        action: 'create',
        user: this.createdBy || 'system',
        changes: { name: this.name, type: this.type }
      });
    } else if (this.isModified()) {
      const changes = {};
      this.modifiedPaths().forEach(path => {
        if (path !== 'auditLog' && path !== 'updatedAt') {
          changes[path] = this[path];
        }
      });

      if (Object.keys(changes).length > 0) {
        this.auditLog.push({
          action: 'update',
          user: this.updatedBy || 'system',
          changes
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans pre-save middleware:', error);
    throw error; // 👈 IMPORTANT
  }
});

// ✅ Méthodes d'instance
integrationSchema.methods.updateExecutionStats = function(success, responseTime, error = null) {
  this.executionStats.totalExecutions++;
  if (success) {
    this.executionStats.successfulExecutions++;
    this.lastSuccess = new Date();
    this.status = 'active';
    this.healthStatus = 'healthy';
  } else {
    this.executionStats.failedExecutions++;
    this.lastError = new Date();
    this.lastErrorMessage = error;
    this.status = 'error';
    this.healthStatus = 'unhealthy';
  }
  const total = this.executionStats.successfulExecutions + this.executionStats.failedExecutions;
  this.executionStats.averageResponseTime =
    ((this.executionStats.averageResponseTime * (total - 1)) + responseTime) / total;
  this.executionStats.lastResponseTime = responseTime;
  this.lastExecution = new Date();
  if (this.executionStats.totalExecutions > 0) {
    this.executionStats.uptime =
      (this.executionStats.successfulExecutions / this.executionStats.totalExecutions) * 100;
  }
};

integrationSchema.methods.addToHistory = function(executionData) {
  this.executionHistory.unshift(executionData);
  if (this.executionHistory.length > 1000) this.executionHistory.pop();
};

integrationSchema.methods.isInError = function() {
  return this.status === 'error';
};

integrationSchema.methods.resetStats = function() {
  this.executionStats = {
    totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0,
    averageResponseTime: 0, lastResponseTime: null, uptime: 0
  };
  this.executionHistory = [];
  this.lastExecution = null;
  this.lastSuccess = null;
  this.lastError = null;
  this.lastErrorMessage = null;
};

// ✅ Méthodes statiques
integrationSchema.statics.findScheduledIntegrations = function() {
  const now = new Date();
  return this.find({
    'schedule.enabled': true,
    'schedule.nextRun': { $lte: now },
    status: 'active'
  });
};

integrationSchema.statics.getGlobalStats = async function() {
  const stats = await this.aggregate([{
    $group: {
      _id: null,
      total:           { $sum: 1 },
      active:          { $sum: { $cond: [{ $eq: ['$status', 'active'] },   1, 0] } },
      inactive:        { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
      error:           { $sum: { $cond: [{ $eq: ['$status', 'error'] },    1, 0] } },
      avgResponseTime: { $avg: '$executionStats.averageResponseTime' },
      totalExecutions: { $sum: '$executionStats.totalExecutions' },
      totalErrors:     { $sum: '$executionStats.failedExecutions' }
    }
  }]);
  return stats[0] || {
    total: 0, active: 0, inactive: 0, error: 0,
    avgResponseTime: 0, totalExecutions: 0, totalErrors: 0
  };
};

module.exports = mongoose.model('Integration', integrationSchema);