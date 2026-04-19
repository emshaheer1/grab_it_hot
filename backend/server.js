const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const parseAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.includes('http://localhost:3000')) list.push('http://localhost:3000');
  if (!list.includes('http://127.0.0.1:3000')) list.push('http://127.0.0.1:3000');
  return list;
};
const allowedOrigins = parseAllowedOrigins();

// Middleware — allow local dev even if CLIENT_URL is set to production only
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('[cors] Blocked origin:', origin, '| Allowed:', allowedOrigins.join(', '));
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contact', require('./routes/contactPublic'));
app.use('/api/ticket-requests', require('./routes/ticketRequestsPublic'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Grab It Hot API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Copy backend/.env.example to backend/.env and set MONGO_URI.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in backend/.env (required for login tokens).');
  process.exit(1);
}

const mongooseOpts = {
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000,
};

console.log('Connecting to MongoDB (timeout 20s)...');

mongoose
  .connect(process.env.MONGO_URI, mongooseOpts)
  .then(() => {
    const dbName = mongoose.connection?.db?.databaseName;
    console.log('MongoDB connected', dbName ? `(database: ${dbName})` : '');

    const server = app.listen(PORT, () => {
      console.log(`API ready at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env to a free port.`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('\n--- MongoDB connection failed ---');
    console.error(err.message || err);
    console.error('\nCheck:');
    console.error('  • MONGO_URI in backend/.env (password URL-encoded if it has @ # etc.)');
    console.error('  • Atlas → Network Access → IP allowlist (use 0.0.0.0/0 for dev, or your current IP)');
    console.error('  • Atlas → Database Access → user exists and password matches the URI');
    console.error('---\n');
    process.exit(1);
  });
