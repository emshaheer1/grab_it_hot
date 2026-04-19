/**
 * Used by seed:admin, full seed, and verifyAdminLogin.
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env to override defaults.
 */
function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
}

function getAdminPassword() {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv != null && String(fromEnv).length > 0) {
    return String(fromEnv);
  }
  return 'ali12345@@';
}

module.exports = { getAdminEmail, getAdminPassword };
