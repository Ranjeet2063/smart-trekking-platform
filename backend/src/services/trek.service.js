const { query } = require('../config/database');

const listUserTreks = async (userId) => {
  const result = await query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM trek_participants WHERE trek_id = t.id) as participant_count,
            u.name as creator_name
     FROM treks t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN trek_participants tp ON tp.trek_id = t.id AND tp.user_id = $1
     WHERE t.user_id = $1 OR tp.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const createTrek = async (userId, trekData) => {
  const {
    name, description, difficulty, start_date, end_date,
    route_data, total_distance_km, estimated_duration_hours,
    max_participants, location_update_interval, is_public
  } = trekData;

  const result = await query(
    `INSERT INTO treks (user_id, name, description, difficulty, start_date, end_date,
                        route_data, total_distance_km, estimated_duration_hours,
                        max_participants, location_update_interval, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [userId, name, description, difficulty, start_date, end_date,
     JSON.stringify(route_data), total_distance_km, estimated_duration_hours,
     max_participants || 20, location_update_interval || 10, is_public || false]
  );

  await query(
    'INSERT INTO trek_participants (trek_id, user_id, role) VALUES ($1, $2, $3)',
    [result.rows[0].id, userId, 'leader']
  );

  return result.rows[0];
};

const getTrekById = async (trekId, user) => {
  const result = await query(
    `SELECT t.*,
            u.name as creator_name, u.avatar_url as creator_avatar,
            (SELECT json_agg(json_build_object(
              'id', c.id, 'name', c.name, 'latitude', c.latitude,
              'longitude', c.longitude, 'order_index', c.order_index
            ) ORDER BY c.order_index) FROM checkpoints c WHERE c.trek_id = t.id) as checkpoints,
            (SELECT json_agg(json_build_object(
              'user_id', tp.user_id, 'role', tp.role,
              'name', u2.name, 'avatar_url', u2.avatar_url
            )) FROM trek_participants tp
             JOIN users u2 ON u2.id = tp.user_id
             WHERE tp.trek_id = t.id) as participants
     FROM treks t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [trekId]
  );

  if (result.rows.length === 0) return null;

  const trek = result.rows[0];

  const canView = trek.user_id === user.id ||
    user.role === 'admin' ||
    user.role === 'rescue' ||
    trek.participants?.some(p => p.user_id === user.id);

  if (!canView && user.role === 'family') {
    const familyLink = await query(
      `SELECT 1 FROM users u
       JOIN trek_participants tp ON tp.user_id = u.id
       WHERE tp.trek_id = $1 AND u.id IN (
         SELECT ec.user_id FROM emergency_contacts ec
         JOIN users contact_user ON contact_user.id = ec.user_id
         WHERE ec.email = $2
       )
       LIMIT 1`,
      [trekId, user.email]
    );
    if (familyLink.rows.length === 0) return null;
  } else if (!canView) {
    return null;
  }

  return trek;
};

