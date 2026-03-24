-- ════════════════════════════════════════════════════════════════════════════════════════
-- RidersHub - Phase 7: Additional Performance Indexes
-- ════════════════════════════════════════════════════════════════════════════════════════

-- PSGC DATA INDEXES
CREATE INDEX idx_psgc_geographic_level ON public.psgc_data(geographic_level);
CREATE INDEX idx_psgc_name_lower ON public.psgc_data(LOWER(name));

-- Add any additional constraints or unique constraints if needed
ALTER TABLE public.event_rides ADD CONSTRAINT UKiipa6xdjyyaycmcgof6yxac6u UNIQUE (generated_rides_id);
ALTER TABLE public.invite_requests ADD CONSTRAINT UKevyy7euviao5a0pib9yomgq44 UNIQUE (invite_token);
ALTER TABLE public.rider ADD CONSTRAINT UKt3dhk3f5nufsbsloqx0njlo4q UNIQUE (username);