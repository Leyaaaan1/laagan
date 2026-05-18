
-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 2: Rider Profile, Authentication & Social Accounts
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

-- ─────────────────────────────────────────────────────────────────────────────────────────
-- REFRESH TOKENS (JWT token rotation - stateless auth stored)
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.refresh_tokens (
                                       id BIGSERIAL PRIMARY KEY,
                                       token_hash VARCHAR(255) NOT NULL UNIQUE,
                                       username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
                                       expires_at TIMESTAMP NOT NULL,
                                       revoked BOOLEAN NOT NULL DEFAULT false,
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────────────────
-- FACEBOOK ACCOUNT (Social login - CASCADE DELETE on rider deletion)
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.facebook_account (
                                         id SERIAL PRIMARY KEY,
                                         facebook_id VARCHAR(255) NOT NULL UNIQUE,
                                         email VARCHAR(255),
                                         profile_picture_url VARCHAR(500),
                                         rider_id INTEGER NOT NULL UNIQUE REFERENCES public.rider(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────────────────
-- GOOGLE ACCOUNT (Social login - CASCADE DELETE on rider deletion)
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.google_account (
                                       id SERIAL PRIMARY KEY,
                                       google_id VARCHAR(255) NOT NULL UNIQUE,
                                       email VARCHAR(255),
                                       profile_picture_url VARCHAR(500),
                                       rider_id INTEGER NOT NULL UNIQUE REFERENCES public.rider(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_created_at ON public.rider_profile(created_at);
CREATE INDEX IF NOT EXISTS idx_facebook_facebook_id ON public.facebook_account(facebook_id);
CREATE INDEX IF NOT EXISTS idx_facebook_rider_id ON public.facebook_account(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_types ON public.rider_rider_types(rider_id);
CREATE INDEX IF NOT EXISTS idx_google_google_id ON public.google_account(google_id);
CREATE INDEX IF NOT EXISTS idx_google_rider_id ON public.google_account(rider_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON public.refresh_tokens(username);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);