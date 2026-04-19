/**
 * Checks Atlas/DB connection, database name, and admin user + password.
 * Usage (from backend folder): node scripts/verifyAdminLogin.js
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const { getAdminEmail, getAdminPassword } = require('../config/adminCredentials');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in backend/.env');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET in backend/.env — login will fail after password check.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.db.databaseName;
  console.log('Connected. Database name:', dbName);
  console.log('(Users must exist in THIS database — same MONGO_URI as the running API.)\n');

  const ADMIN_EMAIL = getAdminEmail();
  const EXPECTED_PASSWORD = getAdminPassword();

  const user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (!user) {
    console.error('No user with email:', ADMIN_EMAIL);
    console.error('Fix: run  npm run seed:admin  from the backend folder using this same .env');
    process.exit(1);
  }

  console.log('User found:', user.email, '| role:', user.role);
  const ok = await bcrypt.compare(EXPECTED_PASSWORD, user.password);
  console.log('Password matches ADMIN_PASSWORD / default:', ok ? 'YES' : 'NO');
  if (!ok) {
    console.error('Fix: run  npm run seed:admin  to reset the admin password.');
    process.exit(1);
  }

  console.log('\nOK — same checks the API uses should allow login.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
