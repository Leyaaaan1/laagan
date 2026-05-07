import routeMapStyles from './RouteMapStyles.js.jsx';
import leafletCSS from '../assets/leaflet/leafletCSS.js';
import leaflet from '../assets/leaflet/leaflet.js';
import {createMapScript} from '../map/RouteMapScript';

export const createMapHTML = () => {
  return `    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>${leafletCSS}</style>
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
        <script>${leaflet}</script>
        <script>${createMapScript()}</script>
    </body>
    </html>
  `;
};
