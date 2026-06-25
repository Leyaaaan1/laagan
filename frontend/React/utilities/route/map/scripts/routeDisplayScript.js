// routeDisplayScript.js
export const routeDisplayScript = () => `
    function displayRoute(routeData) {
        try {
            const map = window.getMap();

            if (!map) {
                window.showError('Map not ready');
                return false;
            }

            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }
            if (geoJsonRouteLayer) {
                map.removeLayer(geoJsonRouteLayer);
                geoJsonRouteLayer = null;
            }
            markersGroup.clearLayers();

            if (!routeData) {
                window.showError('No route data available');
                return false;
            }

            if (routeData.features && Array.isArray(routeData.features) && routeData.features.length > 0) {
                return displayGeoJsonRoute(routeData);
            } else {
                return displayCoordinateRoute(routeData);
            }
        } catch (error) {
            window.showError('Failed to display route: ' + error.message);
            return false;
        }
    }

    function displayGeoJsonRoute(geoJsonData) {
        try {
            const map = window.getMap();

            geoJsonRouteLayer = L.geoJSON(geoJsonData, {
                style: {
                    color: '#1e40af',
                    weight: 5,
                    opacity: 0.9,
                    smoothFactor: 1,
                    lineJoin: 'round',
                    lineCap: 'round'
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        let popupContent = '<div class="route-popup" style="border-color: #1e40af;">';

                        if (feature.properties.summary) {
                            const summary = feature.properties.summary;
                            popupContent += '<strong> Route Information</strong><br>';

                            if (summary.distance) {
                                const distance = (summary.distance / 1000).toFixed(2);
                                popupContent += \`<b>Distance:</b> \${distance} km<br>\`;
                            }

                            if (summary.duration) {
                                const totalMinutes = Math.floor(summary.duration / 60);
                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = totalMinutes % 60;
                                const durationText = hours > 0 ? \`\${hours}h \${minutes}min\` : \`\${minutes}min\`;
                                popupContent += \`<b>Duration:</b> \${durationText}\`;
                            }
                        } else {
                            popupContent += '<strong>️ Route Information</strong>';
                        }

                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);

            // Store the layer for bounds calculation
            window.geoJsonRouteLayer = geoJsonRouteLayer;

            let totalDistance = 0;
            let totalDuration = 0;
            let coordinateCount = 0;

            geoJsonData.features.forEach(feature => {
                if (feature.properties && feature.properties.summary) {
                    totalDistance += feature.properties.summary.distance || 0;
                    totalDuration += feature.properties.summary.duration || 0;
                }
                if (feature.geometry && feature.geometry.coordinates) {
                    coordinateCount += feature.geometry.coordinates.length;
                }
            });

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeLoaded',
                message: 'GeoJSON route displayed successfully',
                coordinatesCount: coordinateCount,
                distance: totalDistance / 1000,
                duration: totalDuration
            }));

            return true;
        } catch (error) {
            window.showError('Failed to display GeoJSON route: ' + error.message);
            return false;
        }
    }

    function displayCoordinateRoute(routeData) {
        try {
            const map = window.getMap();
            let routeCoordinates = [];

            if (routeData.coordinates) {
                routeCoordinates = routeData.coordinates.map(coord =>
                    Array.isArray(coord) ? [coord[1], coord[0]] : [coord.lat, coord.lng]
                );
            } else if (Array.isArray(routeData)) {
                routeCoordinates = routeData.map(coord =>
                    Array.isArray(coord) ? [coord[1], coord[0]] : [coord.lat, coord.lng]
                );
            }

            if (routeCoordinates.length === 0) {
                window.showError('No valid route coordinates');
                return false;
            }

            routeLayer = L.polyline(routeCoordinates, {
                color: '#1e40af',
                weight: 5,
                opacity: 0.9,
                smoothFactor: 1,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(map);

            // Store the layer for bounds calculation
            window.routeLayer = routeLayer;

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeLoaded',
                message: 'Coordinate route displayed successfully',
                coordinatesCount: routeCoordinates.length
            }));

            return true;
        } catch (error) {
            window.showError('Failed to display coordinate route: ' + error.message);
            return false;
        }
    }

    window.displayRoute = displayRoute;
    
     var rerouteLayer = null;

    function drawRerouteForRider(coordinatesJson) {
        try {
            const map = window.getMap();
            if (!map) return false;

            // Clear the previous personal reroute line if one exists.
            if (rerouteLayer) {
                map.removeLayer(rerouteLayer);
                rerouteLayer = null;
            }

            // Parse the coordinates string coming from the backend.
            let routeData = coordinatesJson;
            if (typeof coordinatesJson === 'string') {
                routeData = JSON.parse(coordinatesJson);
            }

            if (!routeData) return false;

            // ── GeoJSON format (features array — same as GraphHopper returns) ──
            if (routeData.features && Array.isArray(routeData.features)) {
                rerouteLayer = L.geoJSON(routeData, {
                    style: {
                        color: '#f97316',     // orange — distinct from shared blue route
                        weight: 5,
                        opacity: 0.9,
                        smoothFactor: 1,
                        lineJoin: 'round',
                        lineCap: 'round',
                        dashArray: '10, 6',   // dashed so riders can tell it apart
                    }
                }).addTo(map);

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'rerouteDrawn',
                    format: 'geojson',
                }));
                return true;
            }

            // ── Coordinate array format [[lng, lat], ...] ─────────────────────
            if (Array.isArray(routeData)) {
                const latLngs = routeData.map(coord =>
                    Array.isArray(coord)
                        ? [coord[1], coord[0]]          // [lng, lat] → Leaflet [lat, lng]
                        : [coord.lat, coord.lng]
                );

                if (latLngs.length === 0) return false;

                rerouteLayer = L.polyline(latLngs, {
                    color: '#f97316',
                    weight: 5,
                    opacity: 0.9,
                    smoothFactor: 1,
                    lineJoin: 'round',
                    lineCap: 'round',
                    dashArray: '10, 6',
                }).addTo(map);

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'rerouteDrawn',
                    format: 'coordinates',
                }));
                return true;
            }

            return false;
        } catch (e) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'rerouteError',
                error: e.message,
            }));
            return false;
        }
    }
    function clearRerouteForRider() {
        try {
            const map = window.getMap();
            if (map && rerouteLayer) {
                map.removeLayer(rerouteLayer);
                rerouteLayer = null;
            }
        } catch (e) {}
    }

    window.drawRerouteForRider  = drawRerouteForRider;
    window.clearRerouteForRider = clearRerouteForRider;
`;
