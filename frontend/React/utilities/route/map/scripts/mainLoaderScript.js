// mainLoaderScript.js
export const mainLoaderScript = () => `

    window.loadRouteData = function(routeData, startPoint, endPoint, stopPoints, userLocation) {
        const map = window.getMap();

        window.routeData     = routeData;
        window.startingPoint = startPoint;
        window.endingPoint   = endPoint;
        window.stopPoints    = stopPoints || [];

        if (!map) {
            initMap(startPoint);
            window.showError('Map not ready for route data');
            return;
        }

        // Display route polyline if route data is available
        if (routeData) {
            window.displayRoute(routeData);
        }

        // Always add markers regardless of whether a route polyline exists
        setTimeout(() => {
            window.addRouteMarkers();
        }, 200);

        if (userLocation) {
            window.updateUserLocation(userLocation);
        }
    };

 

    document.addEventListener('DOMContentLoaded', function () {
        initMap();
    });
`;
