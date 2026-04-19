const { validationResult } = require('express-validator');
const User = require('../models/User');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwt();
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
};

const validationResponse = (res, errors) =>
  res.status(400).json({
    success: false,
    message: errors.array().map((e) => e.msg).join(' '),
    errors: errors.array(),
  });

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationResponse(res, errors);
  try {
    const { name, email, password, phone } = req.body;
    const emailNorm = (email || '').trim().toLowerCase();
    const existing = await User.findOne({ email: emailNorm });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email: emailNorm, password, phone });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationResponse(res, errors);
  try {
    const { email, password } = req.body;
    const emailNorm = (email || '').trim().toLowerCase();
    const passNorm = typeof password === 'string' ? password.trim() : '';
    const user = await User.findOne({ email: emailNorm }).select('+password');
    if (!user) {
      console.warn('[auth/login] No user for email:', emailNorm);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await user.matchPassword(passNorm);
    if (!match) {
      console.warn('[auth/login] Wrong password for:', emailNorm);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate('bookings');
  res.json({ success: true, data: user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
