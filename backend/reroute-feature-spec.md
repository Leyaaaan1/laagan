# Per-Rider Reroute Feature — Simple Step-by-Step Plan

This explains, in plain language, what needs to be built and where each piece goes.
No code yet — this is the blueprint to build from.

---

## The big picture (one sentence)

Every time a rider sends their GPS location, we quietly check "are they still near
the route?" — and only if they've drifted far away (and stayed drifted), we ask
GraphHopper for a new path *just for that rider*, without touching the route
everyone else sees.

---

## Step-by-step flow (what happens, in order)

**Step 1 — Rider sends GPS (already works, no change)**
The phone app sends latitude/longitude to the backend, same as today.

**Step 2 — Save the location (already works, no change)**
The backend saves it, same as today (`RideLocationService.updateLocation`).

**Step 3 — NEW: Measure distance from the route**
Compare the rider's point to the saved route line (the path with all the stops).
Output: a number in meters — "this rider is 180m from the path."

**Step 4 — NEW: Decide if that's too far**
If the distance is small (under ~120m) → stop here, do nothing else.
If the distance is large → continue to Step 5.

**Step 5 — NEW: Make sure it's not just a GPS glitch**
Only continue if this is the **2nd time in a row** this rider has been measured
as "too far." (One bad GPS reading shouldn't trigger anything.)

**Step 6 — NEW: Make sure we haven't just rerouted them recently**
If we rerouted this rider less than 90 seconds ago, stop here and wait.

**Step 7 — NEW: Ask GraphHopper for a new route**
Send: rider's current location + their remaining stops.
Get back: a new path, same way you already get the original route.

**Step 8 — NEW: Save the new path — for this rider only**
Store it somewhere temporary (Redis), tagged with this rider's name and this ride.
The original shared route in the database is NOT changed.

**Step 9 — NEW: Show the rider their new path**
Their app displays the updated route. Other riders see nothing different.

---

## The 3 new "modules" (think of each as one small job)

### Module 1 — "How far is this point from the route?"
**Job:** Given a GPS point and the route's list of coordinates, return the distance
in meters to the closest part of the route line.
**Lives in:** a new file, `RouteDeviationCalculator.java`
**Uses:** the route data you already save (`Rides.routeCoordinates`), and your
existing distance-math helper (`RideCalculationUtils.haversineMeters`).

### Module 2 — "Should we reroute this rider right now?"
**Job:** Keeps track of (a) how many times in a row this rider has been "too far,"
and (b) when we last rerouted them. Decides yes/no.
**Lives in:** a new file, `RouteDeviationService.java`
**Uses:** Redis (to remember the streak count + last-reroute time between requests).

### Module 3 — "Get the new route and save it for this rider"
**Job:** Calls the existing GraphHopper-fetching code (no changes needed there),
then stores the result in Redis under this rider's name.
**Lives in:** inside the same `RouteDeviationService.java` (it's the second half of
Module 2's job, once the answer is "yes, reroute now").
**Uses:** your existing `RouteService.getRouteDirections(...)` — completely unchanged.

---

## Files you need to ADD

| New file | What it does | Why it's separate |
|---|---|---|
| `RouteDeviationCalculator.java` | Math only: point-to-route-line distance | Keeps the geometry math isolated and testable on its own, away from business logic |
| `RouteDeviationService.java` | Decides "reroute or not," talks to Redis, calls existing route service when needed | This is the main new "brain" of the feature |
| `RerouteResultDTO.java` | A small data holder: "did we reroute? here's the new path if yes" | Lets the existing controller hand back the result cleanly to the frontend |

## Files you need to EDIT (small additions only, not rewrites)

| Existing file | What changes |
|---|---|
| `RideLocationService.java` | After saving the location (inside `updateLocation`), add one call to the new `RouteDeviationService` |
| `LocationUpdateController.java` | Include the reroute result (if any) in the response sent back to the rider's app |
| `application.properties` | Add 3-4 small config lines (see below) |
| `StartRideService.java` (the `leaveRide` part) | Add one line to clear this rider's leftover Redis reroute data when they leave |

## Nothing else needs to change
- No new database table.
- No migration.
- No changes to `RouteService.java`, `RedisConfig.java`, `GraphHopperQuotaGuard.java`,
  or anything GraphHopper-related — the reroute feature reuses all of that exactly
  as it already works today.

---

## Config lines to add to `application.properties`

```
reroute.deviation-threshold-meters=120
reroute.confirmation-streak=2
reroute.cooldown-seconds=90
reroute.redis-state-ttl-hours=6
```

(These are just numbers you can tune later — they're not locked in.)

---

## One worked example (so it's concrete)

Rider "Juan" is on a ride. His planned route passes through a street 5 meters from
where he currently is — all good, no action.

Juan misses a turn. Next GPS ping: he's now 200m from the route.
→ That's over the 120m threshold, but it's only the *1st* time → nothing happens yet,
just remember "1 strike."

10 seconds later, next GPS ping: he's now 250m from the route.
→ Still over 120m, and this is the *2nd time in a row* → trigger reroute.
→ Check: was he rerouted in the last 90 seconds? No → go ahead.
→ Call GraphHopper: "from Juan's current spot, to his remaining stops."
→ Save the new path under `reroute:active:{rideId}:juan` in Redis.
→ Juan's app shows the new path. Everyone else's app is unaffected.

Juan keeps driving normally on his new path → distance stays under 120m → no more
reroutes happen, the cooldown/streak logic just stays quiet.
