// markerScript.js
export const markerScript = () => `
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

    window.addRouteMarkers = addRouteMarkers;
`;
