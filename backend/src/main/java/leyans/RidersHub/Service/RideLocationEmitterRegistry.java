package leyans.RidersHub.Service;


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
        // 5-minute timeout — client reconnects automatically on timeout
        SseEmitter emitter = new SseEmitter(300_000L);

        emitters.computeIfAbsent(rideId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> remove(rideId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

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

    private void remove(Integer rideId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(rideId);
        if (list != null) list.remove(emitter);
    }
}