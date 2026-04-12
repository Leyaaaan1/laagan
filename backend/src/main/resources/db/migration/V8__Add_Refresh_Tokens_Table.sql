-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 8: Add Refresh Token Management Table
-- ════════════════════════════════════════════════════════════════════════════════════════

-- Create refresh tokens table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
                                                     id BIGSERIAL PRIMARY KEY,
                                                     username VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
    );

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON public.refresh_tokens(username);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);

-- Add comments
COMMENT ON TABLE public.refresh_tokens IS 'Stores hashed refresh tokens for JWT token rotation and logout functionality';
COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'SHA-256 hash of the actual token (never store raw tokens)';
COMMENT ON COLUMN public.refresh_tokens.revoked IS 'Marks token as revoked/blacklisted on logout or password change';
COMMENT ON COLUMN public.refresh_tokens.expires_at IS 'Token expiration time (typically 7 days from creation)';