# PHASE 9: SECURITY

## 1. JWT Authentication
- **Implementation**: `jsonwebtoken` library with RS256 signing
- **Access Token**: Short-lived (24h default), stored in memory/localStorage
- **Refresh Token**: Long-lived (7 days), stored in database for revocation
- **Token Validation**: Every API request validated via middleware (src/middleware/auth.js)
- **File**: `backend/src/services/auth.service.js:92-105`

## 2. Password Hashing
- **Algorithm**: bcrypt with cost factor 12
- **Implementation**: 
```javascript
const password_hash = await bcrypt.hash(password, 12);
```
- **File**: `backend/src/services/auth.service.js:18`
- **Verification**: `bcrypt.compare()` for login (auth.service.js:41)

## 3. Rate Limiting
- **Global**: 100 requests per minute per IP
- **SOS Endpoint**: 10 requests per minute (prevents SOS spam)
- **Implementation**: `express-rate-limit`
- **File**: `backend/src/app.js:33-47`

## 4. Input Validation
- **Library**: Joi schema validation
- **All Inputs Validated**: Registration, login, trek creation, location updates, SOS triggers
- **Sanitization**: Joi strips unknown fields automatically
- **Files**: `backend/src/validators/*.js`

## 5. SQL Injection Protection
- **Library**: `pg` with parameterized queries
- **All Queries Use**: `$1, $2, ...` parameterized syntax
- **No Raw String Concatenation**: Ever
- **Example**: 
```javascript
const result = await query('SELECT * FROM users WHERE email = $1', [email]);
```

## 6. XSS Protection
- **Library**: `helmet.js` middleware
- **Sets HTTP Headers**: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, etc.
- **File**: `backend/src/app.js:23`

## 7. CORS Protection
- **Restricted Origins**: Only allowed origins from environment variable
- **Credentials**: Enabled only for allowed origins
- **Methods**: Explicitly whitelisted (GET, POST, PUT, DELETE, PATCH)
- **File**: `backend/src/app.js:24-30`

## 8. Secure Environment Variables
- **Development**: `.env` file (gitignored)
- **Production**: Set via platform (Railway/Render) environment variables
- **Validation**: Missing critical vars cause startup failure
- **File**: `backend/src/config/index.js:18-24`

## 9. Additional Security Measures

### HTTP Security Headers (via Helmet)
```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
```

### Request Validation Middleware
```javascript
// All requests pass through:
1. Rate Limiter (100 req/min)
2. Helmet (security headers)
3. CORS (origin check)
4. Morgan (logging)
5. Auth middleware (JWT validation)
6. Validator (Joi schema validation)
7. Controller (business logic)
8. Error Handler (centralized)
```
