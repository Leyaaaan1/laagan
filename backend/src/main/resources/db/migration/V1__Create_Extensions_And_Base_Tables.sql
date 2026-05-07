
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
                                   rider_type    VARCHAR(255) NOT NULL UNIQUE
);

-- RIDER (Core user table)
CREATE TABLE public.rider (
                              id         SERIAL PRIMARY KEY,
                              username   VARCHAR(255) NOT NULL UNIQUE,
                              password   VARCHAR(255) NOT NULL,
                              enabled    BOOLEAN NOT NULL DEFAULT true,
                              about      VARCHAR(500),
                              rider_type INTEGER REFERENCES public.rider_type(rider_type_id) ON DELETE SET NULL
);

-- PSGC DATA (Geographic reference)
CREATE TABLE public.psgc_data (
                                  psgc_code           VARCHAR(12) PRIMARY KEY,
                                  name                VARCHAR(255),
                                  correspondence_code VARCHAR(12),
                                  geographic_level    VARCHAR(255)
);

-- ════════════════════════════════════════════════════════════════════════════════════════
-- SEED: Philippine popular motorcycle models
-- ════════════════════════════════════════════════════════════════════════════════════════

INSERT INTO public.rider_type (rider_type_id, rider_type) VALUES
                                                              -- Honda
                                                              (1,  'ADV 160'),
                                                              (2,  'Beat'),
                                                              (3,  'Beat Street'),
                                                              (4,  'CB150R'),
                                                              (5,  'CB400'),
                                                              (6,  'CB500F'),
                                                              (7,  'CBR150R'),
                                                              (8,  'CBR300R'),
                                                              (9,  'CBR600RR'),
                                                              (10, 'Click 125i'),
                                                              (11, 'Click 160'),
                                                              (12, 'CRF150L'),
                                                              (13, 'CRF300L'),
                                                              (14, 'Forza 350'),
                                                              (15, 'PCX 160'),
                                                              (16, 'RS150R'),
                                                              (17, 'Sonic 150R'),
                                                              (18, 'Tmx 125 Alpha'),
                                                              (19, 'Tmx Supremo'),
                                                              (20, 'Wave 110'),
                                                              (21, 'XR150L'),

                                                              -- Yamaha
                                                              (22, 'Aerox 155'),
                                                              (23, 'FZ 150i'),
                                                              (24, 'FZ-S V3'),
                                                              (25, 'Mio Gravis'),
                                                              (26, 'Mio i 125'),
                                                              (27, 'Mio M3'),
                                                              (28, 'Mio Soul i 125'),
                                                              (29, 'MT-03'),
                                                              (30, 'MT-15'),
                                                              (31, 'NMAX 155'),
                                                              (32, 'R3'),
                                                              (33, 'R15 V4'),
                                                              (34, 'Sniper 150 MXi'),
                                                              (35, 'Sniper 155R'),
                                                              (36, 'Vixion R'),
                                                              (37, 'XSR 155'),
                                                              (38, 'Y16ZR'),

                                                              -- Suzuki
                                                              (39, 'Address 115'),
                                                              (40, 'Burgman Street 125'),
                                                              (41, 'GSX-R150'),
                                                              (42, 'GSX-S150'),
                                                              (43, 'Raider J 115 Fi'),
                                                              (44, 'Raider R150 Fi'),
                                                              (45, 'Skydrive Sport 125'),
                                                              (46, 'Smash 115'),
                                                              (47, 'V-Strom 650'),

                                                              -- Kawasaki
                                                              (48, 'Barako 175'),
                                                              (49, 'CT125'),
                                                              (50, 'KLX 150'),
                                                              (51, 'KLX 230'),
                                                              (52, 'Ninja 400'),
                                                              (53, 'Ninja 650'),
                                                              (54, 'Ninja ZX-6R'),
                                                              (55, 'Rouser NS160'),
                                                              (56, 'Rouser NS200'),
                                                              (57, 'W175'),
                                                              (58, 'Z400'),
                                                              (59, 'Z650'),

                                                              -- Custom
                                                              (60, 'Other')

    ON CONFLICT (rider_type) DO NOTHING;

-- Create indexes
CREATE INDEX idx_rider_username ON public.rider(username);
CREATE INDEX idx_rider_enabled  ON public.rider(enabled);