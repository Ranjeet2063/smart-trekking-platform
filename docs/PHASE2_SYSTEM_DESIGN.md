# PHASE 2: SYSTEM DESIGN

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  React SPA   │  │  Mobile Web  │  │   Admin UI   │              │
│  │  (Vercel)    │  │  (PWA)       │  │   (React)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│    HTTPS/WS           HTTPS/WS           HTTPS/WS                    │
└─────────┼─────────────────┼─────────────────┼────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Express.js REST API + Socket.io              │       │
│  │              (Railway/Render - Node.js)                   │       │
│  │                                                          │       │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐   │       │
│  │  │  Auth   │  │   Trek   │  │ Location │  │   SOS  │   │       │
│  │  │ Module  │  │  Module  │  │  Module  │  │ Module │   │       │
│  │  └─────────┘  └──────────┘  └──────────┘  └────────┘   │       │
│  │                                                          │       │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐   │       │
│  │  │  User   │  │ Notifica-│  │  WebSocket Manager   │   │       │
│  │  │ Module  │  │ tion Mod │  │  (Socket.io Server)  │   │       │
│  │  └─────────┘  └──────────┘  └──────────────────────┘   │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                    │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │  Auth Service  │  │  Trek Service  │  │  GPS Service   │         │
│  │  (JWT + Bcrypt)│  │  (CRUD + Logic)│  │ (Geospatial)   │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │  SOS Service   │  │ Notification  │  │  Email/SMS     │         │
│  │  (Emergency)   │  │  Service      │  │  Service       │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Neon PostgreSQL (Serverless)                  │       │
│  │                                                          │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │       │
│  │  │  Users   │  │  Treks   │  │Location  │  │   SOS    │ │       │
│  │  │  Table   │  │  Table   │  │History   │  │Incidents │ │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │       │
│  │  │Emergency │  │Checkpoints│  │Notifica- │               │       │
│  │  │Contacts  │  │  Table    │  │tions Tbl │               │       │
│  │  └──────────┘  └──────────┘  └──────────┘               │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Low-Level Architecture

### Backend Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Express Application                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Middleware Pipeline                        │    │
│  │                                                              │    │
│  │  Request → Rate Limiter → Helmet → CORS → Auth → Router     │    │
│  │                                                              │    │
│  │                  ↓                                           │    │
│  │  Router → Validator → Controller → Service → Model → DB    │    │
│  │                                                              │    │
│  │                  ↓                                           │    │
│  │  Response ← Error Handler ← Logger ← Service Result         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐     │
│  │   Socket.io Server      │  │   Redis Cache (Future)       │     │
│  │                         │  │                              │     │
│  │  Connection → Auth →    │  │  Store: Active Treks,        │     │
│  │  Room Join → Events     │  │  Session Data, GeoFences     │     │
│  └─────────────────────────┘  └──────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Frontend-Backend Interaction

```
┌──────────────┐          HTTPS/REST          ┌──────────────┐
│              │ ◄──────────────────────────► │              │
│   React App  │    Auth, Treks, Profile       │   Express    │
│   (Browser)  │                               │   Backend    │
│              │ ◄──────────────────────────► │              │
│              │    WebSocket (Socket.io)      │              │
│              │    - Location Updates         │              │
│              │    - SOS Alerts               │              │
│              │    - Notifications            │              │
└──────────────┘                               └──────────────┘
```

### API Call Flow
1. User authenticates → JWT stored in localStorage
2. JWT sent in Authorization header for all API calls
3. Backend validates JWT, extracts user_id, role
4. API returns JSON responses
5. WebSocket connection established after auth
6. Client joins Socket.io rooms (trek_id, user_id)
7. Location updates emitted as Socket.io events
8. Events broadcast to all room members

## 4. Real-Time GPS Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Trekker  │────►│ Browser  │────►│ Socket   │────►│  Room    │
│  Device   │     │ App      │     │ .io      │     │ Members  │
│  GPS      │     │          │     │ Server   │     │ (Family, │
│  Chip     │     │          │     │          │     │  Rescue) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ Geolocation    │ updateLocation │ Broadcast      │
     │ API (browser)  │ event          │ to room        │
     ├────────────────►│               │                │
     │ lat,lng,alt,   │───────────────►│                │
     │ speed,heading, │                │───────────────►│
     │ accuracy,bat   │                │                │
     │                │                │                │
     │ Every N secs   │ Persist to DB  │                │
     │ (configurable) │ every 30s      │                │
     │                │                │                │
```

### Location Update Frequency Strategy
- **Active Moving**: Every 10 seconds (default)
- **Stationary**: Every 60 seconds (battery save)
- **Low Battery (<20%)**: Every 30 seconds
- **SOS Active**: Every 5 seconds (highest priority)
- **Offline**: Buffer in localStorage, flush on reconnect

## 5. SOS Workflow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Trekker  │     │  Backend  │     │  Family   │     │  Rescue   │
│  (App)    │     │           │     │  Members  │     │  Team     │
└────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
     │                  │                  │                  │
     │ 1. Tap SOS       │                  │                  │
     │─────────────────►│                  │                  │
     │                  │ 2. Create Incident                  │
     │                  │ 3. Fetch Emergency Contacts         │
     │                  │ 4. Get Current GPS + Trek Info      │
     │                  │                  │                  │
     │  SOS Created     │ 5. Emit sos:alert                  │
     │◄─────────────────│──────────────────►                  │
     │                  │────────────────────────────────────►│
     │                  │                  │                  │
     │                  │ 6. Send Notifications               │
     │                  │  - Push Notification                │
     │                  │  - Email to emergency contacts       │
     │                  │  - SMS (via Twilio, future)         │
     │                  │                  │                  │
     │ 7. Rescue Team Acknowledges        │                  │
     │                  │◄────────────────────────────────────│
     │                  │                  │                  │
     │ Status Update   │ 8. Emit sos:status_update           │
     │◄────────────────│──────────────────►                  │
     │                  │◄───────────────────────────────────│
     │                  │                  │                  │
     │ 9. Rescue Team Resolves                              │
     │                  │◄────────────────────────────────────│
     │                  │ 10. Emit sos:resolved               │
     │◄────────────────│──────────────────►                  │
     │                  │◄───────────────────────────────────│
```

