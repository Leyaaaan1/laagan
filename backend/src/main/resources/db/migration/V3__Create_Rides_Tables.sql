-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 3: Event Rides (Main feature)
-- ════════════════════════════════════════════════════════════════════════════════════════

-- EVENT RIDES (Planned rides)
CREATE TABLE public.event_rides (
                                    rides_id SERIAL PRIMARY KEY,
                                    generated_rides_id VARCHAR(12) NOT NULL UNIQUE,
                                    location_name VARCHAR(255) NOT NULL,
                                    rides_name VARCHAR(255) NOT NULL,
                                    description TEXT,
                                    username VARCHAR(255) REFERENCES public.rider(username) ON DELETE SET NULL,
                                    rider_type INTEGER NOT NULL REFERENCES public.rider_type(rider_type_id) ON DELETE RESTRICT,
                                    distance INTEGER,
                                    starting_location GEOMETRY(Point, 4326),
                                    ending_location GEOMETRY(Point, 4326),
                                    starting_point_name VARCHAR(255) NOT NULL,
                                    ending_point_name VARCHAR(255) NOT NULL,
                                    ride_date TIMESTAMP NOT NULL,
                                    location GEOMETRY(Point, 4326),
                                    map_image_url VARCHAR(500),

                                    route_coordinates TEXT,
                                    active BOOLEAN NOT NULL DEFAULT true,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RIDE STOP POINTS (Stops along the route)
CREATE TABLE public.ride_stop_points (
                                         ride_id INTEGER NOT NULL REFERENCES public.event_rides(rides_id) ON DELETE CASCADE,
                                         stop_name VARCHAR(255),
                                         stop_location GEOMETRY(Point, 4326)
);

-- RIDE PARTICIPANTS (Who's joining)
CREATE TABLE public.ride_participants (
                                          ride_id INTEGER NOT NULL REFERENCES public.event_rides(rides_id) ON DELETE CASCADE,
                                          rider_username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                          PRIMARY KEY (ride_id, rider_username)
);

-- Create indexes
CREATE INDEX idx_rides_username_date ON public.event_rides(username, ride_date DESC);
CREATE INDEX idx_rides_date ON public.event_rides(ride_date DESC);
CREATE INDEX idx_rides_active ON public.event_rides(active) WHERE active = true;
CREATE INDEX idx_rides_username_date_active ON public.event_rides(username, ride_date DESC, active);
CREATE INDEX idx_rides_rider_type ON public.event_rides(rider_type);
CREATE INDEX idx_generated_rides_id ON public.event_rides(generated_rides_id);
CREATE INDEX idx_rides_starting_location_gist ON public.event_rides USING GIST(starting_location);
CREATE INDEX idx_rides_ending_location_gist ON public.event_rides USING GIST(ending_location);
CREATE INDEX idx_rides_location_gist ON public.event_rides USING GIST(location);

CREATE INDEX idx_stop_points_ride_id ON public.ride_stop_points(ride_id);
CREATE INDEX idx_stop_points_location_gist ON public.ride_stop_points USING GIST(stop_location);

CREATE INDEX idx_ride_participants_ride ON public.ride_participants(ride_id);
CREATE INDEX idx_ride_participants_rider ON public.ride_participants(rider_username);