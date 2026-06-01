
-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 5: Real-time Location Tracking
-- ════════════════════════════════════════════════════════════════════════════════════════

-- RIDER LOCATIONS (Real-time tracking during ride)
CREATE TABLE public.rider_locations (
                                        id SERIAL PRIMARY KEY,
                                        started_ride_id INTEGER NOT NULL REFERENCES public.started_rides(id) ON DELETE CASCADE,
                                        rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                        location_name VARCHAR(255),
                                        location GEOMETRY(Point, 4326),
                                        distance_meters DOUBLE PRECISION,
                                        timestamp TIMESTAMP NOT NULL,
                                        FOREIGN KEY (started_ride_id) REFERENCES public.started_rides(id) ON DELETE CASCADE
);

-- PARTICIPANT LOCATION (Track all participants)
CREATE TABLE public.participant_location (
                                             participant_location_id SERIAL PRIMARY KEY,
                                             started_ride_id INTEGER NOT NULL REFERENCES public.started_rides(id) ON DELETE CASCADE,
                                             rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                             participant_location GEOMETRY(Point, 4326),
                                             last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             UNIQUE(started_ride_id, rider_username)
);


CREATE TABLE public.ride_checkpoint_arrivals (
                                                 id SERIAL PRIMARY KEY,
                                                 generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                                 rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                                 checkpoint_type VARCHAR(50) NOT NULL,
                                                 checkpoint_index INTEGER,
                                                 arrived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- FINISHED RIDES (Record of completed rides)
CREATE TABLE public.finished_rides (
                                       id SERIAL PRIMARY KEY,
                                       generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                       finisher_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                       start_time TIMESTAMP NOT NULL,
                                       end_time TIMESTAMP NOT NULL,
                                       duration_minutes INTEGER,
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FINISHED RIDE PARTICIPANTS
CREATE TABLE public.finished_ride_participants (
                                                   finished_ride_id INTEGER NOT NULL REFERENCES public.finished_rides(id) ON DELETE CASCADE,
                                                   rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                                   PRIMARY KEY (finished_ride_id, rider_username)
);

CREATE TABLE public.personal_finished_rides (
                                                id SERIAL PRIMARY KEY,
                                                generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                                rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                                start_time TIMESTAMP NOT NULL,
                                                end_time TIMESTAMP NOT NULL,
                                                duration_minutes INTEGER,
                                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                CONSTRAINT uq_personal_finished_ride UNIQUE (generated_rides_id, rider_username)
);

CREATE TABLE public.ride_status_entries (
                                            id                  SERIAL PRIMARY KEY,
                                            generated_rides_id  VARCHAR(12)  NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                            status              VARCHAR(20)  NOT NULL,
                                            scope               VARCHAR(10)  NOT NULL,
                                            rider_username      VARCHAR(255) REFERENCES public.rider(username) ON DELETE CASCADE,
                                            active              BOOLEAN      NOT NULL DEFAULT TRUE,
                                            changed_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                            note                TEXT
);

CREATE TABLE IF NOT EXISTS email_verification_token (
                                                        id SERIAL PRIMARY KEY,
                                                        email VARCHAR(254) NOT NULL UNIQUE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_time TIMESTAMP NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );


CREATE INDEX idx_email_verification_token_email ON email_verification_token(email);
CREATE INDEX idx_email_verification_token_token ON email_verification_token(token);

CREATE INDEX idx_rse_generated_rides_id  ON public.ride_status_entries(generated_rides_id);
CREATE INDEX idx_rse_rider_username      ON public.ride_status_entries(rider_username);
CREATE INDEX idx_rse_status              ON public.ride_status_entries(status);
CREATE INDEX idx_rse_scope               ON public.ride_status_entries(scope);
CREATE INDEX idx_rse_generated_status    ON public.ride_status_entries(generated_rides_id, status);


CREATE INDEX idx_personal_finished_ride_generated_id ON public.personal_finished_rides(generated_rides_id);
CREATE INDEX idx_personal_finished_ride_rider ON public.personal_finished_rides(rider_username);

-- Create indexes
CREATE INDEX idx_checkpoint_generated_ride ON public.ride_checkpoint_arrivals(generated_rides_id);
CREATE INDEX idx_checkpoint_rider ON public.ride_checkpoint_arrivals(rider_username);
CREATE INDEX idx_checkpoint_type ON public.ride_checkpoint_arrivals(checkpoint_type);

CREATE INDEX idx_finished_ride_generated_id ON public.finished_rides(generated_rides_id);
CREATE INDEX idx_finished_ride_finisher ON public.finished_rides(finisher_username);
CREATE INDEX idx_finished_ride_participants_ride ON public.finished_ride_participants(finished_ride_id);
CREATE INDEX idx_finished_ride_participants_rider ON public.finished_ride_participants(rider_username);

-- Create indexes
CREATE INDEX idx_rider_locations_rider ON public.rider_locations(rider_username);
CREATE INDEX idx_rider_locations_started_ride ON public.rider_locations(started_ride_id);
CREATE INDEX idx_rider_locations_timestamp ON public.rider_locations(timestamp DESC);
CREATE INDEX idx_rider_locations_gist ON public.rider_locations USING GIST(location);

CREATE INDEX idx_participant_location_started_ride ON public.participant_location(started_ride_id);
CREATE INDEX idx_participant_location_rider ON public.participant_location(rider_username);
CREATE INDEX idx_participant_location_last_update ON public.participant_location(last_update DESC);
CREATE INDEX idx_participant_location_gist ON public.participant_location USING GIST(participant_location);
