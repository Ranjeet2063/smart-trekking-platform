const userService = require('../services/user.service');
const { query } = require('../config/database');
const logger = require('../config/logger');

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const getUserTreks = async (req, res, next) => {
  try {
    const treks = await userService.getUserTreks(req.params.id);
    res.json({
      success: true,
      data: { treks },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  updateProfile,
  getUserTreks,
};
