# Standalone Prompts — paste ONE at a time, in order

Each block below is self-contained. Paste only the text inside one fenced
block per turn, let it finish and verify, then move to the next. Do them in
numeric order — later prompts assume earlier ones are already merged.

---

## 1.1 — Persist averageSpeedKph at finish time

```
Backend task. Files: PersonalFinishedRideService.java, FinishedRideService.java,
RideDetailService.java, and the PersonalFinishedRide / FinishedRide entity
classes (locate them in the model package).

Problem: averageSpeedKph is recomputed via RideCalculationUtils.computeAverageSpeedKph()
independently in three places on every read — FinishedRideService.getFinishedRide,
RideDetailService.getRideDetail, PersonalFinishedRideService.getPersonalSummaryDTO —
even though distance and durationMinutes are both already fixed/stored facts by
the time any of these run. There's no single source of truth for this value.

Fix:
1. Add an averageSpeedKph column to the PersonalFinishedRide entity and the
   FinishedRide entity.
2. In PersonalFinishedRideService.createPersonalSummaryOnArrival, compute
   averageSpeedKph once via RideCalculationUtils.computeAverageSpeedKph(ride.getDistance(), durationMinutes)
   and save it on the entity alongside durationMinutes.
3. Find the method that builds and saves FinishedRide on force-finish (likely
   FinishedRideUtility.buildAndSaveFinishedRide, called from
   FinishedRideService.forceFinishRide) and do the same there.
4. Update getFinishedRide, getRideDetail, and getPersonalSummaryDTO to read
   the stored value off the entity instead of calling
   RideCalculationUtils.computeAverageSpeedKph again.

Implement this end to end and show me the diff.
```

---

## 1.2 — Rename `distance` → `distanceMeters` on FinishedRideResponseDTO

```
Backend task. File: FinishedRideResponseDTO.java.

Problem: the `distance` field holds meters (per the existing computeSpeed
comment in this same file) but isn't named for that unit. This is the root
cause of a frontend bug where the value gets displayed labeled "km" without
conversion.

Fix: rename the field, constructor assignment, getter, and setter to
distanceMeters / getDistanceMeters() / setDistanceMeters(). This matches
DetailDTO and PersonalFinishedRideDTO, which already use distanceMeters.
Then search the codebase for every call site that reads getDistance() on a
FinishedRideResponseDTO instance and update them to getDistanceMeters().

Implement this end to end and show me every file you touched.
```

---

## 1.3 — Merge ParticipantSummaryDTO + ParticipantStatisticsDTO

```
Backend task. Files: ParticipantSummaryDTO.java, ParticipantStatisticsDTO.java,
FinishedRideResponseDTO.java (completedParticipants and participantStats
fields), and whichever class currently populates completedParticipants
(search the codebase for it — likely FinishedRideUtility or
FinishedRideService).

Problem: two DTOs describe the same participant with overlapping fields
(checkpointsReached/totalCheckpoints vs checkpointsCompleted/status/arrivalTime).
participantStats has a getter/setter on FinishedRideResponseDTO but is never
populated — dead payload weight.

Fix:
1. Create a new ParticipantProgressDTO with: username, checkpointsReached,
   totalCheckpoints, arrivalTime, status.
2. Replace completedParticipants and participantStats on
   FinishedRideResponseDTO with a single List<ParticipantProgressDTO>
   participantProgress field.
3. Populate checkpointsReached / totalCheckpoints / status server-side in
   whichever class builds this DTO today.
4. Delete ParticipantSummaryDTO.java and ParticipantStatisticsDTO.java, and
   update every reference to them.

Implement this end to end and show me the diff.
```

---

## 1.4 — Remove routeCoordinates from FinishedRideResponseDTO

```
Backend task. Files: FinishedRideResponseDTO.java, FinishedRideService.java
(getFinishedRide method).

Problem: this endpoint serializes a full GeoJSON routeCoordinates string but
nothing on the consuming screen renders a map with it — it's dead payload
weight on this specific response.

Fix: remove the routeCoordinates field, getter, and setter from
FinishedRideResponseDTO, and remove the line in
FinishedRideService.getFinishedRide that sets it
(dto.setRouteCoordinates(...)). Leave routeCoordinates untouched on
DetailDTO — that one is still needed.

Implement this end to end and show me the diff.
```

---

