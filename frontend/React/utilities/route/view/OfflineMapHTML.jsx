/** * OfflineMapHTML.jsx * * Generates the self-contained HTML string rendered inside OfflineMapView's * WebView. Mirrors the structure of RouteMapHTML.jsx exactly so the same * bundled Leaflet assets and CSS are used — no CDN calls at all. * * ✅ UPDATED: Now includes displayOfflineRoute() to render cached GeoJSON routes * * Differences from RouteMapHTML / createMapHTML(): *   - Uses createOfflineMapScript() instead of createMapScript() *   - Adds displayOfflineRoute() script to render offline routes *   - Adds a visible offline-mode banner strip inside the HTML */

import leaflet from '../assets/leaflet/leaflet.js';
import {createOfflineMapScript} from '../map/offlineMapScript';
import routeMapStyles from './RouteMapStyles.js.jsx';
import leafletCSS from '../assets/leaflet/leafletCSS';

/** * ✅ NEW: Script to display offline route from cache * Handles both GeoJSON and coordinate array formats */
const offlineDisplayScript = () => `    window.currentGeoJsonRoute = null;
    window.currentRoute = null;

    /**
     * displayOfflineRoute(routeData)
     * 
     * Called from OfflineMapView when routeData prop changes.
     * Displays cached GeoJSON or coordinate array on the map.
     * 
     * routeData format:
     *   - { features: [...], coordinates: [...], routeCoordinates: "..." }
     */
    window.displayOfflineRoute = function(routeData) {
        try {

            if (!routeData) {
                return false;
            }

            const map = window.getMap();
            if (!map) {
                return false;
            }

            // Clear existing route layers
            if (window.currentGeoJsonRoute) {
                map.removeLayer(window.currentGeoJsonRoute);
                window.currentGeoJsonRoute = null;
            }
            if (window.currentRoute) {
                map.removeLayer(window.currentRoute);
                window.currentRoute = null;
            }

            // ✅ Priority 1: Handle GeoJSON features
            if (routeData.features && Array.isArray(routeData.features) && routeData.features.length > 0) {
                
                try {
                    window.currentGeoJsonRoute = L.geoJSON(routeData, {
                        style: {
                            color: '#1e40af',
                            weight: 5,
                            opacity: 0.9,
                            smoothFactor: 1,
                            lineJoin: 'round',
                            lineCap: 'round'
                        },
                        onEachFeature: function(feature, layer) {
                            if (feature.properties && feature.properties.summary) {
                                const summary = feature.properties.summary;
                                const popupContent = '<div class="route-popup">' + 
                                    (summary.distance ? 'Distance: ' + (summary.distance / 1000).toFixed(1) + ' km<br>' : '') +
                                    (summary.duration ? 'Duration: ' + Math.round(summary.duration / 60) + ' min' : '') +
                                    '</div>';
                                layer.bindPopup(popupContent);
                            }
                        }
                    }).addTo(map);

                    // Fit map to route bounds
                    const bounds = window.currentGeoJsonRoute.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds.pad(0.1), { animate: false });
                    }

                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'routeLoaded',
                        message: 'Offline GeoJSON route displayed',
                        featuresCount: routeData.features.length
                    }));
                    return true;
                } catch (e) {
                }
            }

            // ✅ Priority 2: Handle coordinate arrays
            if (routeData.coordinates && Array.isArray(routeData.coordinates)) {
                const coords = routeData.coordinates
                    .map(coord => {
                        if (Array.isArray(coord)) {
                            // Handle [lng, lat] format from GeoJSON
                            if (coord.length === 2) {
                                return [coord[1], coord[0]];
                            }
                            return coord;
                        }
                        // Handle { lat, lng } object format
                        return [coord.lat, coord.lng];
                    })
                    .filter(c => c && c[0] !== undefined && c[1] !== undefined);

                if (coords.length > 0) {
                    
                    try {
                        window.currentRoute = L.polyline(coords, {
                            color: '#1e40af',
                            weight: 5,
                            opacity: 0.9,
                            smoothFactor: 1,
                            lineJoin: 'round',
                            lineCap: 'round'
                        }).addTo(map);

                        // Fit map to route bounds
                        const bounds = window.currentRoute.getBounds();
                        if (bounds.isValid()) {
                            map.fitBounds(bounds.pad(0.1), { animate: false });
                        }

                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'routeLoaded',
                            message: 'Offline coordinate route displayed',
                            coordinatesCount: coords.length
                        }));
                        return true;
                    } catch (e) {
                    }
                }
            }

            // ✅ Priority 3: Handle string routeCoordinates (legacy format)
            if (routeData.routeCoordinates && typeof routeData.routeCoordinates === 'string') {
                try {
                    const parsed = JSON.parse(routeData.routeCoordinates);
                    
                    // Recursively call with parsed data
                    return window.displayOfflineRoute({
                        features: parsed.features,
                        coordinates: parsed.coordinates || parsed
                    });
                } catch (e) {
                }
            }

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeError',
                message: 'No valid route data format'
            }));
            return false;

        } catch (error) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeError',
                error: error.message
            }));
            return false;
        }
    };`;

export const createOfflineMapHTML = () => `    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>${leafletCSS}</style>
        <style>${routeMapStyles}</style>
        <style>
            /*
             * Offline-only styles.
             * routeMapStyles already defines #map, .custom-marker, .rider-marker,
             * .user-location-marker, #compass-container etc., so only the banner
             * needs to be added here.
             */
            #offline-banner {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1100;
                background: rgba(15, 23, 42, 0.82);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 5px 12px;
                pointer-events: none; /* let map touches pass through */
            }
            #offline-banner span {
                color: #fbbf24;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.3px;
            }
        </style>
    </head>
    <body>
        <!-- Map canvas -->
        <div id="map"></div>

        <!--
            Offline banner — visible inside the WebView layer.
            The RN-side banner in OfflineMapView sits on top of the WebView
            and is the primary indicator; this one is a fallback for cases
            where the RN overlay is hidden / scrolled away.
        -->
        <div id="offline-banner">
            <span>📡 Offline — tiles may be unavailable. Routes shown from cache.</span>
        </div>

        <!--
            Compass button — identical markup to RouteMapHTML so compassScript.js
            getElementById('compass-btn'), getElementById('compass-needle'), and
            getElementById('compass-label') all resolve correctly.
        -->
        <div id="compass-container">
            <button id="compass-btn" onclick="handleCompassPress()" title="Orient to next point">
                <div id="compass-needle">&#9650;</div>
            </button>
            <span id="compass-label">N</span>
        </div>

        <!-- Bundled Leaflet (no CDN) -->
        <script>${leaflet}</script>

        <!-- ✅ NEW: Offline route display script -->
        <script>${offlineDisplayScript()}</script>

        <!-- Offline map logic (no routeDisplay, no mainLoader) -->
        <script>${createOfflineMapScript()}</script>
    </body>
    </html>`
;
