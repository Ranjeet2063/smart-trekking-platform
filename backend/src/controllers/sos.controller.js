const sosService = require('../services/sos.service');
const { getIO } = require('../services/socket.service');
const logger = require('../config/logger');

const triggerSOS = async (req, res, next) => {
  try {
    const sos = await sosService.triggerSOS(req.body, req.user.id);

    const io = getIO();
    if (io) {
      io.to(`trek:${req.body.trek_id}`).emit('sos:alert', {
        sos_id: sos.id,
        user_id: req.user.id,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        message: req.body.message,
        status: 'triggered',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'SOS alert triggered. Emergency contacts notified.',
      data: { sos },
    });
  } catch (error) {
    if (error.message === 'No emergency contacts configured') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Active trek not found') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const listIncidents = async (req, res, next) => {
  try {
    const incidents = await sosService.listIncidents(req.user);
    res.json({ success: true, data: { incidents } });
  } catch (error) {
    next(error);
  }
};

const getIncidentById = async (req, res, next) => {
  try {
    const incident = await sosService.getIncidentById(req.params.id, req.user);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    res.json({ success: true, data: { incident } });
  } catch (error) {
    next(error);
  }
};

const updateIncidentStatus = async (req, res, next) => {
  try {
    const incident = await sosService.updateIncidentStatus(req.params.id, req.user, req.body);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const io = getIO();
    if (io) {
      io.to(`sos:${req.params.id}`).emit('sos:status_update', {
        sos_id: req.params.id,
        status: req.body.status,
        updated_by: req.user.id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: `SOS status updated to ${req.body.status}`,
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
};

const getActiveIncidents = async (req, res, next) => {
  try {
    const incidents = await sosService.getActiveIncidents();
    res.json({ success: true, data: { incidents } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSOS,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
  getActiveIncidents,
};
