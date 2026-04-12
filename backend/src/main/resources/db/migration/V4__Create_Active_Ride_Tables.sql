-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 4: Active/Started Rides
-- ════════════════════════════════════════════════════════════════════════════════════════

-- STARTED RIDES (Active ride sessions)
CREATE TABLE public.started_rides (
                                      id SERIAL PRIMARY KEY,
                                      initiator_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                      rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                      start_time TIMESTAMP NOT NULL,
                                      location GEOMETRY(Point, 4326),
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STARTED RIDE PARTICIPANTS (Who's in active ride)
CREATE TABLE public.started_ride_participants (
                                                  started_ride_id INTEGER NOT NULL REFERENCES public.started_rides(id) ON DELETE CASCADE,
                                                  rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                                  PRIMARY KEY (started_ride_id, rider_username)
);

-- Create indexes
CREATE INDEX idx_started_rides_initiator ON public.started_rides(initiator_username);
CREATE INDEX idx_started_rides_rides_id ON public.started_rides(rides_id);
CREATE INDEX idx_started_rides_start_time ON public.started_rides(start_time DESC);
CREATE INDEX idx_started_rides_location_gist ON public.started_rides USING GIST(location);

CREATE INDEX idx_started_ride_participants_ride ON public.started_ride_participants(started_ride_id);
CREATE INDEX idx_started_ride_participants_rider ON public.started_ride_participants(rider_username);