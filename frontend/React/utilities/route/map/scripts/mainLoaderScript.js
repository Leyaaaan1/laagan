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

    // ── Snapshot capture ─────────────────────────────────────────────────────
    // Renders the map (tile canvases + SVG overlays) into a single <canvas>,
    // then posts the base64 data-URI back to React Native.
    // Called by RouteMapView via injectJavaScript after a settle delay.
    window.captureMapSnapshot = async function () {
        try {
            const mapEl = document.getElementById('map');
            if (!mapEl) throw new Error('Map element not found');

            const mapRect = mapEl.getBoundingClientRect();
            const w = mapEl.offsetWidth;
            const h = mapEl.offsetHeight;

            if (!w || !h) throw new Error('Map has zero dimensions');

            const out = document.createElement('canvas');
            out.width  = w;
            out.height = h;
            const ctx = out.getContext('2d');

            // ── 1. Tile canvases (background map imagery) ──────────────────
            // Leaflet paints each tile layer into its own <canvas> element.
            const canvases = Array.from(mapEl.querySelectorAll('canvas'));
            for (const c of canvases) {
                try {
                    const r = c.getBoundingClientRect();
                    ctx.drawImage(c, r.left - mapRect.left, r.top - mapRect.top);
                } catch (_) {
                    // Cross-origin tile canvas — skip silently
                }
            }

            // ── 2. SVG overlays (polyline route + circleMarker stops) ──────
            // Leaflet renders all vector layers (polylines, circleMarkers,
            // tooltips) as <svg> elements sitting inside #map.
            const svgs = Array.from(mapEl.querySelectorAll('svg'));
            for (const svg of svgs) {
                try {
                    const r     = svg.getBoundingClientRect();
                    const clone = svg.cloneNode(true);
                    clone.setAttribute('width',  r.width);
                    clone.setAttribute('height', r.height);
                    clone.setAttribute('xmlns',  'http://www.w3.org/2000/svg');

                    const svgStr = new XMLSerializer().serializeToString(clone);
                    const uri    = 'data:image/svg+xml;charset=utf-8,' +
                                   encodeURIComponent(svgStr);

                    await new Promise(res => {
                        const img  = new Image();
                        img.onload = () => {
                            ctx.drawImage(
                                img,
                                r.left - mapRect.left,
                                r.top  - mapRect.top,
                                r.width,
                                r.height
                            );
                            res();
                        };
                        img.onerror = res; // never block the chain on error
                        img.src = uri;
                    });
                } catch (_) {}
            }

            const dataUri = out.toDataURL('image/png', 0.88);

            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'snapshotCaptured',
                dataUri,
            }));

        } catch (e) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'snapshotError',
                error: e.message,
            }));
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMap();
    });
`;
