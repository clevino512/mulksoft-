const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// GET /api/stats/ - Endpoint par défaut
router.get('/', statsController.getStats);

// GET /api/stats/dashboard - Dashboard stats
router.get('/dashboard', statsController.getStats);

// GET /api/stats/integration/:id - Stats pour une intégration spécifique
router.get('/integration/:id', statsController.getIntegrationStats);

module.exports = router;