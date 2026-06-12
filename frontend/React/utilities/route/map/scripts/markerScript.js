// markerScript.js
export const markerScript = () => `
    function addRouteMarkers() {
        try {
 
            const startPoint = window.startingPoint;
            const endPoint = window.endingPoint;
            const stopPoints = window.stopPoints || [];

       

            let markersAdded = 0;

            const createCustomMarker = (latLng, className, iconText, color, popupText, labelText) => {
                try {

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

                    markersAdded++;
                    return marker;
                } catch (err) {
                    return null;
                }
            };

            // Add START marker
            if (startPoint && startPoint.lat && startPoint.lng) {
                const name = startPoint.name || startPoint.address || 'Starting Point';
                createCustomMarker(
                    [startPoint.lat, startPoint.lng],
                    'marker-start',
                    '🚀',
                    '#16a34a',
                    \`<strong>🚀 Starting Point</strong><br><b>\${name}</b>\`,
                    name
                );
            } else {
            }

            // Add STOP markers
            if (Array.isArray(stopPoints) && stopPoints.length > 0) {
                stopPoints.forEach((stop, index) => {
                    if (stop && stop.lat && stop.lng) {
                        const name = stop.name || stop.address || \`Stop \${index + 1}\`;
                        createCustomMarker(
                            [stop.lat, stop.lng],
                            'marker-stop',
                            (index + 1).toString(),
                            '#d97706',
                            \`<strong>🛑 Stop Point \${index + 1}</strong><br><b>\${name}</b>\`,
                            name
                        );
                    } else {
                    }
                });
            } else {
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


            if (markersAdded === 0) {
            }

        } catch (error) {
        }
    }

    window.addRouteMarkers = addRouteMarkers;
`;
