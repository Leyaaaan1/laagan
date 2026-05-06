# RidersHub Frontend Audit & Fix Guide
**React Native — Portfolio Deployment**
Audit Date: May 2026

---

## Overall Grade: B+ (80/100)

The frontend is architecturally solid. AuthContext is well-designed with in-memory access tokens, Keychain for refresh tokens, and a refresh queue that prevents concurrent rotation bugs. The polling system, route caching, and error message centralization are all production-quality patterns. The issues below are targeted and fixable without any architectural changes.

---

## Finding Summary

| Severity | Count |
|---|---|
| 🔴 HIGH | 3 |
| 🟡 MEDIUM | 5 |
| 🟢 LOW | 4 |
| ✅ POSITIVE | 5 |

---

## 🔴 HIGH — Fix Before Deployment

---

### H1 — Real Credentials Exposed in `_env` File

**File:** `_env`

**Issue:**
Your `.env` file contains live credentials in plain text — Supabase DB password, JWT secret, Cloudinary API secret, GraphHopper key, Mapbox token, and Redis password. If this file is ever committed to Git (even once), those credentials are permanently in history even after deletion.

**Fix:**

1. Rotate every credential immediately (Supabase, Cloudinary, GraphHopper, Mapbox, Redis Cloud dashboards).

2. Add to `.gitignore` if not already there:
```
.env
_env
*.env
```

3. Rename `_env` to `.env` and ensure it's gitignored:
```bash
mv _env .env
echo ".env" >> .gitignore
```

4. For Railway deployment, paste each variable into the Railway dashboard environment variables section instead of using a file.

5. Fix this in the file before next use:
```bash
# WRONG — disables encryption on a cloud database
POSTGRES_DB_URL=...?sslmode=disable

# CORRECT
POSTGRES_DB_URL=...?sslmode=require
```

---

### H2 — Token Passed as Prop Instead of Read from Context

**Files:** `RideRoutesPage.jsx`, `startService.jsx`, `joinService.jsx`, `inviteService.jsx`, `profileService.jsx`

**Issue:**
Many service functions accept `token = null` as a parameter, and several screens pass `token` via `route.params`. This means the token travels through navigation params — it can end up in navigation state logs, crash reports, and is harder to refresh automatically. The `apiFetch` in `Apiclient.js` already reads the token from context via `getStoredToken()`, making the manual passing redundant and inconsistent.

**Fix:**

Remove `token` parameter from all service functions and rely on `apiFetch` reading it from `authContextRef`. The `api` helpers already do this correctly.

```js
// BEFORE — token passed manually, redundant
export const getStopPointsByRideId = async (generatedRidesId, token = null) => {
  const response = await api.get(`/riders/${generatedRidesId}/stop-points`, token);
  ...
};

// AFTER — apiFetch reads token from context automatically
export const getStopPointsByRideId = async (generatedRidesId) => {
  const response = await api.get(`/riders/${generatedRidesId}/stop-points`);
  ...
};
```

In `RideRoutesPage.jsx`, remove `token` from `route.params` destructuring and from the `fetchStopPoints` / `fetchImagesForStop` calls.

---

### H3 — `console.log` Used for Auth Token Logging

**Files:** `AuthContext.js`, `useRideLocationPolling.js`, `locationPollingService.jsx`

**Issue:**
Token availability is logged with `console.log` in multiple places:
```js
console.log('🔐 Auth token updated:', token ? '✅ Available' : '❌ Missing');
console.log('🔐 getToken() called, returning:', currentToken ? '✅ Available' : '❌ null');
```
In a production build, React Native console logs can be captured by crash reporting tools (Sentry, Bugsnag) or visible in device logs. Even logging "token available/missing" reveals auth state patterns to anyone with device access.

**Fix:**

Remove all auth-state `console.log` calls entirely in production. If you need them for debugging, wrap in a dev check:

```js
if (__DEV__) {
  console.log('Auth token state:', !!token);
}
```

Apply this pattern to all token-related logs in `AuthContext.js` and the polling hooks.

---

## 🟡 MEDIUM — Fix Before Showing to Interviewers

---

### M1 — `routeCache` Stores Sensitive Route Data in AsyncStorage Without Expiry

**File:** `routeCache.js`

**Issue:**
Route coordinates (GeoJSON with lat/lng data) are cached in AsyncStorage with no TTL. AsyncStorage is unencrypted on Android. If a ride is deleted on the server but the cache remains, stale route data will be shown. There's also no cache size limit — a user who creates many rides will accumulate unbounded cached data.

