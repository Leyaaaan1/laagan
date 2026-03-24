-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 5: Real-time Location Tracking
-- ════════════════════════════════════════════════════════════════════════════════════════

-- RIDER LOCATIONS (Real-time tracking during ride)
CREATE TABLE public.rider_locations (
                                        id SERIAL PRIMARY KEY,
                                        rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                        started_ride_id INTEGER NOT NULL REFERENCES public.started_rides(id) ON DELETE CASCADE,
                                        location_name VARCHAR(255) NOT NULL,
                                        location GEOMETRY(Point, 4326) NOT NULL,
                                        distance_meters DOUBLE PRECISION,
                                        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PARTICIPANT LOCATION (Track all participants)
CREATE TABLE public.participant_location (
                                             participant_location_id SERIAL PRIMARY KEY,
                                             started_ride_id INTEGER NOT NULL REFERENCES public.started_rides(id) ON DELETE CASCADE,
                                             rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                             participant_location GEOMETRY(Point, 4326),
                                             last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_rider_locations_rider ON public.rider_locations(rider_username);
CREATE INDEX idx_rider_locations_started_ride ON public.rider_locations(started_ride_id);
CREATE INDEX idx_rider_locations_timestamp ON public.rider_locations(timestamp DESC);
CREATE INDEX idx_rider_locations_gist ON public.rider_locations USING GIST(location);

CREATE INDEX idx_participant_location_ride_rider ON public.participant_location(started_ride_id, rider_username);
CREATE INDEX idx_participant_location_rider ON public.participant_location(rider_username);
CREATE INDEX idx_participant_location_last_update ON public.participant_location(last_update DESC);
CREATE INDEX idx_participant_location_gist ON public.participant_location USING GIST(participant_location);