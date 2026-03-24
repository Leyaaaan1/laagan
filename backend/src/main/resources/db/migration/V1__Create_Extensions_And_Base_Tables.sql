-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 1: Extensions & Base Tables
-- ════════════════════════════════════════════════════════════════════════════════════════

-- Ensure public schema exists first
CREATE SCHEMA IF NOT EXISTS public;

-- Create PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- RIDER TYPE (Lookup table)
CREATE TABLE public.rider_type (
                                   rider_type_id SERIAL PRIMARY KEY,
                                   rider_type VARCHAR(255) NOT NULL UNIQUE
);

-- RIDER (Core user table)
CREATE TABLE public.rider (
                              id SERIAL PRIMARY KEY,
                              username VARCHAR(255) NOT NULL UNIQUE,
                              password VARCHAR(255) NOT NULL,
                              enabled BOOLEAN NOT NULL DEFAULT true,
                              rider_type INTEGER REFERENCES public.rider_type(rider_type_id) ON DELETE SET NULL
);

-- PSGC DATA (Geographic reference)
CREATE TABLE public.psgc_data (
                                  psgc_code VARCHAR(12) PRIMARY KEY,
                                  name VARCHAR(255),
                                  correspondence_code VARCHAR(12),
                                  geographic_level VARCHAR(255)
);

-- Seed data: Initialize rider types
INSERT INTO public.rider_type (rider_type_id, rider_type) VALUES
                                                              (1, 'Car'),
                                                              (2, 'Cafe Racers'),
                                                              (3, 'Bicycle'),
                                                              (4, 'Scooter'),
                                                              (5, 'Motorcycle'),
                                                              (6, 'Sidecar')
    ON CONFLICT (rider_type) DO NOTHING;

-- Create indexes
CREATE INDEX idx_rider_username ON public.rider(username);
CREATE INDEX idx_rider_enabled ON public.rider(enabled);