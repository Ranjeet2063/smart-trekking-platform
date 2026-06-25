const { query, getClient } = require('../config/database');
const logger = require('../config/logger');
const { createNotification } = require('./notification.service');

const triggerSOS = async (sosData, userId) => {
  const { trek_id, latitude, longitude, altitude_meters, accuracy_meters, message } = sosData;

  const trekResult = await query(
    `SELECT t.id, t.name, t.status FROM treks t
     WHERE t.id = $1 AND (
       t.user_id = $2 OR $2 IN (
         SELECT tp.user_id FROM trek_participants tp WHERE tp.trek_id = t.id
       )
     )`,
    [trek_id, userId]
  );

  if (trekResult.rows.length === 0) {
    throw new Error('Active trek not found');
  }

  const contactsResult = await query(
    'SELECT id, name, phone, email FROM emergency_contacts WHERE user_id = $1 ORDER BY priority DESC',
    [userId]
  );

  const userResult = await query(
    'SELECT id, name, email, medical_info FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  const sosResult = await query(
    `INSERT INTO sos_incidents (trek_id, user_id, latitude, longitude, altitude_meters, accuracy_meters, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [trek_id, userId, latitude, longitude, altitude_meters, accuracy_meters, message]
  );

  const sos = sosResult.rows[0];

  await createNotification({
    user_id: userId,
    type: 'sos_alert',
    title: 'SOS Alert Triggered',
    message: `Your SOS has been triggered at (${latitude}, ${longitude}). Rescue teams have been notified.`,
    reference_type: 'sos_incident',
    reference_id: sos.id,
  });

  for (const contact of contactsResult.rows) {
    if (contact.email) {
      await query(
        `INSERT INTO sos_notifications (sos_id, contact_id, user_id, channel, status)
         VALUES ($1, $2, $3, 'email', 'pending')`,
        [sos.id, contact.id, userId]
      );

      logger.info(`[SOS EMAIL] To: ${contact.email} - ${user.name} needs help! Location: ${latitude}, ${longitude}`);

      await createNotification({
        user_id: userId,
        type: 'emergency_contact_added',
        title: `Emergency Contact Notified: ${contact.name}`,
        message: `${contact.name} has been notified via email about your SOS.`,
        reference_type: 'sos_incident',
        reference_id: sos.id,
      });
    }
  }

  if (contactsResult.rows.length === 0) {
    logger.warn(`User ${userId} triggered SOS with no emergency contacts`);
  }

  return sos;
};

const listIncidents = async (user) => {
  let result;
  if (user.role === 'rescue' || user.role === 'operator' || user.role === 'admin') {
    result = await query(
      `SELECT si.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
              t.name as trek_name
       FROM sos_incidents si
       JOIN users u ON u.id = si.user_id
       LEFT JOIN treks t ON t.id = si.trek_id
       ORDER BY si.created_at DESC
       LIMIT 100`
    );
  } else {
    result = await query(
      `SELECT si.*, u.name as user_name, t.name as trek_name
       FROM sos_incidents si
       JOIN users u ON u.id = si.user_id
       LEFT JOIN treks t ON t.id = si.trek_id
       WHERE si.user_id = $1
       ORDER BY si.created_at DESC`,
      [user.id]
    );
  }
  return result.rows;
};

const getIncidentById = async (incidentId, user) => {
  let result;
  if (user.role === 'rescue' || user.role === 'operator' || user.role === 'admin') {
    result = await query(
      `SELECT si.*, u.name as user_name, u.email, u.phone, u.medical_info,
              u.avatar_url, t.name as trek_name
       FROM sos_incidents si
       JOIN users u ON u.id = si.user_id
       LEFT JOIN treks t ON t.id = si.trek_id
       WHERE si.id = $1`,
      [incidentId]
    );
  } else {
    result = await query(
      `SELECT si.*, u.name as user_name, t.name as trek_name
       FROM sos_incidents si
       JOIN users u ON u.id = si.user_id
       LEFT JOIN treks t ON t.id = si.trek_id
       WHERE si.id = $1 AND si.user_id = $2`,
      [incidentId, user.id]
    );
  }
  return result.rows[0] || null;
};

const updateIncidentStatus = async (incidentId, user, data) => {
  const { status, notes } = data;
  const validStatuses = ['acknowledged', 'dispatched', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status value');
  }

  const setFields = ['status = $2', 'updated_at = NOW()'];
  const params = [incidentId, status];
  let paramIndex = 3;

  if (status === 'acknowledged') {
    setFields.push('acknowledged_at = NOW()');
    setFields.push(`acknowledged_by = $${paramIndex}`);
    params.push(user.id);
    paramIndex++;
  } else if (status === 'dispatched') {
    setFields.push('dispatched_at = NOW()');
  } else if (status === 'resolved') {
    setFields.push('resolved_at = NOW()');
    setFields.push(`resolved_by = $${paramIndex}`);
    params.push(user.id);
    paramIndex++;
  } else if (status === 'closed') {
    setFields.push('closed_at = NOW()');
    setFields.push(`resolved_by = $${paramIndex}`);
    params.push(user.id);
    paramIndex++;
  }

  if (notes) {
    setFields.push(`rescue_team_notes = COALESCE(rescue_team_notes || $${paramIndex}, $${paramIndex + 1})`);
    params.push('\n---\n', notes);
    paramIndex += 2;
  }

  const result = await query(
    `UPDATE sos_incidents SET ${setFields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  if (result.rows.length > 0) {
    const sos = result.rows[0];
    await createNotification({
      user_id: sos.user_id,
      type: 'sos_alert',
      title: `SOS Status Updated: ${status}`,
      message: `Your SOS incident has been updated to "${status}" by rescue team.`,
      reference_type: 'sos_incident',
      reference_id: sos.id,
    });
  }

  return result.rows[0] || null;
};

const getActiveIncidents = async () => {
  const result = await query(
    `SELECT si.*, u.name as user_name, u.email, u.phone, u.medical_info,
            u.avatar_url, t.name as trek_name
     FROM sos_incidents si
     JOIN users u ON u.id = si.user_id
     LEFT JOIN treks t ON t.id = si.trek_id
     WHERE si.status IN ('triggered', 'acknowledged', 'dispatched')
     ORDER BY si.created_at DESC`
  );
  return result.rows;
};

module.exports = {
  triggerSOS,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
  getActiveIncidents,
};
