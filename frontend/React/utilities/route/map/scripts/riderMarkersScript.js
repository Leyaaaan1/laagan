export const riderMarkersScript = () => `
    let riderMarkerInstances = {};

    function updateRiderMarkers(riderMarkers, currentUsername) {
        try {
            console.log('=== UPDATING RIDER MARKERS ===');
            console.log('Riders to display:', Object.keys(riderMarkers));
            
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
                    
                    const markerColor = isCurrentUser ? '#FF5722' : '#2196F3';
                    const markerClass = isCurrentUser ? 'rider-marker-self' : 'rider-marker-other';
                    const iconSymbol = isCurrentUser ? '🏍' : '🚲';

                    // If marker already exists, just move it
                    if (riderMarkerInstances[riderId]) {
                        const existingMarker = riderMarkerInstances[riderId];
                        
                        // Update position
                        existingMarker.setLatLng(latLng);
                        
                        // Update popup content without recreating the icon
                        const popupText = \`
                            <div class="route-popup" style="border-color: \${markerColor}; border-left: 4px solid \${markerColor};">
                                <strong>\${isCurrentUser ? '🏍 You' : '🚲 ' + riderId}</strong><br>
                                <b>Location:</b> \${locationName || 'Unknown'}<br>
                                <b>Distance:</b> \${Math.round(distanceMeters || 0)}m away<br>
                                <small style="color: #666; margin-top: 4px;">Live location</small>
                            </div>
                        \`;
                        existingMarker.setPopupContent(popupText);
                        
                        console.log(\`✓ Rider marker moved: \${riderId} to [\${latitude}, \${longitude}]\`);
                    } else {
                        // Create new marker
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

                        // Store the marker instance
                        riderMarkerInstances[riderId] = marker;
                        
                        console.log(\`✓ Rider marker created: \${riderId} at [\${latitude}, \${longitude}]\`);
                    }
                } catch (err) {
                    console.error(\`Error updating rider marker for \${riderId}:\`, err);
                }
            });

            // Remove riders that are no longer in the list
            Object.keys(riderMarkerInstances).forEach(riderId => {
                if (!riderMarkers[riderId]) {
                    const marker = riderMarkerInstances[riderId];
                    riderMarkersGroup.removeLayer(marker);
                    delete riderMarkerInstances[riderId];
                    console.log(\`✓ Rider marker removed: \${riderId}\`);
                }
            });

            console.log(\`=== RIDER MARKERS UPDATE COMPLETE ===\`);
        } catch (error) {
            console.error('Error updating rider markers:', error);
        }
    }

    window.updateRiderMarkers = updateRiderMarkers;
`;
