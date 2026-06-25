# 🏔️ Smart Trekking Monitoring Platform

A real-time trekking safety platform that connects trekkers, family members, and rescue teams through live location tracking, SOS emergency alerts, and coordinated rescue management.

## ✨ Features

- **Real-Time GPS Tracking** - Live location sharing with configurable update intervals
- **Family Monitoring** - Dashboard for family to track trekkers on interactive maps
- **SOS Emergency System** - One-tap emergency alerts with automatic contact notification
- **Rescue Team Dashboard** - Dedicated interface for managing SOS incidents
- **Trek Management** - Create, manage, and track trekking expeditions with checkpoints
- **JWT Authentication** - Secure, role-based access control
- **WebSocket Live Updates** - Sub-second location updates via Socket.io

## 🏗 Architecture

```
Frontend (React + Vite) ───► Backend (Express + Socket.io) ───► Neon PostgreSQL
         │                              │
    Deployed on                     Deployed on
     Vercel (CDN)                 Railway/Render
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Zustand, TailwindCSS, Leaflet/OpenStreetMap |
| Backend | Node.js, Express.js, Socket.io |
| Database | Neon (PostgreSQL) with pg |
| Auth | JWT + Bcrypt |
| Real-Time | WebSocket (Socket.io) |
| Deployment | Vercel (Frontend), Railway/Render (Backend) |

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL database
- Google Maps API key (optional, uses OpenStreetMap)

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/smart-trekking-platform.git
cd smart-trekking-platform
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secrets
npm install
npm run migrate
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Health Check: http://localhost:3000/api/v1/health

## 🧪 Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🔑 Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_EXPIRES_IN` | Token expiry (default: 24h) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `BCRYPT_SALT_ROUNDS` | Password hash rounds (default: 12) |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_SOCKET_URL` | WebSocket server URL |

## 📚 API Documentation

### Authentication
```
POST /api/v1/auth/register    - Register new user
POST /api/v1/auth/login       - Login
POST /api/v1/auth/refresh     - Refresh access token
GET  /api/v1/auth/me          - Get current user
```

### Treks
```
GET    /api/v1/treks           - List treks
POST   /api/v1/treks           - Create trek
GET    /api/v1/treks/:id       - Get trek details
PUT    /api/v1/treks/:id       - Update trek
DELETE /api/v1/treks/:id       - Delete trek
POST   /api/v1/treks/:id/start - Start trek
```

### Locations
```
POST /api/v1/locations/update       - Update GPS location
GET  /api/v1/locations/:trekId      - Get location history
GET  /api/v1/locations/:trekId/latest - Get latest location
```

### SOS
```
POST /api/v1/sos/trigger            - Trigger SOS
GET  /api/v1/sos/incidents          - List incidents
GET  /api/v1/sos/active             - Active incidents (rescue)
PUT  /api/v1/sos/incidents/:id/status - Update incident status
```

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT with configurable expiry
- Rate limiting on all endpoints (100 req/min)
- SOS rate limiting (10 req/min)
- Helmet.js for HTTP headers
- Parameterized queries (SQL injection prevention)
- Input validation with Joi
- CORS restricted to known origins

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
npx vercel --prod
```

### Backend (Railway)
- Connect GitHub repository
- Set build command: `cd backend && npm install`
- Set start command: `cd backend && node src/server.js`
- Add all environment variables in Railway dashboard

### Database (Neon)
- Create project in Neon Console
- Copy connection string to DATABASE_URL
- Run migrations

## 🧑‍💻 Development

```bash
# Start backend (with hot reload)
cd backend && npm run dev

# Start frontend (with hot reload)
cd frontend && npm run dev

# Run database migrations
cd database && node migrate.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file

## 🙏 Support

- Documentation: https://github.com/your-org/smart-trekking-platform/docs
- Issues: https://github.com/your-org/smart-trekking-platform/issues
- Email: support@smarttrekking.com
