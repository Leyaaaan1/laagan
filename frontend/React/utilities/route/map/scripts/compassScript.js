// compassScript.js
export const compassScript = () => `
    let compassTargetIndex = -1;
    let compassTargets = []; // Array to hold both route points and rider markers

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
        const map = window.getMap();
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
        const map = window.getMap();
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

    // ✅ NEW: Build compass targets including both route points AND rider markers
    function buildCompassTargets() {
        const points = [
            { type: 'start', point: window.startingPoint, label: 'STR' },
        ];

        // Add stop points with their index
        if (Array.isArray(window.stopPoints) && window.stopPoints.length > 0) {
            window.stopPoints.forEach((stop, index) => {
                points.push({
                    type: 'stop',
                    point: stop,
                    label: \`S\${index + 1}\`
                });
            });
        }

        // Add ending point
        points.push({ type: 'end', point: window.endingPoint, label: 'END' });

        // ✅ NEW: Add rider markers
        if (window.riderMarkersData && Object.keys(window.riderMarkersData).length > 0) {
            Object.entries(window.riderMarkersData).forEach(([riderId, location]) => {
                if (location.latitude && location.longitude) {
                    points.push({
                        type: 'rider',
                        point: {
                            lat: location.latitude,
                            lng: location.longitude,
                            name: riderId
                        },
                        label: riderId.substring(0, 3).toUpperCase() // First 3 letters
                    });
                }
            });
        }

        compassTargets = points.filter(p => p.point && p.point.lat && p.point.lng);
        console.log(\`🧭 Compass targets updated: \${compassTargets.length} points\`, 
            compassTargets.map(t => t.label).join(' → '));
        
        return compassTargets;
    }

    function handleCompassPress() {
        // ✅ UPDATED: Rebuild targets each time (in case riders changed)
        const targets = buildCompassTargets();

        if (targets.length === 0) {
            console.warn('No compass targets available (routes or riders)');
            return;
        }

        // Reset cycle if we reached the end
        if (compassTargetIndex >= targets.length - 1) {
            compassTargetIndex = -1;
            resetMapOrientation();
            return;
        }

        // Move to next target
        compassTargetIndex++;
        const targetData = targets[compassTargetIndex];
        const target = targetData.point;
        
        console.log(\`🧭 Navigating to: \${targetData.label} (Type: \${targetData.type})\`);
        
        orientMapToPoint(target);

        // ✅ UPDATED: Set label based on target type
        const label = document.getElementById('compass-label');
        if (label) {
            if (targetData.type === 'rider') {
                label.textContent = \`🏍 \${targetData.label}\`;
            } else {
                label.textContent = targetData.label;
            }
        }
    }

    // ✅ NEW: Function to notify compass when rider markers change
    function updateCompassRiderMarkers(riderMarkers) {
        window.riderMarkersData = riderMarkers;
        console.log('🧭 Compass rider markers updated');
        // Reset index so next compass press rebuilds the target list
        compassTargetIndex = -1;
    }

    window.orientMapToPoint      = orientMapToPoint;
    window.resetMapOrientation   = resetMapOrientation;
    window.handleCompassPress    = handleCompassPress;
    window.updateCompassRiderMarkers = updateCompassRiderMarkers;
`;