## 1.5 — Retire SnapshotResponseDTO and its endpoint

```
Backend task. File: SnapshotResponseDTO.java, plus its backing controller
endpoint (search the codebase for whatever method returns
SnapshotResponseDTO or backs a "/snapshot" route).

Problem: snapshotUrl is already present on DetailDTO, PersonalFinishedRideDTO,
and FinishedRideResponseDTO. This separate endpoint only exists as a
workaround for a frontend bug and causes an unnecessary extra network round
trip for data the client already has.

Fix: delete SnapshotResponseDTO.java and the controller endpoint that
returns it. Confirm snapshotUrl is reliably populated on all three DTOs
listed above before removing anything (it already is — just verify).

Implement this end to end and show me what you removed.
```

---

## 1.6 — Compose DetailDTO from PersonalFinishedRideDTO instead of duplicating fields

```
Backend task. Files: DetailDTO.java, RideDetailService.java (getRideDetail
method).

Problem: DetailDTO redeclares startTime, endTime, durationMinutes,
averageSpeedKph — fields PersonalFinishedRideDTO already owns — and
getRideDetail recomputes averageSpeedKph from scratch instead of reusing
the logic in PersonalFinishedRideService.

Fix: in RideDetailService.getRideDetail, when personalOpt.isPresent(), call
PersonalFinishedRideService.getPersonalSummaryDTO(generatedRidesId) and pull
startTime, endTime, durationMinutes, averageSpeedKph from that result
instead of re-deriving them inline. Leave buildSpeedSegments as-is — that
logic is unique to DetailDTO.

Implement this end to end and show me the diff.
```

---

## 2.1 — Trim RideDetailHero (remove duplicate stat strip)

```
Frontend task. Files: RideDetailHero.jsx, RideDetailView.jsx.

Problem: distance/duration/avg speed appear in the hero's overlay stat
strip, then again a few components later in RideDetailStats — the same
three numbers rendered twice in one screen.

Fix: remove the OverlayStat component and the heroStatsStrip block from
RideDetailHero.jsx, keeping only rideName, the photo background, and the PR
badge in the hero. In RideDetailView.jsx, remove the now-unused
distanceKm / durationMin / avgSpeedKph props from the <RideDetailHero ... />
call. RideDetailStats remains the only place these numbers are shown.

Implement this end to end and show me the diff.
```

---

## 2.2 — Fix the PR badge rendering unconditionally

```
Frontend task. File: RideDetailView.jsx.

Problem: the viewPrBadgeWrap block ("Your personal record") renders for
every rider regardless of whether they actually have one — hasPersonalRecord
is destructured from rideDetail but never used to gate the JSX.

Fix: wrap the viewPrBadgeWrap block in {hasPersonalRecord && (...)} so it
only shows for riders who actually have a personal record on this ride.

Implement this end to end and show me the diff.
```

---

## 2.3 — Wire up RideDetailHero's unused onUpload prop

```
Frontend task. File: RideDetailHero.jsx (RideDetailView.jsx already passes
onUpload={() => setUploadVisible(true)} correctly — no change needed there).

Problem: onUpload is accepted as a prop but nothing in the hero's JSX calls
it, so tapping the hero photo does nothing.

Fix: wrap the hero content (or add a small camera-icon button in a corner of
the hero) in a TouchableOpacity that calls onUpload, so tapping the hero
opens the media upload sheet.

Implement this end to end and show me the diff.
```

---

## 2.4 — Shared stats component; fix riderType and distance-unit bugs

```
Frontend task. Files: FinishedRideSummary.jsx, RideDetailStats.jsx, and
wherever FinishedRideSummary is rendered (PersonalSummaryView.jsx,
FinishedRideView.jsx).

Problem: FinishedRideSummary reads rideData.riderType, which doesn't exist
on any backend DTO and always renders "—". It also reads rideData.distance
hardcoded with a "km" label, but the field is meters
(distanceMeters as of the backend rename) — this has been silently wrong,
and PersonalFinishedRideDTO never had a plain `distance` field at all, so
the Personal Summary screen's distance stat has likely always shown "—".

Fix: build one shared stats-grid component (reusable across Statistics,
Finished Ride View, and Personal Summary) that takes distanceMeters and
reuses RideDetailStats.jsx's existing fmtDistance / fmtDuration formatters.
Drop the "Type" stat (riderType) entirely. Replace FinishedRideSummary's
internal stats array with calls into this shared component, and update its
two call sites accordingly.

Implement this end to end and show me the diff.
```

