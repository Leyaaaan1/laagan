-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 6: Join/Invite Requests
-- ════════════════════════════════════════════════════════════════════════════════════════

-- INVITE REQUESTS (Invitations from ride creator)
CREATE TABLE public.invite_requests (
                                        invite_id SERIAL PRIMARY KEY,
                                        invite_token VARCHAR(36) NOT NULL UNIQUE,
                                        generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                        username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                        invite_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                                        qr TEXT,
                                        invite_link VARCHAR(500),
                                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        expires_at TIMESTAMP,
                                        qr_code_base64 TEXT
);

-- JOIN REQUESTS (Requests to join ride)
CREATE TABLE public.join_requests (
                                      join_id SERIAL PRIMARY KEY,
                                      generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                      username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                      invite_token VARCHAR(36) NOT NULL,
                                      join_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                                      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RIDE JOIN REQUESTS (Alt join method)
CREATE TABLE public.ride_join_requests (
                                           id SERIAL PRIMARY KEY,
                                           generated_rides_id VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
                                           rider_id INTEGER NOT NULL REFERENCES public.rider(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_invite_token ON public.invite_requests(invite_token);
CREATE INDEX idx_invite_ride_id ON public.invite_requests(generated_rides_id);
CREATE INDEX idx_invite_username ON public.invite_requests(username);
CREATE INDEX idx_invite_status ON public.invite_requests(invite_status);
CREATE INDEX idx_invite_expires_at ON public.invite_requests(expires_at) WHERE invite_status = 'PENDING';

CREATE INDEX idx_join_ride_requester ON public.join_requests(generated_rides_id, username);
CREATE INDEX idx_join_status ON public.join_requests(join_status);
CREATE INDEX idx_join_requested_at ON public.join_requests(requested_at DESC);

CREATE INDEX idx_ride_join_requests_ride ON public.ride_join_requests(generated_rides_id);
CREATE INDEX idx_ride_join_requests_rider ON public.ride_join_requests(rider_id);