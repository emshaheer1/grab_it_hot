# 🔥 Grab It Hot — Event Booking Platform

A full-stack event booking web application built with React, Node.js (Express), and MongoDB.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, React Toastify |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Email | Nodemailer |

---

## Project Structure

```
grab-it-hot/
├── backend/
│   ├── controllers/      # Business logic
│   ├── middleware/        # JWT auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── server.js         # Entry point
│   ├── seed.js           # DB seeder
│   └── .env.example      # Environment variables template
└── frontend/
    ├── public/
    └── src/
        ├── components/   # Navbar, Footer, EventCard, AdminRoute, …
        ├── context/      # AuthContext
        ├── pages/        # All page components
        └── utils/        # api.js (Axios), helpers.js
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas (or any MongoDB you control)
- npm or yarn

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — your **Atlas** connection string (see `backend/.env.example`)
- `JWT_SECRET` — any long random string
- `SMTP_*` — your email credentials (optional, for confirmation emails)
- `CLIENT_URL` — your real frontend URL in production (for CORS)

---

### 3. Seed the database (safe — does not delete data)

```bash
cd backend
npm run seed
```

This **upserts only** (no wipe):
- **6 demo events** matched by title (insert new or update existing)
- **Admin** `admin@gmail.com` — password reset to `ali12345@@`, role `admin`
- **Test user** `test@grabit-hot.com` — created only if missing (never overwritten)

Admin password only, no events:

```bash
npm run seed:admin
```

---

### 4. Run the App

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user (🔒) |
| PUT | /api/auth/profile | Update profile (🔒) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | List all (with filters) |
| GET | /api/events/featured | Featured events |
| GET | /api/events/:id | Event detail |
| POST | /api/events | Create (🔒 admin) |
| PUT | /api/events/:id | Update (🔒 admin) |
| DELETE | /api/events/:id | Delete (🔒 admin) |

**Query params for GET /api/events:**
`city`, `state`, `category`, `date`, `minPrice`, `maxPrice`, `search`, `page`, `limit`

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bookings | Create booking (🔒) |
| GET | /api/bookings/my | My bookings (🔒) |
| GET | /api/bookings/:id | Booking detail (🔒) |
| PUT | /api/bookings/:id/cancel | Cancel booking (🔒) |

---

## Features

- ✅ Browse & filter events (city, category, date, price range, search)
- ✅ Event detail pages with ticket tier selection
- ✅ 3-step booking flow (Select → Details → Review)
- ✅ Promo code discount system
- ✅ JWT authentication (register/login/logout)
- ✅ Protected routes
- ✅ User profile & booking history
- ✅ Booking cancellation
- ✅ Email confirmation (via Nodemailer)
- ✅ Admin role support
- ✅ Fully responsive (mobile + desktop)
- ✅ Ticket availability tracking

---

## Default event (seed)

The database seed creates a single featured event: **Junooni Tour — USA** (August 2026, multi-city USA tour). Run `npm run seed` from the `backend` folder after setting `MONGO_URI`. Seeding removes any other events so only this listing remains.

---

## Deployment Notes

**Backend (Railway / Render / Heroku):**
1. Set all environment variables from `.env.example`
2. Use MongoDB Atlas for cloud database
3. Run `npm start`

**Frontend (Vercel / Netlify):**
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. Run `npm run build`
3. Deploy the `build/` folder

---

## License

MIT — feel free to use and adapt.
