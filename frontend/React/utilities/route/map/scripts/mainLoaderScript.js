// mainLoaderScript.js
export const mainLoaderScript = () => `
    window.loadRouteData = function(routeData, startPoint, endPoint, stopPoints, userLocation) {
        const map = window.getMap();
        
        window.routeData = routeData;
        window.startingPoint = startPoint;
        window.endingPoint = endPoint;
        window.stopPoints = stopPoints || [];

        if (!map) {
            console.error('❌ Map not ready!');
            initMap(startPoint);
            window.showError('Map not ready for route data');
            return;
        }

        // ✨ NEW: Try to display route, but don't fail if routeData is null
        let routeDisplayed = false;
        if (routeData) {
            routeDisplayed = window.displayRoute(routeData);
        } else {
            console.warn('⚠️ No route data provided, skipping route display');
        }

        // Always add markers (start, end, stops) regardless of route availability
        setTimeout(() => {
            window.addRouteMarkers();
        }, 200);

        if (userLocation) {
            window.updateUserLocation(userLocation);
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM Content Loaded - Initializing map...');
        initMap();
    });
`;
