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

CREATE INDEX idx_treks_user_id ON treks(user_id);
CREATE INDEX idx_treks_status ON treks(status);
CREATE INDEX idx_treks_start_date ON treks(start_date);
CREATE INDEX idx_treks_user_status ON treks(user_id, status);

CREATE TABLE trek_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('leader', 'member', 'observer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trek_id, user_id)
);

CREATE INDEX idx_trek_participants_trek_id ON trek_participants(trek_id);
CREATE INDEX idx_trek_participants_user_id ON trek_participants(user_id);

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

CREATE INDEX idx_checkpoints_trek_id ON checkpoints(trek_id);
CREATE INDEX idx_checkpoints_order ON checkpoints(trek_id, order_index);
