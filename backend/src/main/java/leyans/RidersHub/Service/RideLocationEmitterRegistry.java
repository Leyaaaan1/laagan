package leyans.RidersHub.Service;


import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Holds all active SSE emitters grouped by startedRideId.
 * Thread-safe — multiple threads may subscribe/unsubscribe concurrently.
 */
@Component
public class RideLocationEmitterRegistry {

    // rideId → list of live emitters
    private final Map<Integer, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Integer rideId) {
        SseEmitter emitter = new SseEmitter(1_800_000L);

        emitters.computeIfAbsent(rideId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> remove(rideId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("ping").data("connected"));
        } catch (Exception e) {
            cleanup.run();
        }

        return emitter;
    }


    public void broadcast(Integer rideId, Object payload) {
        List<SseEmitter> rideEmitters = emitters.getOrDefault(rideId, Collections.emptyList());
        List<SseEmitter> dead = new ArrayList<>();

        for (SseEmitter emitter : rideEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("location-update")
                        .data(payload));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        // Prune dead emitters
        rideEmitters.removeAll(dead);
    }

    /**
     * Keeps idle connections alive through proxies/load balancers (e.g. Render's
     * edge) that drop connections with no traffic for a while. Runs independently
     * of location updates, so a stalled ride doesn't lose its stream.
     */
    @Scheduled(fixedRate = 20_000)
    public void heartbeat() {
        for (Map.Entry<Integer, List<SseEmitter>> entry : emitters.entrySet()) {
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name("ping").comment("keepalive"));
                } catch (Exception e) {
                    dead.add(emitter);
                }
            }
            entry.getValue().removeAll(dead);
        }
    }

    private void remove(Integer rideId, SseEmitter emitter) {
        emitters.computeIfPresent(rideId, (id, list) -> {
            list.remove(emitter);
            return list.isEmpty() ? null : list; // drop the map entry once empty
        });
    }

    public void closeAll(Integer rideId) {
        List<SseEmitter> list = emitters.remove(rideId);
        if (list != null) {
            for (SseEmitter emitter : list) {
                try { emitter.complete(); } catch (Exception ignored) {}
            }
        }
    }
}