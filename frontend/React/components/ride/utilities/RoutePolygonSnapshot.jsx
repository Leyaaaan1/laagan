// RoutePolygonSnapshot.jsx
import React from 'react';
import Svg, {Polyline, Circle, Text as SvgText, Rect} from 'react-native-svg';

const WIDTH = 400;
const HEIGHT = 400;
const PADDING = 30;

// Projects lat/lng points into SVG x/y space based on bounding box
const projectPoints = (points, width, height, padding) => {
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.0001;
  const lngRange = maxLng - minLng || 0.0001;

  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  return points.map(p => ({
    ...p,
    x: padding + ((p.lng - minLng) / lngRange) * usableW,
    // Flip Y — lat increases northward, SVG y increases downward
    y: padding + (1 - (p.lat - minLat) / latRange) * usableH,
  }));
};

/**
 * RoutePolygonSnapshot
 *
 * Pure route visualization — polyline + start/end/stop markers only.
 * No map tiles, no WebView. Render this off-screen and capture with
 * captureRideSnapshot (react-native-view-shot).
 *
 * routeCoordinates: array of {lat, lng} OR [lng, lat] arrays (GeoJSON) OR
 *                    GeoJSON FeatureCollection — pass the raw cached data,
 *                    normalization happens internally.
 */
const RoutePolygonSnapshot = ({
  routeCoordinates,
  startingPoint,
  endingPoint,
  stopPoints = [],
}) => {
  // ── Normalize route coordinates to [{lat, lng}] ──
  const normalizeRouteCoords = raw => {
    if (!raw) return [];

    // GeoJSON FeatureCollection
    if (raw.type === 'FeatureCollection' && raw.features) {
      const lineFeature = raw.features.find(
        f => f.geometry?.type === 'LineString',
      );
      if (lineFeature) {
        return lineFeature.geometry.coordinates.map(c => ({
          lat: c[1],
          lng: c[0],
        }));
      }
      return [];
    }

    // { coordinates: [...] } wrapper
    const coords = raw.coordinates || raw;
    if (!Array.isArray(coords)) return [];

    return coords
      .map(c => {
        if (Array.isArray(c)) {
          // GeoJSON order [lng, lat]
          return {lat: c[1], lng: c[0]};
        }
        // Already {lat, lng}
        if (c.lat !== undefined && c.lng !== undefined) return c;
        return null;
      })
      .filter(Boolean);
  };

  const routePoints = normalizeRouteCoords(routeCoordinates);

  // ── Collect all points for bounding box (route + markers) ──
  const allPoints = [
    ...routePoints,
    ...(startingPoint ? [startingPoint] : []),
    ...(endingPoint ? [endingPoint] : []),
    ...stopPoints,
  ].filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number');

  if (allPoints.length === 0) {
    return (
      <Svg width={WIDTH} height={HEIGHT}>
        <Rect width={WIDTH} height={HEIGHT} fill="#f1f5f9" />
        <SvgText
          x={WIDTH / 2}
          y={HEIGHT / 2}
          fontSize="14"
          fill="#64748b"
          textAnchor="middle">
          No route data available
        </SvgText>
      </Svg>
    );
  }

  const projected = projectPoints(allPoints, WIDTH, HEIGHT, PADDING);

  // Re-split projected points back into their groups, in original order
  let cursor = 0;
  const projectedRoute = routePoints.length
    ? projected.slice(cursor, (cursor += routePoints.length))
    : [];
  const projectedStart = startingPoint ? projected[cursor++] : null;
  const projectedEnd = endingPoint ? projected[cursor++] : null;
  const projectedStops = stopPoints.length
    ? projected.slice(cursor, cursor + stopPoints.length)
    : [];

  const polylinePoints = projectedRoute.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      <Rect width={WIDTH} height={HEIGHT} fill="#f8fafc" rx={12} />

      {/* Route polyline */}
      {polylinePoints.length > 0 && (
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#1e40af"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Stop points */}
      {projectedStops.map((p, i) => (
        <Circle
          key={`stop-${i}`}
          cx={p.x}
          cy={p.y}
          r={9}
          fill="#d97706"
          stroke="#fff"
          strokeWidth={2.5}
        />
      ))}

      {/* Start point */}
      {projectedStart && (
        <Circle
          cx={projectedStart.x}
          cy={projectedStart.y}
          r={10}
          fill="#16a34a"
          stroke="#fff"
          strokeWidth={3}
        />
      )}

      {/* End point */}
      {projectedEnd && (
        <Circle
          cx={projectedEnd.x}
          cy={projectedEnd.y}
          r={10}
          fill="#dc2626"
          stroke="#fff"
          strokeWidth={3}
        />
      )}
    </Svg>
  );
};

export default RoutePolygonSnapshot;
