export const createMapScript = () => `
    let map;
    let routeLayer;
    let geoJsonRouteLayer;
    let markersGroup;
    let userLocationMarker;
    let userLocationAccuracyCircle;
    let riderMarkersGroup;

    // ✅ NEW: Accept optional startPoint parameter
    function initMap(startPoint) {
        try {
            // ✅ NEW: Use startPoint if available and valid, otherwise fall back to hardcoded
            let mapCenter = [8.2280, 125.5428]; // Fallback Mindanao location
            let mapZoom = 15;
            
            if (startPoint && startPoint.lat && startPoint.lng) {
                mapCenter = [startPoint.lat, startPoint.lng];
                mapZoom = 16; // Slightly more zoomed in for user's start point
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

            markersGroup = L.layerGroup().addTo(map);
            riderMarkersGroup = L.layerGroup().addTo(map);

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'mapReady',
                message: 'Map initialized successfully'
            }));

            return true;
        } catch (error) {
            console.error('Error initializing map:', error);
            return false;
        }
    }
    

    function updateUserLocation(location) {
        try {
            if (!location || !location.lat || !location.lng) {
                console.log('Invalid user location data');
                return;
            }

            const latLng = [location.lat, location.lng];
            const accuracy = location.accuracy || 50;

            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }
            if (userLocationAccuracyCircle) {
                map.removeLayer(userLocationAccuracyCircle);
            }

            userLocationAccuracyCircle = L.circle(latLng, {
                radius: accuracy,
                className: 'user-location-accuracy',
                interactive: false
            }).addTo(map);

            const userIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="user-location-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });

            userLocationMarker = L.marker(latLng, { icon: userIcon })
                .addTo(map)
                .bindPopup(\`
                    <div class="route-popup" style="border-color: #2563eb;">
                        <strong> Your Location</strong><br>
                        <b>Lat:</b> \${location.lat.toFixed(6)}<br>
                        <b>Lng:</b> \${location.lng.toFixed(6)}
                    </div>
                \`);

            console.log('User location updated on map:', location);
        } catch (error) {
            console.error('Error updating user location:', error);
        }
    }

    function displayRoute(routeData) {
        try {
            console.log('=== DISPLAYING ROUTE ===');
            console.log('Route data type:', typeof routeData);

            if (!map) {
                showError('Map not ready');
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
                showError('No route data available');
                return false;
            }

            if (routeData.features && Array.isArray(routeData.features) && routeData.features.length > 0) {
                console.log('Processing as GeoJSON route data');
                return displayGeoJsonRoute(routeData);
            } else {
                console.log('Processing as coordinate array route data');
                return displayCoordinateRoute(routeData);
            }
        } catch (error) {
            console.error('Error in displayRoute:', error);
            showError('Failed to display route: ' + error.message);
            return false;
        }
    }

    function displayGeoJsonRoute(geoJsonData) {
        try {
            console.log('=== DISPLAYING GEOJSON ROUTE ===');
            console.log('GeoJSON features:', geoJsonData.features.length);

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

            const startPoint = window.startingPoint;
            if (startPoint && startPoint.lat && startPoint.lng) {
                map.setView([startPoint.lat, startPoint.lng], 16, {
                    animate: true,
                    duration: 1
                });
            } else if (geoJsonRouteLayer) {
                const bounds = geoJsonRouteLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds.pad(0.1));
                }
            }

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

            console.log('GeoJSON route displayed successfully');

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeLoaded',
                message: 'GeoJSON route displayed successfully',
                coordinatesCount: coordinateCount,
                distance: totalDistance / 1000,
                duration: totalDuration
            }));

            return true;
        } catch (error) {
            console.error('Error displaying GeoJSON route:', error);
            showError('Failed to display GeoJSON route: ' + error.message);
            return false;
        }
    }

    function displayCoordinateRoute(routeData) {
        try {
            console.log('=== DISPLAYING COORDINATE ROUTE ===');

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
                showError('No valid route coordinates');
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

            const startPoint = window.startingPoint;
            if (startPoint && startPoint.lat && startPoint.lng) {
                map.setView([startPoint.lat, startPoint.lng], 16, {
                    animate: true,
                    duration: 1
                });
            } else if (routeCoordinates.length > 0) {
                const group = new L.featureGroup([routeLayer]);
                map.fitBounds(group.getBounds().pad(0.1));
            }

            console.log('Coordinate route displayed successfully');

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'routeLoaded',
                message: 'Coordinate route displayed successfully',
                coordinatesCount: routeCoordinates.length
            }));

            return true;
        } catch (error) {
            console.error('Error displaying coordinate route:', error);
            showError('Failed to display coordinate route: ' + error.message);
            return false;
        }
    }

    function addRouteMarkers() {
        try {
            console.log('=== ADDING ROUTE MARKERS ===');
            console.log('Window variables check:', {
                hasWindow: typeof window !== 'undefined',
                startingPoint: window.startingPoint,
                endingPoint: window.endingPoint,
                stopPoints: window.stopPoints
            });

            const startPoint = window.startingPoint;
            const endPoint = window.endingPoint;
            const stopPoints = window.stopPoints || [];

            console.log('DETAILED MARKER DATA:');
            console.log('Start Point:', JSON.stringify(startPoint, null, 2));
            console.log('End Point:', JSON.stringify(endPoint, null, 2));
            console.log('Stop Points:', JSON.stringify(stopPoints, null, 2));

            let markersAdded = 0;

            const createCustomMarker = (latLng, className, iconText, color, popupText, labelText) => {
                try {
                    console.log(\`Creating marker at [\${latLng[0]}, \${latLng[1]}] with class \${className}\`);

                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: \`<div class="custom-marker \${className}">\${iconText}</div>\`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                        popupAnchor: [0, -16]
                    });

                    const marker = L.marker(latLng, { icon: icon })
                        .addTo(markersGroup)
                        .bindPopup(\`<div class="route-popup" style="border-color: \${color};">\${popupText}</div>\`);

                    if (labelText) {
                        const label = L.tooltip({
                            permanent: true,
                            direction: 'top',
                            offset: [0, -20],
                            className: 'location-name-label',
                            opacity: 1
                        });
                        label.setContent(\`<span style="color: \${color}; border-color: \${color};">\${labelText}</span>\`);
                        marker.bindTooltip(label);
                    }

                    console.log(\`✓ Marker created successfully: \${className}\`);
                    markersAdded++;
                    return marker;
                } catch (err) {
                    console.error(\`✗ Failed to create marker \${className}:\`, err);
                    return null;
                }
            };

            // Add START marker
            if (startPoint && startPoint.lat && startPoint.lng) {
                const name = startPoint.name || startPoint.address || 'Starting Point';
                console.log('→ Adding START marker');
                createCustomMarker(
                    [startPoint.lat, startPoint.lng],
                    'marker-start',
                    '🚀',
                    '#16a34a',
                    \`<strong>🚀 Starting Point</strong><br><b>\${name}</b>\`,
                    name
                );
            } else {
                console.warn('✗ Start point INVALID or MISSING');
            }

            // Add STOP markers
            if (Array.isArray(stopPoints) && stopPoints.length > 0) {
                console.log(\`→ Processing \${stopPoints.length} stop points\`);
                stopPoints.forEach((stop, index) => {
                    console.log(\`  Checking stop \${index + 1}:\`, stop);
                    if (stop && stop.lat && stop.lng) {
                        const name = stop.name || stop.address || \`Stop \${index + 1}\`;
                        console.log(\`  → Adding STOP \${index + 1} marker\`);
                        createCustomMarker(
                            [stop.lat, stop.lng],
                            'marker-stop',
                            (index + 1).toString(),
                            '#d97706',
                            \`<strong>🛑 Stop Point \${index + 1}</strong><br><b>\${name}</b>\`,
                            name
                        );
                    } else {
                        console.warn(\`  ✗ Stop \${index + 1} INVALID or MISSING coordinates\`);
                    }
                });
            } else {
                console.log('ℹ No stop points to add');
            }

            // Add END marker
            if (endPoint && endPoint.lat && endPoint.lng) {
                const name = endPoint.name || endPoint.address || 'Ending Point';
                createCustomMarker(
                    [endPoint.lat, endPoint.lng],
                    'marker-end',
                    '🏁',
                    '#dc2626',
                    \`<strong>🏁 Ending Point</strong><br><b>\${name}</b>\`,
                    name
                );
            }

            console.log(\`=== MARKER SUMMARY: \${markersAdded} markers added ===\`);

            if (markersAdded === 0) {
                console.error('️ WARNING: NO MARKERS WERE ADDED! Check data structure.');
            }

        } catch (error) {
            console.error('❌ CRITICAL ERROR in addRouteMarkers:', error);
            console.error('Stack trace:', error.stack);
        }
    }

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

    window.loadRouteData = function(routeData, startPoint, endPoint, stopPoints, userLocation) {
        window.routeData = routeData;
        window.startingPoint = startPoint;
        window.endingPoint = endPoint;
        window.stopPoints = stopPoints || [];

        if (!map) {
            console.error('❌ Map not ready!');
            // ✅ NEW: Pass startPoint when initializing map if not already done
            initMap(startPoint);
            showError('Map not ready for route data');
            return;
        }

        const routeDisplayed = displayRoute(routeData);

        if (routeDisplayed) {
            setTimeout(() => {
                addRouteMarkers();
            }, 200);
        }

        if (userLocation) {
            updateUserLocation(userLocation);
        }
    };

    window.updateUserLocation = updateUserLocation;

    // ─────────────────────────────────────────────────────────────────
    // NEW: UPDATE RIDER MARKERS FUNCTION
    // ─────────────────────────────────────────────────────────────────
    function updateRiderMarkers(riderMarkers, currentUsername) {
        try {
            console.log('=== UPDATING RIDER MARKERS ===');
            console.log('Riders to display:', Object.keys(riderMarkers));
            
            // Clear existing rider markers
            riderMarkersGroup.clearLayers();
            
            if (!riderMarkers || Object.keys(riderMarkers).length === 0) {
                console.log('No rider markers to display');
                return;
            }

            Object.entries(riderMarkers).forEach(([riderId, location]) => {
                try {
                    const { latitude, longitude, locationName, distanceMeters } = location;
                    
                    if (!latitude || !longitude) {
                        console.warn(\`Skipping rider \${riderId}: missing coordinates\`);
                        return;
                    }

                    const latLng = [latitude, longitude];
                    const isCurrentUser = riderId === currentUsername;
                    
                    // Different color for current user vs other riders
                    const markerColor = isCurrentUser ? '#FF5722' : '#2196F3';
                    const markerClass = isCurrentUser ? 'rider-marker-self' : 'rider-marker-other';
                    const iconSymbol = isCurrentUser ? '🏍' : '🚲';

                    const riderIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: \`
                            <div class="rider-marker \${markerClass}" style="
                                background-color: \${markerColor};
                                width: 32px;
                                height: 32px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border: 3px solid white;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                font-size: 18px;
                            ">
                                \${iconSymbol}
                            </div>
                        \`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                        popupAnchor: [0, -20]
                    });

                    const popupText = \`
                        <div class="route-popup" style="border-color: \${markerColor}; border-left: 4px solid \${markerColor};">
                            <strong>\${isCurrentUser ? '🏍 You' : '🚲 ' + riderId}</strong><br>
                            <b>Location:</b> \${locationName || 'Unknown'}<br>
                            <b>Distance:</b> \${Math.round(distanceMeters || 0)}m away<br>
                            <small style="color: #666; margin-top: 4px;">Live location</small>
                        </div>
                    \`;

                    const marker = L.marker(latLng, { icon: riderIcon })
                        .addTo(riderMarkersGroup)
                        .bindPopup(popupText);

                    // Add name label on top of marker
                    const labelText = \`<span style="
                        background-color: \${markerColor};
                        color: white;
                        padding: 2px 6px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: bold;
                        white-space: nowrap;
                    ">\${riderId}\${isCurrentUser ? ' (You)' : ''}</span>\`;

                    const nameLabel = L.tooltip({
                        permanent: true,
                        direction: 'top',
                        offset: [0, -28],
                        className: 'rider-name-label',
                        opacity: 0.95
                    });
                    nameLabel.setContent(labelText);
                    marker.bindTooltip(nameLabel);

                    console.log(\`✓ Rider marker added: \${riderId} at [\${latitude}, \${longitude}]\`);
                } catch (err) {
                    console.error(\`Error adding rider marker for \${riderId}:\`, err);
                }
            });

            console.log(\`=== RIDER MARKERS UPDATE COMPLETE ===\`);
        } catch (error) {
            console.error('Error updating rider markers:', error);
        }
    }

    window.updateRiderMarkers = updateRiderMarkers;

    // ─── COMPASS / BEARING FEATURE ────────────────────────────────────

    function calculateBearing(from, to) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const toDeg = (rad) => (rad * 180) / Math.PI;
        const lat1 = toRad(from.lat);
        const lat2 = toRad(to.lat);
        const dLng  = toRad(to.lng - from.lng);
        const x = Math.sin(dLng) * Math.cos(lat2);
        const y =
            Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        const bearing = toDeg(Math.atan2(x, y));
        return (bearing + 360) % 360;
    }

    function orientMapToPoint(targetPoint) {
        if (!map) return;
        const origin = window.userCurrentLocation || window.startingPoint;
        if (!origin || !targetPoint) {
            console.warn('orientMapToPoint: missing origin or target');
            return;
        }

        map.flyTo([targetPoint.lat, targetPoint.lng], map.getZoom(), {
            animate: true,
            duration: 0.8
        });

        const bearingDeg = calculateBearing(origin, targetPoint);
        window.currentBearing = bearingDeg;
        const needle = document.getElementById('compass-needle');
        if (needle) needle.style.transform = \`rotate(\${bearingDeg}deg)\`;

        console.log('Map focused on point, bearing:', bearingDeg);
    }

    function resetMapOrientation() {
        const origin = window.userCurrentLocation || window.startingPoint;
        if (origin) {
            map.flyTo([origin.lat, origin.lng], map.getZoom(), {
                animate: true,
                duration: 0.8
            });
        }

        window.currentBearing = 0;
        const needle = document.getElementById('compass-needle');
        if (needle) needle.style.transform = 'rotate(0deg)';
        const label = document.getElementById('compass-label');
        if (label) label.textContent = 'N';
    }

    let compassTargetIndex = -1;

    function handleCompassPress() {
        const points = [
            window.startingPoint,
            ...(window.stopPoints || []),
            window.endingPoint,
        ].filter(Boolean);

        if (points.length === 0) {
            console.warn('No route points to orient toward');
            return;
        }

        if (compassTargetIndex >= points.length - 1) {
            compassTargetIndex = -1;
            resetMapOrientation();
            return;
        }

        compassTargetIndex++;
        const target = points[compassTargetIndex];
        orientMapToPoint(target);

        const label = document.getElementById('compass-label');
        if (label) {
            if (compassTargetIndex === 0) {
                label.textContent = 'STR';
            } else if (compassTargetIndex === points.length - 1) {
                label.textContent = 'END';
            } else {
                label.textContent = \`S\${compassTargetIndex}\`;
            }
        }
    }

    window.orientMapToPoint    = orientMapToPoint;
    window.resetMapOrientation = resetMapOrientation;
    window.handleCompassPress  = handleCompassPress;

    // ──────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM Content Loaded - Initializing map...');
        // ✅ CHANGE: Call initMap without parameters (will use fallback)
        // The startPoint will be passed when loadRouteData is called
        initMap();
    });
`;
