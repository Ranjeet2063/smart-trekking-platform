# PHASE 4: API DESIGN

## 1. REST API Endpoints

### Base URL: `/api/v1`

### Authentication Endpoints
```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login user
POST   /api/v1/auth/logout            # Logout (invalidate refresh token)
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/forgot-password   # Send password reset email
POST   /api/v1/auth/reset-password    # Reset password with token
GET    /api/v1/auth/me                # Get current user profile
```

### User Endpoints
```
GET    /api/v1/users/:id              # Get user by ID
PUT    /api/v1/users/profile          # Update own profile
PUT    /api/v1/users/avatar           # Upload avatar
GET    /api/v1/users/:id/treks        # Get user's treks
```

### Emergency Contacts
```
GET    /api/v1/emergency-contacts     # List emergency contacts
POST   /api/v1/emergency-contacts     # Add emergency contact
PUT    /api/v1/emergency-contacts/:id # Update emergency contact
DELETE /api/v1/emergency-contacts/:id # Remove emergency contact
```

### Trek Endpoints
```
GET    /api/v1/treks                  # List user's treks
POST   /api/v1/treks                  # Create new trek
GET    /api/v1/treks/:id              # Get trek details
PUT    /api/v1/treks/:id              # Update trek
DELETE /api/v1/treks/:id              # Delete trek
POST   /api/v1/treks/:id/start       # Start trek (set status to active)
POST   /api/v1/treks/:id/complete    # Complete trek
POST   /api/v1/treks/:id/abort       # Abort trek

# Checkpoints
POST   /api/v1/treks/:id/checkpoints            # Add checkpoint
PUT    /api/v1/treks/:id/checkpoints/:cid        # Update checkpoint
DELETE /api/v1/treks/:id/checkpoints/:cid        # Delete checkpoint

# Participants
POST   /api/v1/treks/:id/participants           # Add participant
DELETE /api/v1/treks/:id/participants/:pid       # Remove participant
```

### Location Endpoints
```
POST   /api/v1/locations/update      # Update current location
GET    /api/v1/locations/:trekId     # Get location history for trek
GET    /api/v1/locations/:trekId/latest  # Get latest location
GET    /api/v1/locations/:trekId/replay   # Get locations for replay
```

### SOS Endpoints
```
POST   /api/v1/sos/trigger           # Trigger SOS
GET    /api/v1/sos/incidents         # List SOS incidents
GET    /api/v1/sos/incidents/:id     # Get SOS incident details
PUT    /api/v1/sos/incidents/:id/status  # Update SOS status
GET    /api/v1/sos/active            # Get active SOS incidents (rescue teams)
```

### Notification Endpoints
```
GET    /api/v1/notifications         # List user notifications
PUT    /api/v1/notifications/:id/read    # Mark as read
PUT    /api/v1/notifications/read-all    # Mark all as read
```

## 2. Request/Response Schemas

### Register Request
```json
POST /api/v1/auth/register
{
    "email": "trekker@example.com",
    "password": "SecurePass123!",
    "name": "Arjun Sharma",
    "phone": "+919876543210",
    "role": "trekker"
}
```

### Register Response (201)
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "uuid",
            "email": "trekker@example.com",
            "name": "Arjun Sharma",
            "role": "trekker",
            "created_at": "2024-01-15T10:30:00Z"
        },
        "accessToken": "eyJhbGciOiJSUzI1NiIs...",
        "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
    }
}
```

### Login Request
```json
POST /api/v1/auth/login
{
    "email": "trekker@example.com",
    "password": "SecurePass123!"
}
```

### Login Response (200)
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "uuid",
            "email": "trekker@example.com",
            "name": "Arjun Sharma",
            "role": "trekker",
            "avatar_url": null
        },
        "accessToken": "eyJhbGciOiJSUzI1NiIs...",
        "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
    }
}
```

### Create Trek Request
```json
POST /api/v1/treks
{
    "name": "Everest Base Camp Trek",
    "description": "Classic EBC trek through Khumbu region",
    "difficulty": "hard",
    "start_date": "2024-04-15",
    "end_date": "2024-04-28",
    "route_data": [
        {"lat": 27.7172, "lng": 85.3240, "name": "Lukla"},
        {"lat": 27.7912, "lng": 86.7172, "name": "Namche Bazaar"},
        {"lat": 27.9878, "lng": 86.9250, "name": "Tengboche"},
        {"lat": 28.0030, "lng": 86.8600, "name": "Dingboche"},
        {"lat": 28.0987, "lng": 86.8250, "name": "Lobuche"},
        {"lat": 28.1345, "lng": 86.8495, "name": "Gorak Shep"},
        {"lat": 28.0029, "lng": 86.8600, "name": "Kala Patthar"},
        {"lat": 27.7172, "lng": 85.3240, "name": "Lukla (Return)"}
    ],
    "total_distance_km": 130.00,
    "estimated_duration_hours": 312,
    "max_participants": 12
}
```

