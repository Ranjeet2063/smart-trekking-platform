const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../validators');
const { locationUpdateSchema } = require('../validators/location.validator');
const { canAccessTrek } = require('../middleware/trekAccess');

router.post('/update', authenticate, validate(locationUpdateSchema), locationController.updateLocation);
router.get('/:trekId', authenticate, canAccessTrek, locationController.getLocationHistory);
router.get('/:trekId/latest', authenticate, canAccessTrek, locationController.getLatestLocation);
router.get('/:trekId/replay', authenticate, canAccessTrek, locationController.getLocationsForReplay);

module.exports = router;
