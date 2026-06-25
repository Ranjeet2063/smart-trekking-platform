const express = require('express');
const router = express.Router();
const emergencyContactController = require('../controllers/emergencyContact.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, emergencyContactController.list);
router.post('/', authenticate, emergencyContactController.create);
router.put('/:id', authenticate, emergencyContactController.update);
router.delete('/:id', authenticate, emergencyContactController.remove);

module.exports = router;
