const express = require('express');
const router = express.Router();
const anthropicController = require('../controllers/anthropicController');

router.post('/auto-tag', anthropicController.autoTagNote);
router.post('/query', anthropicController.queryNotes);
router.post('/summarize', anthropicController.summarizeNotes);
router.post('/insights', anthropicController.surfaceInsights);

module.exports = router;