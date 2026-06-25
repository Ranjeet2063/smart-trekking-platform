const { query } = require('../config/database');

const canAccessTrek = async (req, res, next) => {
  try {
    const trekId = req.params.trekId;
    const user = req.user;

    if (!trekId) {
      return res.status(400).json({ success: false, message: 'Trek ID required' });
    }

    if (user.role === 'admin' || user.role === 'rescue' || user.role === 'operator') {
      return next();
    }

    const result = await query(
      `SELECT 1 FROM treks t
       LEFT JOIN trek_participants tp ON tp.trek_id = t.id AND tp.user_id = $1
       WHERE t.id = $2 AND (t.user_id = $1 OR tp.user_id = $1)`,
      [user.id, trekId]
    );

    if (result.rows.length === 0) {
      if (user.role === 'family') {
        const familyAccess = await query(
          `SELECT 1 FROM treks t
           JOIN users u ON u.id = t.user_id
           JOIN emergency_contacts ec ON ec.user_id = u.id
           WHERE t.id = $1 AND ec.email = $2
           LIMIT 1`,
          [trekId, user.email]
        );
        if (familyAccess.rows.length > 0) return next();
      }
      return res.status(403).json({ success: false, message: 'Access denied to this trek data' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { canAccessTrek };
