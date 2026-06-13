// mainLoaderScript.js
export const mainLoaderScript = () => `
    window.loadRouteData = function(routeData, startPoint, endPoint, stopPoints, userLocation) {
        const map = window.getMap();
        
        window.routeData = routeData;
        window.startingPoint = startPoint;
        window.endingPoint = endPoint;
        window.stopPoints = stopPoints || [];

        if (!map) {
            initMap(startPoint);
            window.showError('Map not ready for route data');
            return;
        }

        // ✨ NEW: Try to display route, but don't fail if routeData is null
        let routeDisplayed = false;
        if (routeData) {
            routeDisplayed = window.displayRoute(routeData);
        } else {
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
        initMap();
    });
`;
