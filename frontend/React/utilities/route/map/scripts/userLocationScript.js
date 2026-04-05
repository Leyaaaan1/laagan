// userLocationScript.js
export const userLocationScript = () => `
    function updateUserLocation(location) {
        try {
            if (!location || !location.lat || !location.lng) {
                console.log('Invalid user location data');
                return;
            }

            const latLng = [location.lat, location.lng];
            const accuracy = location.accuracy || 50;
            const map = window.getMap();

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

    window.updateUserLocation = updateUserLocation;
`;