### SOS States
- **TRIGGERED**: Initial state when trekker activates SOS
- **ACKNOWLEDGED**: Rescue team has seen and acknowledged
- **DISPATCHED**: Rescue team en route to location
- **RESOLVED**: Trekker is safe, situation handled
- **CLOSED**: Incident formally closed with report

## 6. Notification Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Event      │     │ Notification  │     │  Delivery    │
│   Source     │────►│   Service     │────►│  Channels    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                      │
       │ Trek Started       │                      ├──► Push (Web)
       │ Checkpoint Reached │   Create Notification ├──► Email
       │ SOS Triggered      │   in DB + Queue      ├──► In-App
       │ Trek Completed     │                      └──► SMS (future)
       │ SOS Resolved       │
       │                    │
```

## 7. Scalability Considerations

### Database Scaling
- Neon PostgreSQL auto-scales compute
- Read replicas for monitoring queries
- Connection pooling via PgBouncer (integrated in Neon)
- Partition location_history by month for query performance
- Index on (trek_id, timestamp) for location queries

### Application Scaling
- Stateless Express API (scale horizontally)
- Socket.io with Redis adapter for multi-instance WebSocket
- Rate limiting per user/IP
- Load balancer (Railway/Render handles this)

### Frontend Scaling
- Static assets served via CDN (Vercel)
- Lazy loading for routes and components
- WebSocket reconnection with exponential backoff
- Service Worker for PWA offline support

## 8. Architecture Diagrams (ASCII)

### Deployment Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL (CDN)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React SPA (Build & Deploy)                         │   │
│  │  - Automatic SSL, Global Edge Network               │   │
│  │  - Environment Variables: VITE_API_URL               │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTPS/WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   RAILWAY / RENDER                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js Backend (Node.js)                       │   │
│  │  - REST API :3000                                   │   │
│  │  - Socket.io Server :3000                           │   │
│  │  - Auto-scaling instances                           │   │
│  │  - Environment Variables: DATABASE_URL, JWT_SECRET   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    TLS/SSL
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    NEON POSTGRESQL                           │
│                                                             │
│  - Serverless PostgreSQL                                   │
│  - Auto-scaling compute                                    │
│  - Connection pooling                                      │
│  - Daily backups                                           │
│  - Branching for dev/staging                               │
└────────────────────────────────────────────────────────────┘
```

### Database ER Diagram (ASCII)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users     │     │    treks         │     │   treks_users    │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │◄────│ user_id (FK)     │     │ trek_id (FK)     │
│ email        │     │ id (PK)          │     │ user_id (FK)     │
│ password_hash│     │ name             │     │ role (leader/member)
│ name         │     │ difficulty       │◄────│ joined_at        │
│ phone        │     │ start_date       │     └──────────────────┘
│ avatar_url   │     │ end_date         │            │
│ role         │     │ status           │            │
│ medical_info │     │ route_data (JSON)│            │
│ created_at   │     │ created_at       │            │
└──────┬───────┘     └────────┬─────────┘            │
       │                      │                       │
       │ 1:N                  │ 1:N                   │
       │                      │                       │
       ▼                      ▼                       ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│emergency_    │     │location_history  │     │  checkpoints     │
│contacts      │     ├──────────────────┤     ├──────────────────┤
├──────────────┤     │ id (PK)          │     │ id (PK)          │
│ id (PK)      │     │ trek_id (FK)     │     │ trek_id (FK)     │
│ user_id (FK) │     │ user_id (FK)     │     │ name             │
│ name         │     │ latitude         │     │ latitude         │
│ phone        │     │ longitude        │     │ longitude        │
│ email        │     │ altitude         │     │ order_index      │
│ relationship │     │ speed            │     │ radius_meters    │
│ notified     │     │ heading          │     └──────────────────┘
└──────────────┘     │ battery_level    │
                     │ timestamp        │     ┌──────────────────┐
                     │ created_at       │     │   sos_incidents  │
                     └──────────────────┘     ├──────────────────┤
                                              │ id (PK)          │
                     ┌──────────────────┐     │ trek_id (FK)     │
                     │ notifications    │     │ user_id (FK)     │
                     ├──────────────────┤     │ latitude         │
                     │ id (PK)          │     │ longitude        │
                     │ user_id (FK)     │     │ status           │
                     │ type             │     │ acknowledged_by  │
                     │ title            │     │ acknowledged_at  │
                     │ message          │     │ dispatched_at    │
                     │ read             │     │ resolved_at      │
                     │ created_at       │     │ notes            │
                     └──────────────────┘     └──────────────────┘
```
