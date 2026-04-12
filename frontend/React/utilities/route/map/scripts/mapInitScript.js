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
    window.getMap = () => map;
`;