### Location Update Request
```json
POST /api/v1/locations/update
{
    "trek_id": "uuid-of-active-trek",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "altitude_meters": 2860.5,
    "speed_kmh": 3.2,
    "heading_degrees": 45.0,
    "accuracy_meters": 8.0,
    "battery_level": 85.0,
    "timestamp": "2024-04-15T12:00:00Z"
}
```

### SOS Trigger Request
```json
POST /api/v1/sos/trigger
{
    "trek_id": "uuid-of-active-trek",
    "latitude": 27.9878,
    "longitude": 86.9250,
    "altitude_meters": 3860.0,
    "accuracy_meters": 10.0,
    "message": "Fell and injured ankle. Need immediate assistance."
}
```

### Error Response Format
```json
{
    "success": false,
    "message": "Validation error",
    "errors": [
        {
            "field": "email",
            "message": "Valid email is required"
        }
    ]
}
```

## 3. Authentication Flow

```
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│   Client    │           │   Backend   │           │   Database  │
└──────┬──────┘           └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       │  POST /auth/register    │                         │
       │  {email, password,      │                         │
       │   name, role}           │                         │
       │────────────────────────►│                         │
       │                         │  Hash password (bcrypt) │
       │                         │  Create user            │
       │                         │───────────────────────► │
       │                         │  User created           │
       │                         │◄─────────────────────── │
       │                         │                         │
       │                         │  Generate accessToken   │
       │                         │  (JWT, 24h expiry)      │
       │                         │  Generate refreshToken  │
       │                         │  (random, 7d expiry)    │
       │                         │                         │
       │  {user, accessToken,    │                         │
       │   refreshToken}         │                         │
       │◄────────────────────────│                         │
       │                         │                         │
       │  Store accessToken in   │                         │
       │  memory/localStorage    │                         │
       │  Store refreshToken in  │                         │
       │  httpOnly cookie        │                         │
       │                         │                         │
       │  GET /auth/me           │                         │
       │  Authorization:         │                         │
       │    Bearer <accessToken> │                         │
       │────────────────────────►│                         │
       │                         │  Verify JWT signature   │
       │                         │  Extract user_id        │
       │                         │  Fetch user             │
       │                         │───────────────────────► │
       │                         │◄─────────────────────── │
       │  {user}                 │                         │
       │◄────────────────────────│                         │
```

## 4. Authorization Rules

| Endpoint | Trekker | Family | Rescue | Operator | Admin |
|----------|---------|--------|--------|----------|-------|
| POST /auth/* | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /auth/me | ✓ | ✓ | ✓ | ✓ | ✓ |
| PUT /users/profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /emergency-contacts | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /emergency-contacts | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /treks | ✓ | - | - | ✓ | ✓ |
| PUT /treks/:id | Owner | - | - | Owner | ✓ |
| POST /treks/:id/start | Owner | - | - | Owner | ✓ |
| GET /treks/:id | Owner/Part | Family* | ✓ | ✓ | ✓ |
| POST /locations/update | ✓ | - | - | ✓ | - |
| GET /locations/:trekId | Owner/Part | Family* | ✓ | ✓ | ✓ |
| POST /sos/trigger | ✓ | - | - | ✓ | ✓ |
| GET /sos/active | - | - | ✓ | ✓ | ✓ |
| PUT /sos/:id/status | - | - | ✓ | ✓ | ✓ |
| GET /notifications | ✓ | ✓ | ✓ | ✓ | ✓ |

*Family members can view treks of their linked trekkers only.

## 5. Error Handling Standards

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (no token / invalid token)
- 403: Forbidden (insufficient role)
- 404: Not Found
- 409: Conflict (duplicate)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

### Error Response Structure
```json
{
    "success": false,
    "message": "Human-readable error message",
    "errorCode": "VALIDATION_ERROR",
    "errors": [
        {
            "field": "email",
            "message": "Valid email is required"
        }
    ],
    "requestId": "req-uuid"
}
```
