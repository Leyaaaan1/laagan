// MapInitScript.js
export const mapInitScript = () => `
    let map;
    let markersGroup;
    let riderMarkersGroup;
    let routeLayer;
    let geoJsonRouteLayer;
    let userLocationMarker;
    let userLocationAccuracyCircle;

    function initMap(startPoint) {
        try {
            let mapCenter = [8.2280, 125.5428]; // Fallback Mindanao location
            let mapZoom = 15;
            
            if (startPoint && startPoint.lat && startPoint.lng) {
                mapCenter = [startPoint.lat, startPoint.lng];
                mapZoom = 16;
            }
            
            map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true
            }).setView(mapCenter, mapZoom);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Store map instance globally
            window.mapInstance = map;

            markersGroup = L.layerGroup().addTo(map);
            riderMarkersGroup = L.layerGroup().addTo(map);

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'mapReady',
                message: 'Map initialized successfully'
            }));

            return true;
        } catch (error) {
            console.error('Map init error:', error);
            return false;
        }
    }

    // ─── NEW: Load route data into window ──────────────────────────────
    window.loadRouteData = function(routeData, startingPoint, endingPoint, stopPoints, userLocation) {
        console.log('[Map] loadRouteData called');
        
        // Store data for fitMapToRoute
        window._routeData = routeData;
        window.startingPoint = startingPoint;
        window.endingPoint = endingPoint;
        window.stopPoints = stopPoints || [];
        window.userLocation = userLocation;
        
        // Also store route data for display
        if (routeData) {
            window.routeData = routeData;
        }
        
        // Display the route if displayRoute function exists
        if (typeof window.displayRoute === 'function' && routeData) {
            window.displayRoute(routeData);
        }
        
        // Send message back to React Native
        window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'routeDataLoaded',
            message: 'Route data loaded successfully'
        }));
    };

    // ─── fitMapToRoute ──────────────────────────────────────────────────
    window.fitMapToRoute = function() {
    console.log('[Map] fitMapToRoute called');
    
    if (!window.mapInstance) {
        if (window.fitMapResolve) { window.fitMapResolve(false); window.fitMapResolve = null; }
        return false;
    }
    
    try {
        let bounds = null;
        let hasPoints = false;

        // ── NEW: Use the actually-rendered layer's bounds first ──
        // This guarantees bounds always match what's drawn, regardless
        // of routeData shape (GeoJSON vs coordinate array).
        if (window.geoJsonRouteLayer && window.geoJsonRouteLayer.getBounds) {
            const layerBounds = window.geoJsonRouteLayer.getBounds();
            if (layerBounds.isValid()) {
                bounds = layerBounds;
                hasPoints = true;
            }
        } else if (window.routeLayer && window.routeLayer.getBounds) {
            const layerBounds = window.routeLayer.getBounds();
            if (layerBounds.isValid()) {
                bounds = layerBounds;
                hasPoints = true;
            }
        }
        
        // Fallback: start/end/stop points if no rendered layer exists yet
        if (!hasPoints) {
            const start = window.startingPoint;
            const end = window.endingPoint;
            const stops = window.stopPoints || [];
            
            const allPoints = [];
            if (start && start.lat && start.lng) allPoints.push([start.lat, start.lng]);
            if (end && end.lat && end.lng) allPoints.push([end.lat, end.lng]);
            stops.forEach(stop => {
                if (stop && stop.lat && stop.lng) allPoints.push([stop.lat, stop.lng]);
            });
            
            if (allPoints.length > 0) {
                bounds = L.latLngBounds(allPoints);
                hasPoints = true;
            }
        }
        
        if (hasPoints && bounds) {
            const padding = 0.02;
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();
            const latPadding = (northEast.lat - southWest.lat) * padding;
            const lngPadding = (northEast.lng - southWest.lng) * padding;
            
            const paddedBounds = L.latLngBounds(
                [southWest.lat - latPadding, southWest.lng - lngPadding],
                [northEast.lat + latPadding, northEast.lng + lngPadding]
            );
            
            window.mapInstance.fitBounds(paddedBounds, { maxZoom: 16, animate: true, duration: 0.5 });
            
            if (window.fitMapResolve) { window.fitMapResolve(true); window.fitMapResolve = null; }
            return true;
        }
        
        if (window.fitMapResolve) { window.fitMapResolve(false); window.fitMapResolve = null; }
        return false;
        
    } catch (error) {
        console.error('[Map] Error fitting to route:', error);
        if (window.fitMapResolve) { window.fitMapResolve(false); window.fitMapResolve = null; }
        return false;
    }
};
    
    // ─── Get map instance ──────────────────────────────────────────────
    window.getMap = function() {
        return window.mapInstance;
    };

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = \`
            <h3>Map Error</h3>
            <p>\${message}</p>
        \`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    window.showError = showError;
`;
