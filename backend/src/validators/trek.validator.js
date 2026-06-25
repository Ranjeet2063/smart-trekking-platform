const Joi = require('joi');

const createTrekSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).allow('', null),
  difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'extreme').default('moderate'),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  route_data: Joi.array().items(
    Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      name: Joi.string().optional(),
    })
  ).default([]),
  total_distance_km: Joi.number().min(0).max(10000).optional(),
  estimated_duration_hours: Joi.number().min(0).max(8760).optional(),
  max_participants: Joi.number().integer().min(1).max(100).default(20),
  location_update_interval: Joi.number().integer().min(5).max(300).default(10),
  is_public: Joi.boolean().default(false),
});

const updateTrekSchema = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string().max(2000).allow('', null),
  difficulty: Joi.string().valid('easy', 'moderate', 'hard', 'extreme'),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  route_data: Joi.array().items(
    Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      name: Joi.string().optional(),
    })
  ),
  total_distance_km: Joi.number().min(0).max(10000),
  max_participants: Joi.number().integer().min(1).max(100),
  is_public: Joi.boolean(),
});

const checkpointSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude_meters: Joi.number().optional(),
  order_index: Joi.number().integer().min(0).required(),
  radius_meters: Joi.number().integer().min(10).max(10000).default(100),
  estimated_arrival_minutes: Joi.number().integer().min(0).optional(),
});

module.exports = {
  createTrekSchema,
  updateTrekSchema,
  checkpointSchema,
};
