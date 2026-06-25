const { query } = require('../config/database');

const saveLocation = async (locationData, userId) => {
  const {
    trek_id, latitude, longitude, altitude_meters, speed_kmh,
    heading_degrees, accuracy_meters, battery_level, timestamp
  } = locationData;

  const result = await query(
    `INSERT INTO location_history
     (trek_id, user_id, latitude, longitude, altitude_meters, speed_kmh,
      heading_degrees, accuracy_meters, battery_level, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, latitude, longitude, altitude_meters, speed_kmh, heading_degrees, battery_level, timestamp`,
    [trek_id, userId, latitude, longitude, altitude_meters, speed_kmh,
     heading_degrees, accuracy_meters, battery_level, timestamp]
  );

  return result.rows[0];
};

const getLocationHistory = async (trekId, user, options = {}) => {
  const { limit = 500, offset = 0, from, to } = options;

  let queryStr = `
    SELECT lh.latitude, lh.longitude, lh.altitude_meters, lh.speed_kmh,
           lh.heading_degrees, lh.accuracy_meters, lh.battery_level, lh.timestamp
    FROM location_history lh
    WHERE lh.trek_id = $1
  `;
  const params = [trekId];
  let paramIndex = 2;

  if (from) {
    queryStr += ` AND lh.timestamp >= $${paramIndex}`;
    params.push(from);
    paramIndex++;
  }
  if (to) {
    queryStr += ` AND lh.timestamp <= $${paramIndex}`;
    params.push(to);
    paramIndex++;
  }

  queryStr += ` ORDER BY lh.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(queryStr, params);
  return result.rows.reverse();
};

const getLatestLocation = async (trekId, user) => {
  const result = await query(
    `SELECT lh.latitude, lh.longitude, lh.altitude_meters, lh.speed_kmh,
            lh.heading_degrees, lh.accuracy_meters, lh.battery_level, lh.timestamp
     FROM location_history lh
     WHERE lh.trek_id = $1
     ORDER BY lh.timestamp DESC
     LIMIT 1`,
    [trekId]
  );
  return result.rows[0] || null;
};

const getLocationsForReplay = async (trekId, user) => {
  const result = await query(
    `SELECT lh.latitude, lh.longitude, lh.altitude_meters, lh.speed_kmh,
            lh.heading_degrees, lh.battery_level, lh.timestamp
     FROM location_history lh
     WHERE lh.trek_id = $1
     ORDER BY lh.timestamp ASC`,
    [trekId]
  );
  return result.rows;
};

module.exports = {
  saveLocation,
  getLocationHistory,
  getLatestLocation,
  getLocationsForReplay,
};