**Fix:**

Add a timestamp and TTL on save:

```js
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

save: async (generatedRidesId, routeCoordinates) => {
  try {
    if (!routeCoordinates) return;
    const entry = {
      data: routeCoordinates,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      `${PREFIX}${generatedRidesId}`,
      JSON.stringify(entry)
    );
  } catch (e) {
    console.warn('[routeCache] save failed:', e);
  }
},

get: async (generatedRidesId) => {
  try {
    const cached = await AsyncStorage.getItem(`${PREFIX}${generatedRidesId}`);
    if (!cached) return null;
    const entry = JSON.parse(cached);
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      await routeCache.clear(generatedRidesId);
      return null;
    }
    return entry.data;
  } catch (e) {
    console.warn('[routeCache] get failed:', e);
    return null;
  }
},
```

---

### M2 — `mapUtils.jsx` — Unhandled JSON Parse Error on WebView Message

**File:** `mapUtils.jsx`

**Issue:**
```js
const data = JSON.parse(event.nativeEvent.data);
```
This has no try/catch. If the WebView sends a malformed message (which happens during map initialization, errors, or Leaflet internal events), this will throw an unhandled exception and crash the component.

**Fix:**
```js
export const handleWebViewMessage = async (event, state) => {
  let data;
  try {
    data = JSON.parse(event.nativeEvent.data);
  } catch {
    return; // Ignore non-JSON WebView messages (Leaflet internals, etc.)
  }
  if (data?.type !== 'mapClick') return;
  // ... rest of handler
};
```

---

### M3 — `RidesList.jsx` — `token` Imported from Context but Never Used

**File:** `RidesList.jsx`

**Issue:**
```js
const {token} = useAuth();
```
`token` is destructured but never passed to `fetchRides` or `fetchMyRides`. This is dead code that causes confusion — it implies the token is needed but `apiFetch` handles it automatically. It also means if the component re-renders on token change, it does so unnecessarily.

**Fix:**
```js
// Remove the token destructure entirely
// const {token} = useAuth();  ← DELETE THIS
```

---

### M4 — `locationPollingService.jsx` — Polling Interval Has No Jitter

**File:** `locationPollingService.jsx`, `useRideLocationPolling.js`

**Issue:**
All participants poll every exactly 8 seconds. In a group ride with 10 participants, all their apps will hit `/location/{rideId}/share` at the same time every 8 seconds, creating a thundering herd against your backend. For a portfolio demo with few users this is fine, but worth noting.

**Fix:**

Add a small random jitter on start:

```js
// In startPolling(), before setting the interval:
const jitter = Math.floor(Math.random() * 2000); // 0–2 seconds
setTimeout(() => {
  intervalManager.current.start(() => {
    pollOnceRef.current();
  }, 8000);
}, jitter);
```

---

### M5 — `CoordinateValidator.js` — Latitude Capped at 180 Instead of 90

**File:** `CoordinateValidator.js`

**Issue:**
```js
if (Math.abs(num) > 180) {
  return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
}
```
This validation applies to both latitude and longitude. Valid latitude range is -90 to +90, not -180 to +180. A latitude of 150 would pass this check but is geographically impossible.

**Fix:**
```js
export const validateLatitude = (coord) => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  if (isNaN(num) || !isFinite(num)) return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  if (num === 0) return ERROR_MESSAGES.RIDE_CREATION.COORDINATES_ZERO;
  if (Math.abs(num) > 90) return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
  return null;
};

export const validateLongitude = (coord) => {
  const num = typeof coord === 'string' ? parseFloat(coord) : coord;
  if (isNaN(num) || !isFinite(num)) return ERROR_MESSAGES.LOCATION.COORDINATES_INVALID;
  if (num === 0) return ERROR_MESSAGES.RIDE_CREATION.COORDINATES_ZERO;
  if (Math.abs(num) > 180) return ERROR_MESSAGES.LOCATION.COORDINATES_OUT_OF_BOUNDS;
  return null;
};
```

Update `validateCoordinates` in `validationErrors.js` to use the split validators accordingly.

---

## 🟢 LOW — Polish Before Portfolio Presentation

---

### L1 — `RideCard.jsx` — `formatDate` Duplicated from `RideStepUtils.jsx`

**Files:** `RideCard.jsx`, `RideStepUtils.jsx`

**Issue:**
`formatDate` is defined separately in both files with slightly different implementations. This is a maintenance risk — if the format changes you have to update two places.

