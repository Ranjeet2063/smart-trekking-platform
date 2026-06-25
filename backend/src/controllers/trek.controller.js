const trekService = require('../services/trek.service');

const list = async (req, res, next) => {
  try {
    const treks = await trekService.listUserTreks(req.user.id);
    res.json({ success: true, data: { treks } });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const trek = await trekService.createTrek(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Trek created successfully',
      data: { trek },
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const trek = await trekService.getTrekById(req.params.id, req.user);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trek not found' });
    }
    res.json({ success: true, data: { trek } });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const trek = await trekService.updateTrek(req.params.id, req.user.id, req.body);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trek not found or unauthorized' });
    }
    res.json({
      success: true,
      message: 'Trek updated successfully',
      data: { trek },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await trekService.deleteTrek(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Trek not found or unauthorized' });
    }
    res.json({ success: true, message: 'Trek deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const startTrek = async (req, res, next) => {
  try {
    const trek = await trekService.updateTrekStatus(req.params.id, req.user.id, 'active');
    res.json({ success: true, message: 'Trek started', data: { trek } });
  } catch (error) {
    if (error.message === 'Trek not found or unauthorized') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const completeTrek = async (req, res, next) => {
  try {
    const trek = await trekService.updateTrekStatus(req.params.id, req.user.id, 'completed');
    res.json({ success: true, message: 'Trek completed', data: { trek } });
  } catch (error) {
    if (error.message === 'Trek not found or unauthorized') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const abortTrek = async (req, res, next) => {
  try {
    const trek = await trekService.updateTrekStatus(req.params.id, req.user.id, 'aborted');
    res.json({ success: true, message: 'Trek aborted', data: { trek } });
  } catch (error) {
    if (error.message === 'Trek not found or unauthorized') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const addCheckpoint = async (req, res, next) => {
  try {
    const checkpoint = await trekService.addCheckpoint(req.params.id, req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Checkpoint added',
      data: { checkpoint },
    });
  } catch (error) {
    if (error.message === 'Trek not found or unauthorized') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateCheckpoint = async (req, res, next) => {
  try {
    const checkpoint = await trekService.updateCheckpoint(
      req.params.id,
      req.params.checkpointId,
      req.user.id,
      req.body
    );
    if (!checkpoint) {
      return res.status(404).json({ success: false, message: 'Checkpoint not found' });
    }
    res.json({ success: true, message: 'Checkpoint updated', data: { checkpoint } });
  } catch (error) {
    next(error);
  }
};

const removeCheckpoint = async (req, res, next) => {
  try {
    const deleted = await trekService.deleteCheckpoint(
      req.params.id,
      req.params.checkpointId,
      req.user.id
    );
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Checkpoint not found' });
    }
    res.json({ success: true, message: 'Checkpoint removed' });
  } catch (error) {
    next(error);
  }
};

const addParticipant = async (req, res, next) => {
  try {
    const participant = await trekService.addParticipant(req.params.id, req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Participant added',
      data: { participant },
    });
  } catch (error) {
    if (error.message === 'Trek not found or unauthorized' || error.message === 'User not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'User is already a participant' });
    }
    next(error);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const deleted = await trekService.removeParticipant(
      req.params.id,
      req.params.participantId,
      req.user.id
    );
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    res.json({ success: true, message: 'Participant removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list, create, getById, update, remove,
  startTrek, completeTrek, abortTrek,
  addCheckpoint, updateCheckpoint, removeCheckpoint,
  addParticipant, removeParticipant,
};
