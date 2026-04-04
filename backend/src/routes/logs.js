const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

// ⚠️ IMPORTANT: Les routes spécifiques DOIVENT venir AVANT les routes génériques

// Route de suppression (DELETE)
router.delete('/old', logController.deleteOldLogs);

// Routes spécifiques (avant les routes génériques avec :id)
router.get('/stats', logController.getLogsStats);
router.get('/integration/:integrationId', logController.getLogsByIntegration);

// Routes génériques (après les routes spécifiques)
router.get('/:id', logController.getLogById);
router.get('/', logController.getLogs);

module.exports = router;