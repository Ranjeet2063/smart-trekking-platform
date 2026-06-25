const Joi = require('joi');

const locationUpdateSchema = Joi.object({
  trek_id: Joi.string().uuid().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude_meters: Joi.number().allow(null),
  speed_kmh: Joi.number().min(0).max(200).allow(null),
  heading_degrees: Joi.number().min(0).max(360).allow(null),
  accuracy_meters: Joi.number().min(0).max(10000).allow(null),
  battery_level: Joi.number().min(0).max(100).allow(null),
  timestamp: Joi.date().iso().required(),
});

module.exports = { locationUpdateSchema };
