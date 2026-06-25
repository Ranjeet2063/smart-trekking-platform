const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const sosController = require('../controllers/sos.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../validators');
const { triggerSOSSchema, updateSOSStatusSchema } = require('../validators/sos.validator');

const sosLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'SOS rate limit exceeded. Please wait before sending another SOS.' },
});

router.post('/trigger', authenticate, sosLimiter, validate(triggerSOSSchema), sosController.triggerSOS);
router.get('/incidents', authenticate, sosController.listIncidents);
router.get('/incidents/:id', authenticate, sosController.getIncidentById);
router.put('/incidents/:id/status', authenticate, validate(updateSOSStatusSchema), sosController.updateIncidentStatus);
router.get('/active', authenticate, authorize('rescue', 'operator', 'admin'), sosController.getActiveIncidents);

module.exports = router;
