const Joi = require('joi');

const triggerSOSSchema = Joi.object({
  trek_id: Joi.string().uuid().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude_meters: Joi.number().allow(null),
  accuracy_meters: Joi.number().min(0).max(10000).allow(null),
  message: Joi.string().max(500).allow(''),
});

const updateSOSStatusSchema = Joi.object({
  status: Joi.string()
    .valid('acknowledged', 'dispatched', 'resolved', 'closed')
    .required(),
  notes: Joi.string().max(2000).allow(''),
});

module.exports = { triggerSOSSchema, updateSOSStatusSchema };
