const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Routes pour les intégrations
router.get('/', integrationController.getAllIntegrations);
router.get('/:id', integrationController.getIntegrationById);
router.post('/', integrationController.createIntegration);
router.put('/:id', integrationController.updateIntegration);
router.patch('/:id', integrationController.patchIntegration);
router.post('/:id/test', integrationController.testIntegration);
router.delete('/:id', integrationController.deleteIntegration);

module.exports = router;