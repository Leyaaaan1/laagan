CREATE TABLE IF NOT EXISTS public.finished_ride_photos (
                                                           id                  SERIAL PRIMARY KEY,
                                                           generated_rides_id  VARCHAR(12) NOT NULL REFERENCES public.event_rides(generated_rides_id) ON DELETE CASCADE,
    image_url           VARCHAR(512) NOT NULL,
    caption             VARCHAR(255),
    uploaded_by         VARCHAR(255) NOT NULL REFERENCES public.rider(username) ON DELETE CASCADE,
    uploaded_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_frp_ride_id      ON public.finished_ride_photos(generated_rides_id);
CREATE INDEX IF NOT EXISTS idx_frp_uploaded_by  ON public.finished_ride_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_frp_uploaded_at  ON public.finished_ride_photos(uploaded_at DESC);