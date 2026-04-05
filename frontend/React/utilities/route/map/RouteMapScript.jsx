import {mapInitScript} from './scripts/mapInitScript';
import {userLocationScript} from './scripts/userLocationScript';
import {routeDisplayScript} from './scripts/routeDisplayScript';
import {markerScript} from './scripts/markerScript';
import {riderMarkersScript} from './scripts/riderMarkersScript';
import {compassScript} from './scripts/compassScript';
import {mainLoaderScript} from './scripts/mainLoaderScript';

export const createMapScript = () => {
  return (
    mapInitScript() +
    userLocationScript() +
    routeDisplayScript() +
    markerScript() +
    riderMarkersScript() +
    compassScript() +
    mainLoaderScript()
  );
};
