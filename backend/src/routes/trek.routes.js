const express = require('express');
const router = express.Router();
const trekController = require('../controllers/trek.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../validators');
const { createTrekSchema, updateTrekSchema, checkpointSchema } = require('../validators/trek.validator');

router.get('/', authenticate, trekController.list);
router.post('/', authenticate, validate(createTrekSchema), trekController.create);
router.get('/:id', authenticate, trekController.getById);
router.put('/:id', authenticate, validate(updateTrekSchema), trekController.update);
router.delete('/:id', authenticate, trekController.remove);
router.post('/:id/start', authenticate, trekController.startTrek);
router.post('/:id/complete', authenticate, trekController.completeTrek);
router.post('/:id/abort', authenticate, trekController.abortTrek);

router.post('/:id/checkpoints', authenticate, validate(checkpointSchema), trekController.addCheckpoint);
router.put('/:id/checkpoints/:checkpointId', authenticate, trekController.updateCheckpoint);
router.delete('/:id/checkpoints/:checkpointId', authenticate, trekController.removeCheckpoint);

router.post('/:id/participants', authenticate, trekController.addParticipant);
router.delete('/:id/participants/:participantId', authenticate, trekController.removeParticipant);

module.exports = router;
