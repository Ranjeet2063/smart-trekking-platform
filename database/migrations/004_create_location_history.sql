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

CREATE INDEX idx_location_history_trek_id ON location_history(trek_id);
CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_trek_time ON location_history(trek_id, timestamp DESC);
CREATE INDEX idx_location_history_user_time ON location_history(user_id, timestamp DESC);

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
