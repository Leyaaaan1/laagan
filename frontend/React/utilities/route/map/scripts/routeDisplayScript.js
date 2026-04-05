// routeDisplayScript.js
export const routeDisplayScript = () => `
    function displayRoute(routeData) {
        try {
            console.log('=== DISPLAYING ROUTE ===');
            console.log('Route data type:', typeof routeData);

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
                console.log('Processing as GeoJSON route data');
                return displayGeoJsonRoute(routeData);
            } else {
                console.log('Processing as coordinate array route data');
                return displayCoordinateRoute(routeData);
            }
        } catch (error) {
            console.error('Error in displayRoute:', error);
            window.showError('Failed to display route: ' + error.message);
            return false;
        }
    }

    function displayGeoJsonRoute(geoJsonData) {
        try {
            console.log('=== DISPLAYING GEOJSON ROUTE ===');
            console.log('GeoJSON features:', geoJsonData.features.length);

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
            window.showError('Failed to display GeoJSON route: ' + error.message);
            return false;
        }
    }

    function displayCoordinateRoute(routeData) {
        try {
            console.log('=== DISPLAYING COORDINATE ROUTE ===');

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
            window.showError('Failed to display coordinate route: ' + error.message);
            return false;
        }
    }

    window.displayRoute = displayRoute;
`;
