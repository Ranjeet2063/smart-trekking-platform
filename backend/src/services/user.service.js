const { query } = require('../config/database');

const getUserById = async (userId) => {
  const result = await query(
    `SELECT id, email, name, phone, avatar_url, role, medical_info,
            is_verified, created_at
     FROM users WHERE id = $1 AND is_active = true`,
    [userId]
  );
  return result.rows[0] || null;
};

const updateProfile = async (userId, updates) => {
  const allowedFields = ['name', 'phone', 'avatar_url', 'medical_info', 'notification_preferences'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(key === 'name' ? value.trim() : value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    const current = await getUserById(userId);
    return current;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, name, phone, avatar_url, role, medical_info, notification_preferences, updated_at`,
    values
  );

  return result.rows[0];
};

const getUserTreks = async (userId) => {
  const result = await query(
    `SELECT t.id, t.name, t.difficulty, t.start_date, t.end_date, t.status,
            t.total_distance_km, t.created_at,
            (SELECT COUNT(*) FROM trek_participants WHERE trek_id = t.id) as participant_count
     FROM treks t
     LEFT JOIN trek_participants tp ON tp.trek_id = t.id AND tp.user_id = $1
     WHERE t.user_id = $1 OR tp.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  getUserById,
  updateProfile,
  getUserTreks,
};
