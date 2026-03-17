import routeMapStyles from './RouteMapStyles.js.jsx';
import { createMapScript } from '../RouteMapScript.jsx';

export const createMapHTML = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>${routeMapStyles}</style>
    </head>
    <body>
        <div id="map"></div>
        <div id="compass-container">
            <button id="compass-btn" onclick="handleCompassPress()" title="Orient to next point">
                <div id="compass-needle">&#9650;</div>
            </button>
            <span id="compass-label">N</span>
        </div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>${createMapScript()}</script>
    </body>
    </html>
  `;
};