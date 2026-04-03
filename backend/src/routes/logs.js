const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.get('/', logController.getLogs);
router.get('/stats', logController.getLogsStats);
router.get('/:id', logController.getLogById);
router.delete('/old', logController.deleteOldLogs);

module.exports = router;