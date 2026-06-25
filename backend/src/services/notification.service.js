const { query } = require('../config/database');

const createNotification = async ({ user_id, type, title, message, reference_type, reference_id }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, type, title, message, is_read, created_at`,
    [user_id, type, title, message, reference_type, reference_id]
  );

  return result.rows[0];
};

const createCheckpointNotification = async (trekId, userId, checkpointName) => {
  const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
  const userName = userResult.rows[0]?.name || 'A trekker';

  await createNotification({
    user_id: userId,
    type: 'checkpoint_reached',
    title: 'Checkpoint Reached!',
    message: `You have reached checkpoint: ${checkpointName}`,
    reference_type: 'trek',
    reference_id: trekId,
  });

  const familyMembers = await query(
    `SELECT DISTINCT u.id as family_id
     FROM trek_participants tp
     JOIN users u ON u.id = tp.user_id AND u.role = 'family'
     WHERE tp.trek_id = $1`,
    [trekId]
  );

  for (const member of familyMembers.rows) {
    await createNotification({
      user_id: member.family_id,
      type: 'checkpoint_reached',
      title: `${userName} Reached Checkpoint`,
      message: `${userName} has reached checkpoint: ${checkpointName}`,
      reference_type: 'trek',
      reference_id: trekId,
    });
  }
};

module.exports = {
  createNotification,
  createCheckpointNotification,
};