**Fix:**
Move `formatDate` to a shared utility file (e.g., `utilities/dateUtils.js`) and import it in both files:

```js
// utilities/dateUtils.js
export const formatDate = (dateValue) => {
  if (!dateValue) return 'Not specified';
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};
```

---

### L2 — `rideAction.jsx` — Class Pattern Inconsistent with Rest of Codebase

**File:** `rideAction.jsx`

**Issue:**
`RideActionService` is a class with a `new` instantiation — the only class in the entire service layer. Every other service uses plain object or function exports. This inconsistency adds cognitive friction for no benefit since the class holds no instance state.

**Fix:**
Convert to a plain object like every other service:

```js
export const rideAction = {
  getRideActionStatus: async (generatedRidesId) => { ... },
  getButtonState: (actionStatus) => { ... },
  // etc.
};
```

---

### L3 — `RouteMapHTML.jsx` — Leaflet Loaded from CDN Without Integrity Hash

**File:** `RouteMapHTML.jsx`

**Issue:**
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```
No `integrity` attribute means if unpkg serves a compromised file, your WebView will execute it. For a mobile app this is a real supply chain risk.

**Fix — Option A (quick):** Add integrity hashes:
```html
<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN2GqunU="
  crossorigin="anonymous">
</script>
```

**Fix — Option B (better for production):** Bundle Leaflet locally. Copy `leaflet.js` and `leaflet.css` into your assets and reference them via the local file path in the WebView `source`. This works offline too.

---

### L4 — `useUserLocation.js` — Coordinates Stored as Strings

**File:** `useUserLocation.js`

**Issue:**
```js
setLocation({
  latitude: latitude.toString(),  // ← string
  longitude: longitude.toString(), // ← string
  isDefault: false,
});
```
GPS coordinates from Geolocation are already numbers. Converting to strings means every consumer has to `parseFloat()` them back before any math. `DEFAULT_COORDS` in `appDefaults.js` also stores them as strings. This inconsistency is the source of the `parseCoordinateSafely` calls scattered through the codebase.

**Fix:**
Store as numbers everywhere:
```js
setLocation({
  latitude,   // already a number from position.coords
  longitude,
  isDefault: false,
});
```
Update `DEFAULT_COORDS`:
```js
export const DEFAULT_COORDS = {
  latitude: 12.8797,
  longitude: 121.7740,
  name: 'Philippines',
};
```

---

## ✅ Positive Observations

These are done well — no changes needed.

**AuthContext design is excellent.** Access token in memory only, refresh token in Keychain, refresh queue preventing concurrent rotation, automatic retry on 401. This is production-grade token management.

**`apiFetch` refresh queue (`refreshOnce`)** correctly solves the concurrent 401 thundering herd problem with a shared Promise reference. This is a subtle bug that many senior developers miss.

**Centralized error messages** in `errorMessages.js` with HTTP status mapping and `resolveErrorMessage` helper is the right pattern. It means user-facing strings are never scattered through service files.

**`useRideLocationPolling` AppState handling** correctly pauses polling when the app goes to background and resumes on foreground. This prevents battery drain and unnecessary network calls.

**`routeCache` with corruption detection** (catching JSON parse errors and clearing the key) is a solid defensive pattern for AsyncStorage usage.

---

## Pre-Deployment Checklist

| Priority | Action |
|---|---|
| 🔴 MUST | Rotate all credentials (Supabase, Cloudinary, GraphHopper, Mapbox, Redis) |
| 🔴 MUST | Add `.env` / `_env` to `.gitignore` |
| 🔴 MUST | Fix `sslmode=disable` → `sslmode=require` in DB URL |
| 🔴 MUST | Remove auth token `console.log` calls from AuthContext and polling hooks |
| 🔴 MUST | Wrap `JSON.parse` in `mapUtils.jsx` with try/catch |
| 🟡 SHOULD | Remove `token` prop threading — rely on `apiFetch` context reader |
| 🟡 SHOULD | Add TTL to `routeCache` entries |
| 🟡 SHOULD | Fix latitude validation cap (90 not 180) |
| 🟡 SHOULD | Remove unused `token` from `RidesList.jsx` |
| 🟢 CONSIDER | Add jitter to location polling interval |
| 🟢 CONSIDER | Add Leaflet integrity hash or bundle locally |
| 🟢 CONSIDER | Store GPS coordinates as numbers not strings |
| 🟢 CONSIDER | Merge duplicate `formatDate` into shared utility |

---

*Report generated May 2026 — RidersHub React Native Frontend*
