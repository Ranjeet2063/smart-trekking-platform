CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    notification_preferences JSONB DEFAULT '{"push_enabled": true, "email_enabled": true, "sms_enabled": false, "checkpoint_alerts": true, "sos_alerts": true, "weekly_digest": false}',
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
