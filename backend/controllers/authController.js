const authService = require('../services/authService');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, user, 'Profile retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, getProfile };
