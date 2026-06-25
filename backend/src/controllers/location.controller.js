const locationService = require('../services/location.service');
const { getIO } = require('../services/socket.service');
const logger = require('../config/logger');

const updateLocation = async (req, res, next) => {
  try {
    const location = await locationService.saveLocation(req.body, req.user.id);

    const io = getIO();
    if (io) {
      io.to(`trek:${req.body.trek_id}`).emit('location:update', {
        user_id: req.user.id,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        altitude_meters: req.body.altitude_meters,
        speed_kmh: req.body.speed_kmh,
        heading_degrees: req.body.heading_degrees,
        battery_level: req.body.battery_level,
        timestamp: req.body.timestamp,
      });
    }

    res.json({ success: true, message: 'Location updated', data: { location } });
  } catch (error) {
    next(error);
  }
};

const getLocationHistory = async (req, res, next) => {
  try {
    const { trekId } = req.params;
    const { limit = 500, offset = 0, from, to } = req.query;
    const locations = await locationService.getLocationHistory(trekId, req.user, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      from,
      to,
    });
    res.json({ success: true, data: { locations } });
  } catch (error) {
    next(error);
  }
};

const getLatestLocation = async (req, res, next) => {
  try {
    const location = await locationService.getLatestLocation(req.params.trekId, req.user);
    if (!location) {
      return res.status(404).json({ success: false, message: 'No location data found' });
    }
    res.json({ success: true, data: { location } });
  } catch (error) {
    next(error);
  }
};

const getLocationsForReplay = async (req, res, next) => {
  try {
    const locations = await locationService.getLocationsForReplay(req.params.trekId, req.user);
    res.json({ success: true, data: { locations } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateLocation,
  getLocationHistory,
  getLatestLocation,
  getLocationsForReplay,
};
