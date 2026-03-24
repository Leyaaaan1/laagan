-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 2: Rider Profile & Authentication
-- ════════════════════════════════════════════════════════════════════════════════════════

-- RIDER PROFILE (1-to-1 with rider)
CREATE TABLE public.rider_profile (
                                      profile_id SERIAL PRIMARY KEY,
                                      username VARCHAR(255) NOT NULL UNIQUE REFERENCES public.rider(username) ON DELETE CASCADE,
                                      display_name VARCHAR(100),
                                      bio VARCHAR(500),
                                      profile_picture_url VARCHAR(500),
                                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RIDER PROFILE TYPES (Many-to-many)
CREATE TABLE public.rider_profile_types (
                                            profile_id INTEGER NOT NULL REFERENCES public.rider_profile(profile_id) ON DELETE CASCADE,
                                            rider_type_id INTEGER NOT NULL REFERENCES public.rider_type(rider_type_id) ON DELETE CASCADE,
                                            PRIMARY KEY (profile_id, rider_type_id)
);

-- FACEBOOK ACCOUNT (Social login)
CREATE TABLE public.facebook_account (
                                         id SERIAL PRIMARY KEY,
                                         username VARCHAR(255) NOT NULL UNIQUE,
                                         password VARCHAR(255) NOT NULL,
                                         profile_picture_url VARCHAR(500),
                                         rider_id INTEGER UNIQUE REFERENCES public.rider(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_profile_username ON public.rider_profile(username);
CREATE INDEX idx_profile_created_at ON public.rider_profile(created_at);
CREATE INDEX idx_facebook_username ON public.facebook_account(username);
CREATE INDEX idx_facebook_rider_id ON public.facebook_account(rider_id);