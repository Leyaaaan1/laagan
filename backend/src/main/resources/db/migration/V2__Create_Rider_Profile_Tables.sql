
-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 2: Rider Profile & Authentication
-- ════════════════════════════════════════════════════════════════════════════════════════

-- RIDER RIDER TYPES (Many-to-many junction table)
CREATE TABLE public.rider_rider_types (
                                          rider_id INTEGER NOT NULL REFERENCES public.rider(id) ON DELETE CASCADE,
                                          rider_type_id INTEGER NOT NULL REFERENCES public.rider_type(rider_type_id) ON DELETE CASCADE,
                                          PRIMARY KEY (rider_id, rider_type_id)
);

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
                                         id                  SERIAL PRIMARY KEY,
                                         facebook_id         VARCHAR(255) UNIQUE,      -- stable FB user ID, primary lookup key
                                         email               VARCHAR(255),             -- stored for reference only, not used for auth
                                         profile_picture_url VARCHAR(500),
                                         rider_id            INTEGER UNIQUE REFERENCES public.rider(id) ON DELETE CASCADE
);

-- Create indexes
-- ── 3. Recreate indexes cleanly ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profile_created_at  ON public.rider_profile(created_at);

CREATE INDEX IF NOT EXISTS idx_facebook_facebook_id ON public.facebook_account(facebook_id);
CREATE INDEX IF NOT EXISTS idx_facebook_rider_id    ON public.facebook_account(rider_id);

CREATE INDEX IF NOT EXISTS idx_rider_types          ON public.rider_rider_types(rider_id);