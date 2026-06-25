const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:id', authenticate, userController.getUserById);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/:id/treks', authenticate, userController.getUserTreks);

module.exports = router;
