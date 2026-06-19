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
            console.log('[Map] No map instance available');
            if (window.fitMapResolve) {
                window.fitMapResolve(false);
                window.fitMapResolve = null;
            }
            return false;
        }
        
        // Get all route coordinates from the stored route data
        const routeData = window.routeData || window._routeData;
        
        if (!routeData) {
            console.log('[Map] No route data available');
            if (window.fitMapResolve) {
                window.fitMapResolve(false);
                window.fitMapResolve = null;
            }
            return false;
        }
        
        try {
            let bounds = null;
            let hasPoints = false;
            
            // If routeData is GeoJSON FeatureCollection
            if (routeData.type === 'FeatureCollection' && routeData.features) {
                // Get coordinates from route line
                const routeFeature = routeData.features.find(f => 
                    f.geometry && f.geometry.type === 'LineString'
                );
                
                if (routeFeature && routeFeature.geometry.coordinates) {
                    const coords = routeFeature.geometry.coordinates;
                    coords.forEach(coord => {
                        // coord is [lng, lat]
                        const point = [coord[1], coord[0]]; // [lat, lng] for Leaflet
                        if (!bounds) {
                            bounds = L.latLngBounds(point, point);
                        } else {
                            bounds.extend(point);
                        }
                        hasPoints = true;
                    });
                }
            }
            
            // If no bounds from route, try starting and ending points
            if (!hasPoints) {
                const start = window.startingPoint;
                const end = window.endingPoint;
                const stops = window.stopPoints || [];
                
                const allPoints = [];
                if (start && start.lat && start.lng) {
                    allPoints.push([start.lat, start.lng]);
                }
                if (end && end.lat && end.lng) {
                    allPoints.push([end.lat, end.lng]);
                }
                stops.forEach(stop => {
                    if (stop && stop.lat && stop.lng) {
                        allPoints.push([stop.lat, stop.lng]);
                    }
                });
                
                if (allPoints.length > 0) {
                    bounds = L.latLngBounds(allPoints);
                    hasPoints = true;
                }
            }
            
            // If we have bounds, fit the map
            if (hasPoints && bounds) {
                // Add padding - increased for better visibility
                const padding = 0.02; // 2% padding
                const southWest = bounds.getSouthWest();
                const northEast = bounds.getNorthEast();
                
                const latPadding = (northEast.lat - southWest.lat) * padding;
                const lngPadding = (northEast.lng - southWest.lng) * padding;
                
                const paddedBounds = L.latLngBounds(
                    [southWest.lat - latPadding, southWest.lng - lngPadding],
                    [northEast.lat + latPadding, northEast.lng + lngPadding]
                );
                
                window.mapInstance.fitBounds(paddedBounds, {
                    maxZoom: 16, // Prevent zooming in too close
                    animate: true,
                    duration: 0.5
                });
                
                console.log('[Map] Fitted to route bounds');
                
                // Notify that fit is complete
                if (window.fitMapResolve) {
                    window.fitMapResolve(true);
                    window.fitMapResolve = null;
                }
                
                return true;
            } else {
                console.log('[Map] No points found to fit');
                if (window.fitMapResolve) {
                    window.fitMapResolve(false);
                    window.fitMapResolve = null;
                }
                return false;
            }
            
        } catch (error) {
            console.error('[Map] Error fitting to route:', error);
            if (window.fitMapResolve) {
                window.fitMapResolve(false);
                window.fitMapResolve = null;
            }
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
