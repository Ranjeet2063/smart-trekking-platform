const { query } = require('../config/database');
const logger = require('../config/logger');

const list = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, phone, email, relationship, priority, created_at FROM emergency_contacts WHERE user_id = $1 ORDER BY priority DESC, created_at',
      [req.user.id]
    );
    res.json({ success: true, data: { contacts: result.rows } });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, priority } = req.body;
    const result = await query(
      `INSERT INTO emergency_contacts (user_id, name, phone, email, relationship, priority)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0))
       RETURNING id, name, phone, email, relationship, priority, created_at`,
      [req.user.id, name, phone, email, relationship, priority]
    );
    res.status(201).json({
      success: true,
      message: 'Emergency contact added',
      data: { contact: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, priority } = req.body;
    const result = await query(
      `UPDATE emergency_contacts SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        relationship = COALESCE($4, relationship),
        priority = COALESCE($5, priority),
        updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, phone, email, relationship, priority, created_at`,
      [name, phone, email, relationship, priority, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency contact not found' });
    }
    res.json({
      success: true,
      message: 'Emergency contact updated',
      data: { contact: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emergency contact not found' });
    }
    res.json({ success: true, message: 'Emergency contact removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, remove };
