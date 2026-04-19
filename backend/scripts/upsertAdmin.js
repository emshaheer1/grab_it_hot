/**
 * Creates or resets only the admin user (password + role). Does not touch events or other users.
 * Run from backend folder: npm run seed:admin
 *
 * Full demo data + admin + optional test user: npm run seed (also non-destructive; upserts only).
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const { getAdminEmail, getAdminPassword } = require('../config/adminCredentials');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const ADMIN_EMAIL = getAdminEmail();
  const ADMIN_PASSWORD = getAdminPassword();

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (user) {
    user.password = ADMIN_PASSWORD;
    user.role = 'admin';
    user.name = user.name || 'Admin User';
    await user.save();
    console.log(`Updated admin: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Created admin: ${ADMIN_EMAIL}`);
  }

  console.log('You can sign in at /admin/login with that email and password.');
  console.log('(Override via ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env before running this script.)');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