const updateTrek = async (trekId, userId, updates) => {
  const allowedFields = [
    'name', 'description', 'difficulty', 'start_date', 'end_date',
    'route_data', 'total_distance_km', 'max_participants', 'is_public'
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(key === 'route_data' ? JSON.stringify(value) : value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return getTrekById(trekId, { id: userId });

  setClauses.push(`updated_at = NOW()`);
  values.push(trekId, userId);

  const result = await query(
    `UPDATE treks SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

const deleteTrek = async (trekId, userId) => {
  const result = await query(
    'DELETE FROM treks WHERE id = $1 AND user_id = $2 RETURNING id',
    [trekId, userId]
  );
  return result.rows.length > 0;
};

const validTransitions = {
  upcoming: 'active',
  active: 'completed',
};

const updateTrekStatus = async (trekId, userId, status) => {
  const current = await query(
    'SELECT status FROM treks WHERE id = $1',
    [trekId]
  );
  if (current.rows.length === 0) {
    throw new Error('Trek not found');
  }

  const currentStatus = current.rows[0].status;
  if (status === 'active' && currentStatus !== 'upcoming' && currentStatus !== 'draft') {
    throw new Error(`Cannot start trek with status "${currentStatus}". Only "upcoming" or "draft" treks can be started.`);
  }
  if (status === 'completed' && currentStatus !== 'active') {
    throw new Error('Only active treks can be completed');
  }
  if (status === 'aborted' && currentStatus !== 'active' && currentStatus !== 'upcoming') {
    throw new Error('Only active or upcoming treks can be aborted');
  }

  const result = await query(
    `UPDATE treks SET status = $1, updated_at = NOW()
     WHERE id = $2 AND (user_id = $3 OR $3 IN (
       SELECT user_id FROM trek_participants WHERE trek_id = $2 AND role = 'leader'
     ))
     RETURNING *`,
    [status, trekId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Trek not found or unauthorized');
  }

  return result.rows[0];
};

const addCheckpoint = async (trekId, userId, checkpointData) => {
  const { name, latitude, longitude, altitude_meters, order_index, radius_meters, estimated_arrival_minutes } = checkpointData;

  const trek = await query(
    'SELECT id FROM treks WHERE id = $1 AND user_id = $2',
    [trekId, userId]
  );
  if (trek.rows.length === 0) {
    throw new Error('Trek not found or unauthorized');
  }

  const result = await query(
    `INSERT INTO checkpoints (trek_id, name, latitude, longitude, altitude_meters, order_index, radius_meters, estimated_arrival_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [trekId, name, latitude, longitude, altitude_meters, order_index, radius_meters, estimated_arrival_minutes]
  );

  return result.rows[0];
};

const updateCheckpoint = async (trekId, checkpointId, userId, updates) => {
  const allowedFields = ['name', 'latitude', 'longitude', 'altitude_meters', 'order_index', 'radius_meters', 'estimated_arrival_minutes'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return null;

  values.push(checkpointId, trekId, userId);

  const result = await query(
    `UPDATE checkpoints c SET ${setClauses.join(', ')}
     FROM treks t
     WHERE c.id = $${paramIndex} AND c.trek_id = t.id AND t.id = $${paramIndex + 1} AND t.user_id = $${paramIndex + 2}
     RETURNING c.*`,
    values
  );

  return result.rows[0] || null;
};

const deleteCheckpoint = async (trekId, checkpointId, userId) => {
  const result = await query(
    `DELETE FROM checkpoints c USING treks t
     WHERE c.id = $1 AND c.trek_id = t.id AND t.id = $2 AND t.user_id = $3
     RETURNING c.id`,
    [checkpointId, trekId, userId]
  );
  return result.rows.length > 0;
};

const addParticipant = async (trekId, userId, data) => {
  const trek = await query(
    'SELECT id, user_id, max_participants FROM treks WHERE id = $1',
    [trekId]
  );
  if (trek.rows.length === 0) {
    throw new Error('Trek not found or unauthorized');
  }

  if (trek.rows[0].user_id !== userId) {
    throw new Error('Trek not found or unauthorized');
  }

  const count = await query(
    'SELECT COUNT(*) FROM trek_participants WHERE trek_id = $1',
    [trekId]
  );
  if (parseInt(count.rows[0].count) >= trek.rows[0].max_participants) {
    throw new Error('Trek participant limit reached');
  }

  const userToAdd = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (userToAdd.rows.length === 0) {
    throw new Error('User not found');
  }

  const result = await query(
    `INSERT INTO trek_participants (trek_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [trekId, userToAdd.rows[0].id, data.role || 'member']
  );

  return result.rows[0];
};

const removeParticipant = async (trekId, participantId, userId) => {
  const result = await query(
    `DELETE FROM trek_participants
     WHERE id = $1 AND trek_id = $2 AND (
       $3 IN (SELECT user_id FROM trek_participants WHERE trek_id = $2 AND role = 'leader')
       OR user_id = $3
     )
     RETURNING id`,
    [participantId, trekId, userId]
  );
  return result.rows.length > 0;
};

module.exports = {
  listUserTreks,
  createTrek,
  getTrekById,
  updateTrek,
  deleteTrek,
  updateTrekStatus,
  addCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  addParticipant,
  removeParticipant,
};
