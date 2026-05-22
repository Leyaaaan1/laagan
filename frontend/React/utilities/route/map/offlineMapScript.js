/**
 * offlineMapScript.js
 *
 * Composes the WebView JavaScript bundle used by OfflineMapView.
 * Deliberately excludes routeDisplayScript (needs live API) and
 * mainLoaderScript (calls displayRoute + initMap via DOMContentLoaded,
 * which conflicts with the offline loader's own init sequence).
 *
 * Included scripts and why:
 *   mapInitScript      – L.map setup, markersGroup, riderMarkersGroup, getMap()
 *   userLocationScript – updateUserLocation() blue dot
 *   markerScript       – addRouteMarkers() start/stop/end pins
 *   riderMarkersScript – updateRiderMarkers() live rider pins
 *   compassScript      – compass bearing + handleCompassPress()
 *   offlineLoaderScript (inline below) – replaces mainLoaderScript;
 *                        calls initMap() then addRouteMarkers(), never displayRoute()
 */

import {mapInitScript} from './scripts/mapInitScript';
import {userLocationScript} from './scripts/userLocationScript';
import {markerScript} from './scripts/markerScript';
import {riderMarkersScript} from './scripts/riderMarkersScript';
import {compassScript} from './scripts/compassScript';

/**
 * Replaces mainLoaderScript for the offline map.
 *
 * Key differences from mainLoaderScript:
 *   - Never calls displayRoute() — no API, no polyline
 *   - window.loadOfflineData() is the entry point (called by OfflineMapView
 *     via injectJavaScript after onLoadEnd)
 *   - DOMContentLoaded calls initMap() with no args so the map boots with the
 *     centre baked into the HTML; loadOfflineData() then repositions + pins
 */
const offlineLoaderScript = () => `
    /**
     * loadOfflineData(startPoint, endPoint, stopPoints, userLocation)
     *
     * Called once from OfflineMapView after the WebView signals mapReady.
     * Sets all window.* globals that markerScript and compassScript read,
     * then schedules addRouteMarkers() and optionally updateUserLocation().
     */
    window.loadOfflineData = function(startPoint, endPoint, stopPoints, userLocation) {
        console.log('📴 loadOfflineData called', { startPoint, endPoint, stopPoints });

        // Write globals so markerScript / compassScript can read them
        window.startingPoint = startPoint;
        window.endingPoint   = endPoint;
        window.stopPoints    = stopPoints || [];

        const map = window.getMap();
        if (!map) {
            console.error('❌ Offline map not ready — calling initMap() first');
            initMap(startPoint);
        }

        // Centre the map on the starting point if provided
        if (startPoint && startPoint.lat && startPoint.lng) {
            window.getMap().setView([startPoint.lat, startPoint.lng], 15, {
                animate: false,
            });
        }

        // Slight delay mirrors mainLoaderScript's 200 ms setTimeout for markers
        setTimeout(function() {
            window.addRouteMarkers();
        }, 200);

        if (userLocation) {
            window.updateUserLocation(userLocation);
        }

        // Notify React Native that the offline map is ready for rider-marker
        // injection (same message type RouteMapView listens for)
        window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'offlineMapReady',
            message: 'Offline map data loaded',
        }));
    };

    // Boot the map as soon as the DOM is ready.
    // initMap() is defined in mapInitScript; it posts 'mapReady' when done.
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📴 Offline map DOM ready — initialising map');
        initMap(); // no startPoint yet; OfflineMapView calls loadOfflineData() after mapReady
    });
`;

/**
 * createOfflineMapScript()
 *
 * Returns the concatenated JS string that goes inside the offline HTML's
 * <script> tag. Same pattern as createMapScript() in RouteMapScript.jsx.
 */
export const createOfflineMapScript = () =>
  mapInitScript() +
  userLocationScript() +
  markerScript() +
  riderMarkersScript() +
  compassScript() +
  offlineLoaderScript();