---

## 2.5 — Extract a shared snapshot hook; fix the root param-name bug

```
Frontend task. Files: PersonalSummaryView.jsx, FinishedRideView.jsx, plus
whatever screens navigate into these two with a snapshot param (search for
navigation.navigate('PersonalSummaryView', ...) and
navigation.navigate('FinishedRideView', ...) call sites and check the param
key they pass).

Problem: both files duplicate the same fetch-with-fallback useEffect for
loading a ride snapshot, working around the fact that the navigation param
is sometimes sent as snapshotUri and sometimes read as snapshotUrl.

Fix:
1. Standardize on one param name (snapshotUrl) at every navigation call site
   that passes it.
2. Extract a single useRideSnapshot(generatedRidesId, passedUrl) hook and use
   it in both PersonalSummaryView.jsx and FinishedRideView.jsx, replacing
   their duplicated useEffect blocks.
3. Keep the hook's network fetch as a fallback only, for cases where
   finishedRideData hasn't loaded yet — snapshotUrl should usually already
   be present on the main DTO payload.

Implement this end to end and show me the diff.
```

---

## 2.6 — Merge FinishedRideParticipants + FinishedRideCheckpoints; remove client-side enrichParticipants

```
Frontend task. Files: FinishedRideParticipants.jsx, FinishedRideCheckpoints.jsx,
FinishedRideView.jsx.

Note: this depends on backend task 1.3 (ParticipantProgressDTO) already
being merged — confirm participantProgress exists on the
FinishedRideResponseDTO response before starting.

Problem: both components group the same checkpointArrivals data differently
(one by rider, one by checkpoint), and FinishedRideView's enrichParticipants
function computes completion percentage client-side from raw arrivals —
duplicating logic that the backend now computes server-side.

Fix: build one "rider progress" component fed directly by the
participantProgress field from the API response, with a toggle for by-rider
vs by-checkpoint grouping if you want to preserve both views. Delete
enrichParticipants and the manual reached/totalCheckpoints math from
FinishedRideView.jsx, and update the render call site to use the new
component.

Implement this end to end and show me the diff.
```

---

## 2.7 — Remove the isPersonalSummary branch from FinishedRideView

```
Frontend task. File: FinishedRideView.jsx, plus any screen that navigates
into it with isPersonalSummary: true (search the codebase for this).

Problem: when isPersonalSummary is true, this file re-implements what
PersonalSummaryView.jsx already does — two implementations of the same
screen.

Fix: delete the isPersonalSummary prop and every branch keyed off it
(the getPersonalSummary import/branch inside load(), the headerTitle
ternary, and the {!isPersonalSummary && <FinishedRideParticipants .../>}
conditional). Find every navigation.navigate('FinishedRideView', {
isPersonalSummary: true, ... }) call site and repoint it to
navigation.navigate('PersonalSummaryView', ...) instead.

Implement this end to end and show me the diff.
```

---

## 2.8 — Remove unused routeCoordinates destructure

```
Frontend task. File: FinishedRideView.jsx.

Note: do this after backend task 1.4 is merged (routeCoordinates removed
from FinishedRideResponseDTO).

Problem: routeCoordinates is destructured from finishedRideData but never
used anywhere in this file.

Fix: delete the unused destructured variable.

Implement this end to end and show me the diff.
```

---

## 2.9 — Simplify navigation: one tier, not two parallel buttons

```
Frontend task. Files: FinishedRideView.jsx (localStyles.headerActions block),
PersonalSummaryView.jsx (header headerActionButton).

Problem: Finished Ride View currently shows two equally-weighted header
buttons (Statistics via bar-chart icon, Personal Summary via user icon),
flattening what should feel like a sequence — group view, then my recap,
then my deep dive — into two unrelated sibling destinations.

Fix: in FinishedRideView.jsx, remove the bar-chart button entirely and keep
only the "My Summary" button (navigating to PersonalSummaryView). Leave
PersonalSummaryView.jsx's existing bar-chart button to RideDetailView
in place — it becomes the sole entry point into Statistics. End result:
Finished Ride View → Personal Summary → Statistics.

Implement this end to end and show me the diff.
```
