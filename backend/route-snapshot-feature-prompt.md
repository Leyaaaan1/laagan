# Feature Request: Auto-Captured Route Snapshot for Finished Rides

## Project context
Laagan — a motorcycle/group-ride app. Backend: Java/Spring Boot + JPA, PostgreSQL, JTS geometry types. Frontend: React Native, live maps rendered via Leaflet inside a WebView (HTML/JS string bundles assembled in JS, injected via `injectJavaScript`/`postMessage`).

## Goal
The moment a rider personally finishes a ride, automatically capture a **clean static image** of their route — polygon/path plus start, stop, and ending markers **only** (no live GPS dot, no other riders' markers, no compass UI) — upload it through the existing photo pipeline, and display it as a static `<Image>` inside the rider's personal summary screen, replacing the live interactive `RouteMapView` there. Fall back to the live map if no snapshot exists yet.

## Decisions already made (do not re-litigate these — just implement)
- **Personal only, no group.** This feature applies exclusively to the rider's own personal finish (`PersonalFinishedRide`). The group-level finish flow (`FinishedRide`, `FinishedRideService`, `FinishedRideUtility`, `FinishedRideView.jsx`) is **out of scope** — do not add snapshot fields or logic there.
- **Exactly one photo per ride, per rider.** The snapshot is a single canonical image — not a list/gallery. Storage is a single field (e.g. `snapshotUrl`), not a collection. Capture/upload must be idempotent: if a snapshot already exists for this rider's personal finish, don't recapture or create a second one.
- **Capture trigger:** the rider's own `ENDING` checkpoint arrival (personal finish), not the group finish.
- **Target screen for the swap:** `PersonalSummaryView.jsx` only. `FinishedRideView.jsx` and `RideDetailView.jsx` are explicitly **out of scope** for this feature.
- **Backend storage:** add a dedicated single snapshot field/column on the personal-finish side rather than overloading the existing generic "first uploaded photo" pattern (that pattern has its own pre-existing quirks — ignore those, out of scope here).
- Do not change any existing live-map logic/behavior beyond what's strictly needed for this feature.

## Confirmed relevant files & roles

### Frontend — live map WebView bundle (reuse unmodified)
- `scripts/mapInitScript.js` — `initMap()`, `getMap()`, `showError()`
- `scripts/routeDisplayScript.js` — `displayRoute()` (GeoJSON or coordinate route). Note: its camera logic (`setView` centered on start) is built for live tracking — for a snapshot you need to override the camera afterward with a `fitBounds()` over the full route + markers.
- `scripts/markerScript.js` — `addRouteMarkers()` — already clean (start/stop/end only, no GPS). Reuse unmodified.
- Explicitly **excluded** from the snapshot bundle: `scripts/userLocationScript.js`, `scripts/riderMarkersScript.js`, `scripts/compassScript.js`, `scripts/mainLoaderScript.js` — these are exactly the live-location/UI pieces being removed.
- `RouteMapHTML.jsx` / `RouteMapScript.jsx` — pattern reference for how the HTML+JS bundle is assembled (don't reuse directly, build a parallel minimal version).
- `RouteMapView.jsx` / `RouteMapLogic.jsx` — pattern reference for the WebView ref + `injectJavaScript` + `onMessage` bridge (don't reuse directly).

### Frontend — screen currently rendering the live map (in scope)
- `PersonalSummaryView.jsx` — fetches via `services/startService.js` → `getPersonalSummary`. Renders `<RouteMapView>` in a fixed 200px wrapper when start coordinate is valid. This is where the live map gets swapped for the static snapshot `<Image>`.
- `finishedRideService.jsx` — has `uploadPhoto(generatedRidesId, file, caption)` hitting `POST /view/{id}/photo` — reuse this for the upload step (or a new dedicated endpoint if the backend adds one for snapshots specifically).

### Backend — confirmed personal-finish chain (in scope)
- `CheckPointUtility.autoMarkCheckpoints()` — records the `ENDING` checkpoint arrival for a rider, then calls `PersonalFinishedRideService.createPersonalSummaryOnArrival()` and `rideStatusService.markRiderFinished()`. **This is the server-side moment a rider "finishes" — the trigger point for this feature.**
- `PersonalFinishedRideService.java` — `createPersonalSummaryOnArrival()` persists `PersonalFinishedRide`; `getPersonalSummaryDTO()` builds `PersonalFinishedRideDTO` (currently has no photo/snapshot field at all — needs one, single value, not a list).

### Out of scope (do not touch)
- `FinishedRideService.java`, `FinishedRideUtility.java`, `FinishedRideResponseDTO.java`, `FinishedRideView.jsx` — group-level finish flow.
- `RideDetailService.java`, `DetailDTO.java`, `RideDetailView.jsx` — separate detail screen.

## New files to create (frontend)
1. `scripts/snapshotLoaderScript.js` — minimal WebView-side loader: `initMap()` → `displayRoute()` → `addRouteMarkers()` → `fitBounds()` over combined route+marker layers → `postMessage({type:'snapshotReady'})` once tiles settle.
2. `SnapshotMapHTML.jsx` — assembles only `mapInitScript + routeDisplayScript + markerScript + snapshotLoaderScript`; adds inline CSS to hide the zoom control and attribution corner; no compass markup at all.
3. `RouteSnapshotMapView.jsx` — stripped-down WebView wrapper component exposing a container ref (for `react-native-view-shot`'s `captureRef`) and an `onSnapshotReady` callback. Mount with `collapsable={false}` on the container View (required on Android for view-shot to see it).
4. `captureRideSnapshot.js` — utility: once `onSnapshotReady` fires, call `captureRef()` from `react-native-view-shot`, get a local file URI, then upload via `finishedRideService.uploadPhoto()` (or new snapshot-specific call). Must check first whether a snapshot already exists for this rider/ride before capturing again.

## Changed pieces needed (backend) — personal side only
- Add a single `snapshotUrl` field to whatever entity backs `PersonalFinishedRide`, and expose it on `PersonalFinishedRideDTO`.
- Add (or extend) the upload endpoint so the auto-captured snapshot is stored/retrieved as this one dedicated field — not appended to any generic photo list.
- Guard against duplicate capture: if `snapshotUrl` is already set for this `PersonalFinishedRide`, the upload step should be a no-op (or explicitly reject/replace, your call — but only one should ever exist).

## Files to request/attach before implementing
If you're picking this up fresh, ask for these before writing code — they weren't available when this spec was written:
- The live ride-tracking screen that detects a rider has personally finished and navigates into `PersonalSummaryView.jsx` (this is the actual client-side capture trigger point).
- `services/startService.js` (owns `getPersonalSummary`, used by `PersonalSummaryView.jsx`).
- `PersonalFinishedRideDTO.java` (full source, to add the single snapshot field).
- The `PersonalFinishedRide` entity (or wherever it's persisted) + its repository, and whichever controller exposes the personal-summary endpoint and photo upload.
- Confirm `react-native-view-shot` is installed (`package.json`).

## Recommended implementation order
1. Build `snapshotLoaderScript.js` + `SnapshotMapHTML.jsx` + `RouteSnapshotMapView.jsx` (fully self-contained, no missing dependencies).
2. Build `captureRideSnapshot.js` and wire it to fire once the live-ride screen detects the rider has personally finished — including the "already captured" guard.
3. Add the backend `snapshotUrl` field on the personal-finish side and persist the uploaded URL.
4. Swap `PersonalSummaryView.jsx`'s `<RouteMapView>` for a conditional `<Image>` (falling back to the live map) once `snapshotUrl` is present.
