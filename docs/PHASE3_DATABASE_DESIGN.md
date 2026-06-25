# PHASE 3: DATABASE DESIGN

## 1. PostgreSQL Schema Design

The database uses Neon PostgreSQL with the following design principles:
- UUIDs for primary keys (distributed-friendly)
- Timestamptz for all timestamps (timezone-aware)
- JSONB for flexible route data
- PostGIS extension for geospatial queries (future)
- Composite indexes for query performance
- Foreign keys with ON DELETE CASCADE for cleanup

## 2. Complete SQL Schema

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'trekker'
        CHECK (role IN ('trekker', 'family', 'rescue', 'operator', 'admin')),
    medical_info JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{
        "push_enabled": true,
        "email_enabled": true,
        "sms_enabled": false,
        "checkpoint_alerts": true,
        "sos_alerts": true,
        "weekly_digest": false
    }',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: emergency_contacts
-- ============================================
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(50),
    priority INTEGER DEFAULT 0,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: treks
-- ============================================
CREATE TABLE treks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'moderate'
        CHECK (difficulty IN ('easy', 'moderate', 'hard', 'extreme')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'aborted')),
    route_data JSONB DEFAULT '[]',
    total_distance_km DECIMAL(10,2),
    estimated_duration_hours DECIMAL(5,2),
    location_update_interval INTEGER DEFAULT 10,
    max_participants INTEGER DEFAULT 20,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- ============================================
-- TABLE: trek_participants (join table with role)
-- ============================================
CREATE TABLE trek_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('leader', 'member', 'observer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trek_id, user_id)
);

-- ============================================
-- TABLE: checkpoints
-- ============================================
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    altitude_meters DECIMAL(7,2),
    order_index INTEGER NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    estimated_arrival_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: location_history
-- ============================================
CREATE TABLE location_history (
    id BIGSERIAL PRIMARY KEY,
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    altitude_meters DECIMAL(7,2),
    speed_kmh DECIMAL(5,2),
    heading_degrees DECIMAL(5,2),
    accuracy_meters DECIMAL(5,2),
    battery_level DECIMAL(4,1),
    is_mock BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition the location_history table by month for performance
-- (Run as separate migration after table creation)
-- CREATE TABLE location_history_y2024m01 PARTITION OF location_history
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- (Automated via pg_partman in production)

-- ============================================
-- TABLE: sos_incidents
-- ============================================
CREATE TABLE sos_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trek_id UUID REFERENCES treks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    altitude_meters DECIMAL(7,2),
    accuracy_meters DECIMAL(5,2),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'triggered'
        CHECK (status IN ('triggered', 'acknowledged', 'dispatched', 'resolved', 'closed')),
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rescue_team_notes TEXT,
    weather_at_sos JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: sos_notifications
-- ============================================
CREATE TABLE sos_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_id UUID NOT NULL REFERENCES sos_incidents(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES emergency_contacts(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL DEFAULT 'push'
        CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL
        CHECK (type IN (
            'sos_alert', 'checkpoint_reached', 'trek_started',
            'trek_completed', 'trek_aborted', 'member_joined',
            'emergency_contact_added', 'system'
        )),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    reference_type VARCHAR(30),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: checkpoint_arrivals (tracks when trekkers reach checkpoints)
-- ============================================
CREATE TABLE checkpoint_arrivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    arrived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    UNIQUE(checkpoint_id, user_id)
);

-- ============================================
-- TABLE: refresh_tokens
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Emergency Contacts
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- Treks
CREATE INDEX idx_treks_user_id ON treks(user_id);
CREATE INDEX idx_treks_status ON treks(status);
CREATE INDEX idx_treks_start_date ON treks(start_date);
CREATE INDEX idx_treks_user_status ON treks(user_id, status);

-- Trek Participants
CREATE INDEX idx_trek_participants_trek_id ON trek_participants(trek_id);
CREATE INDEX idx_trek_participants_user_id ON trek_participants(user_id);

-- Checkpoints
CREATE INDEX idx_checkpoints_trek_id ON checkpoints(trek_id);
CREATE INDEX idx_checkpoints_order ON checkpoints(trek_id, order_index);

-- Location History (Critical for performance)
CREATE INDEX idx_location_history_trek_id ON location_history(trek_id);
CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_trek_time ON location_history(trek_id, timestamp DESC);
CREATE INDEX idx_location_history_user_time ON location_history(user_id, timestamp DESC);

-- SOS Incidents
CREATE INDEX idx_sos_incidents_user_id ON sos_incidents(user_id);
CREATE INDEX idx_sos_incidents_status ON sos_incidents(status);
CREATE INDEX idx_sos_incidents_created_at ON sos_incidents(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE expires_at > NOW();

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## 5. Migration Strategy

### Migration Tool: node-pg-migrate

### File Structure
```
database/
  migrations/
    001_create_users_table.sql
    002_create_emergency_contacts.sql
    003_create_treks_tables.sql
    004_create_location_history.sql
    005_create_sos_tables.sql
    006_create_notifications.sql
    007_create_core_indexes.sql
    008_create_audit_logs.sql
  seeds/
    001_admin_user.sql
    002_sample_treks.sql
```

### Migration Runner
```javascript
// database/migrate.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM migrations WHERE name = $1', [file]
    );
    if (rowCount === 0) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(`Migrated: ${file}`);
    }
  }
  
  await pool.end();
}

runMigrations().catch(console.error);
```

## 6. Database Optimization Strategies

### 1. Connection Pooling
- Neon provides built-in connection pooling via PgBouncer
- Max pool size: 20 connections per instance
- Idle timeout: 30 seconds
- Application-level connection pool with `pg-pool`

### 2. Query Optimization
- Use EXPLAIN ANALYZE on all heavy queries
- Avoid SELECT * - always specify columns
- Use LIMIT + OFFSET with proper ordering
- Batch location inserts (insert 10-50 rows at once)

### 3. Partitioning
- Location history partitioned by month
- Audit logs partitioned by month
- Automated via pg_partman or application-level partitioning

### 4. Archival Strategy
- Location data older than 90 days → compressed archive
- Notifications older than 1 year → archive
- Audit logs older than 1 year → archive

### 5. Read vs Write Splitting
- Writes go to primary (Neon compute)
- Reads for monitoring dashboard can use read replicas
- Location history writes are batch-inserted for efficiency

### 6. Caching Strategy (Future)
- Redis for active trek locations (reduce DB reads)
- In-memory cache for user profiles
- CDN for static assets
