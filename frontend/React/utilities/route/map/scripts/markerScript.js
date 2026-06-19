// markerScript.js
export const markerScript = () => `

    function addRouteMarkers() {
        try {
            const startPoint = window.startingPoint;
            const endPoint   = window.endingPoint;
            const stopPoints = window.stopPoints || [];

            let markersAdded = 0;

            // ── createCustomMarker ────────────────────────────────────────────
            // Uses L.circleMarker (SVG-based) instead of L.divIcon (HTML div).
            // SVG elements are serializable by XMLSerializer so they appear
            // in the canvas snapshot captured by window.captureMapSnapshot.
            // L.divIcon renders as a DOM <div> which lives outside the SVG
            // layer and is therefore invisible to canvas capture.
            const createCustomMarker = (latLng, color, labelText, popupText) => {
                try {
                    // Outer filled circle
                    const marker = L.circleMarker(latLng, {
                        radius:      12,
                        fillColor:   color,
                        color:       '#ffffff',   // white border
                        weight:      2.5,
                        opacity:     1,
                        fillOpacity: 0.95,
                    })
                    .addTo(markersGroup)
                    .bindPopup(
                        \`<div class="route-popup" style="border-color:\${color};">\${popupText}</div>\`
                    );

                    // Permanent name label rendered as a Leaflet tooltip
                    // (tooltips are part of the SVG/HTML overlay layer)
                    if (labelText) {
                        marker.bindTooltip(labelText, {
                            permanent:  true,
                            direction:  'top',
                            offset:     [0, -16],
                            className:  'location-name-label',
                            opacity:    1,
                        });
                    }

                    markersAdded++;
                    return marker;
                } catch (err) {
                    return null;
                }
            };

            // ── START marker (green) ──────────────────────────────────────────
            if (startPoint && startPoint.lat && startPoint.lng) {
                const name = startPoint.name || startPoint.address || 'Starting Point';
                createCustomMarker(
                    [startPoint.lat, startPoint.lng],
                    '#16a34a',
                    name,
                    \`<strong>🚀 Starting Point</strong><br><b>\${name}</b>\`
                );
            }

            // ── STOP markers (amber) ──────────────────────────────────────────
            if (Array.isArray(stopPoints) && stopPoints.length > 0) {
                stopPoints.forEach((stop, index) => {
                    if (stop && stop.lat && stop.lng) {
                        const name = stop.name || stop.address || \`Stop \${index + 1}\`;
                        createCustomMarker(
                            [stop.lat, stop.lng],
                            '#d97706',
                            name,
                            \`<strong>🛑 Stop Point \${index + 1}</strong><br><b>\${name}</b>\`
                        );
                    }
                });
            }

            // ── END marker (red) ──────────────────────────────────────────────
            if (endPoint && endPoint.lat && endPoint.lng) {
                const name = endPoint.name || endPoint.address || 'Ending Point';
                createCustomMarker(
                    [endPoint.lat, endPoint.lng],
                    '#dc2626',
                    name,
                    \`<strong>🏁 Ending Point</strong><br><b>\${name}</b>\`
                );
            }

        } catch (error) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'markerError',
                error: error.message,
            }));
        }
    }

    window.addRouteMarkers = addRouteMarkers;
`;
