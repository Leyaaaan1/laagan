// RoutePolygonSnapshot.jsx
import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText, Rect } from 'react-native-svg';

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

// Normalizes any shape the app produces into [{lat, lng}, ...]:
//   - JSON string (reroute cache stores it this way)
//   - GeoJSON FeatureCollection (LineString / MultiLineString features)
//   - { coordinates: [...] } wrapper
//   - Plain [[lng,lat], ...] or [{lat,lng}, ...] array
const normalizeRouteCoords = (raw, sourceLabel = 'route') => {
  if (__DEV__) {
    console.log('[RPS] normalizeRouteCoords RAW:', sourceLabel, JSON.stringify(raw)?.slice(0, 300));
  }
  if (!raw) {return [];}

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      if (__DEV__) {console.warn(`[RoutePolygonSnapshot] Failed to parse ${sourceLabel}:`, e.message);}
      return [];
    }
  }

  if (!raw || typeof raw !== 'object') {return [];}

  // routeDataForMap shape: { features, coordinates, routeCoordinates: string }
  // Try the string first — it's the full GeoJSON, highest fidelity.
  if (raw.routeCoordinates && typeof raw.routeCoordinates === 'string') {
    const fromString = normalizeRouteCoords(raw.routeCoordinates, `${sourceLabel}.routeCoordinates`);
    if (fromString.length >= 2) {return fromString;}
  }

  // GeoJSON FeatureCollection — extract from every feature that has coordinate arrays.
  // NO geometry type filter: works for LineString, MultiLineString, or anything else
  // your convertToGeoJson helper produces.
  if (Array.isArray(raw.features) && raw.features.length > 0) {
    const lineCoords = raw.features.flatMap(f => {
      const geom = f?.geometry;
      if (!geom?.coordinates || !Array.isArray(geom.coordinates)) {return [];}
      // MultiLineString: one level of nesting to flatten
      if (geom.type === 'MultiLineString') {
        return geom.coordinates.flat(1);
      }
      // LineString or anything else — only include if coords are [number,number] pairs
      if (Array.isArray(geom.coordinates[0])) {
        return geom.coordinates;
      }
      return []; // Point geometry (single pair) — skip
    });

    if (lineCoords.length >= 2) {
      if (__DEV__) {console.log(`[RoutePolygonSnapshot] ${sourceLabel} → ${lineCoords.length} pts from features`);}
      return lineCoords.map(c => ({ lat: c[1], lng: c[0] }));
    }
    if (__DEV__) {console.warn(`[RoutePolygonSnapshot] ${sourceLabel} features yielded 0 coordinate pairs`);}
  }

  // Plain array: [[lng,lat],...] or [{lat,lng},...]
  const coords = Array.isArray(raw.coordinates)
    ? raw.coordinates
    : Array.isArray(raw)
      ? raw
      : null;

  if (coords && coords.length >= 2) {
    return coords
      .map(c => {
        if (Array.isArray(c) && c.length >= 2) {return { lat: c[1], lng: c[0] };}
        if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {return c;}
        return null;
      })
      .filter(Boolean);
  }

  if (__DEV__) {console.warn(`[RoutePolygonSnapshot] ${sourceLabel} — no usable coords found`);}
  return [];
};

// ── CHANGED ───────────────────────────────────────────────────────────────
// No longer priority-picks one polygon — resolves BOTH independently so the
// snapshot can render the fixed route and the reroute at the same time.
// `routeCoordinates` (legacy single-prop) only fills in for the fixed route
// when `fixedRoutePolygon` itself wasn't provided, for back-compat.
const resolveRoutePoints = ({
  reroutePolygon,
  fixedRoutePolygon,
  routeCoordinates,
  reroutePolygons,
}) => {
  if (__DEV__) {
    console.log('[RoutePolygonSnapshot] resolveRoutePoints input:', {
      reroutePolygon: typeof reroutePolygon,
      fixedRoutePolygon: JSON.stringify(fixedRoutePolygon)?.slice(0, 200),
      routeCoordinates: typeof routeCoordinates,
    });
  }

  const reroutePoints = normalizeRouteCoords(reroutePolygon, 'reroutePolygon');
  if (__DEV__) {
    console.log('[RoutePolygonSnapshot] reroute points:', reroutePoints.length);
  }

  let fixedPoints = normalizeRouteCoords(
    fixedRoutePolygon,
    'fixedRoutePolygon',
  );
  if (fixedPoints.length < 2) {
    // back-compat fallback only — doesn't override a real fixedRoutePolygon
    fixedPoints = normalizeRouteCoords(routeCoordinates, 'routeCoordinates');
  }
  if (__DEV__) {
    console.log('[RoutePolygonSnapshot] fixed points:', fixedPoints.length);
  }
  const historyPointGroups = (reroutePolygons || [])
    .map((entry, i) => normalizeRouteCoords(entry, `reroutePolygons[${i}]`))
    .filter(pts => pts.length >= 2);


  return {reroutePoints, fixedPoints, historyPointGroups};
};

function truncate(str, max = 14) {
  if (!str) {return '';}
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

const RoutePolygonSnapshot = forwardRef(
  (
    {
      reroutePolygon = null,
      fixedRoutePolygon = null,
      routeCoordinates = null,
      reroutePolygons = [],
      startingPoint,
      endingPoint,
      stopPoints = [],
      appName = 'LAAGAN',
      username = '',
    },
    ref,
  ) => {
    const {reroutePoints, fixedPoints, historyPointGroups} = resolveRoutePoints(
      {
        reroutePolygon,
        fixedRoutePolygon,
        routeCoordinates,
        reroutePolygons,
      },
    );

    if (__DEV__ && reroutePoints.length === 0 && fixedPoints.length === 0) {
      console.warn(
        '[RoutePolygonSnapshot] Both polygons normalized to 0 points.',
        {
          reroutePolygon,
          fixedRoutePolygon,
          routeCoordinates,
        },
      );
    }

    // ── Pre-filter each group independently ─────────────────────────────────
    const isValidPt = p =>
      p && typeof p.lat === 'number' && typeof p.lng === 'number';

    const validFixed = fixedPoints.filter(isValidPt);
    const validReroute = reroutePoints.filter(isValidPt);

    const landmarkDefs = [
      startingPoint
        ? {
            ...startingPoint,
            _key: 'start',
            _color: '#16a34a',
            _label: truncate(
              startingPoint.name || startingPoint.address || 'Start',
            ),
          }
        : null,
      ...stopPoints.map((sp, i) =>
        sp
          ? {
              ...sp,
              _key: `stop-${i}`,
              _color: '#d97706',
              _label: truncate(sp.name || sp.address || `Stop ${i + 1}`),
            }
          : null,
      ),
      endingPoint
        ? {
            ...endingPoint,
            _key: 'end',
            _color: '#dc2626',
            _label: truncate(endingPoint.name || endingPoint.address || 'End'),
          }
        : null,
    ].filter(isValidPt);
    const validHistoryGroups = historyPointGroups.map(pts =>
      pts.filter(isValidPt),
    );

    const allPoints = [
      ...validFixed,
      ...validReroute,
      ...validHistoryGroups.flat(), // ← new
      ...landmarkDefs,
    ];

    if (allPoints.length === 0) {
      return (
        <View ref={ref} style={styles.container} collapsable={false}>
          <Svg width={WIDTH} height={HEIGHT}>
            <Rect width={WIDTH} height={HEIGHT} fill="transparent" />
            <SvgText
              x={WIDTH / 2}
              y={HEIGHT / 2}
              fontSize="14"
              fill="#64748b"
              textAnchor="middle">
              No route data available
            </SvgText>
          </Svg>
        </View>
      );
    }

    const projected = projectPoints(allPoints, WIDTH, HEIGHT, PADDING);

    let cursor = 0;
    const projectedFixed = validFixed.length
      ? projected.slice(cursor, (cursor += validFixed.length))
      : [];
    const projectedReroute = validReroute.length
      ? projected.slice(cursor, (cursor += validReroute.length))
      : [];
    const projectedHistoryGroups = validHistoryGroups.map(group =>
      group.length ? projected.slice(cursor, (cursor += group.length)) : [],
    );
    const projectedLandmarks = projected.slice(cursor);

    const fixedPolyStr = projectedFixed.map(p => `${p.x},${p.y}`).join(' ');
    const reroutePolyStr = projectedReroute.map(p => `${p.x},${p.y}`).join(' ');

    const rerouteOrigin =
      projectedReroute.length > 0 ? projectedReroute[0] : null;

    const pins = landmarkDefs
      .map((def, i) => ({
        ...projectedLandmarks[i],
        color: def._color,
        label: def._label,
        key: def._key,
      }))
      .filter(p => p.x != null);

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        <Svg width={WIDTH} height={HEIGHT}>
          <Rect width={WIDTH} height={HEIGHT} fill="transparent" />

          {projectedHistoryGroups.map((pts, i) => {
            if (pts.length === 0) return null;
            const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ');
            const opacity =
              0.15 + (0.35 * (i + 1)) / projectedHistoryGroups.length;
            return (
              <Polyline
                key={`history-${i}`}
                points={polyStr}
                fill="none"
                stroke="#f97316"
                strokeWidth={2.5}
                strokeOpacity={opacity}
                strokeDasharray="4,5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* ── Fixed planned route — solid blue ── */}
          {fixedPolyStr.length > 0 && (
            <Polyline
              points={fixedPolyStr}
              fill="none"
              stroke="#1e40af"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* ── Rider reroute — dashed orange on top ── */}
          {reroutePolyStr.length > 0 && (
            <Polyline
              points={reroutePolyStr}
              fill="none"
              stroke="#f97316"
              strokeWidth={4}
              strokeDasharray="10,6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* ── Reroute origin dot ── */}
          {rerouteOrigin && (
            <React.Fragment>
              <Circle
                cx={rerouteOrigin.x}
                cy={rerouteOrigin.y}
                r={14}
                fill="#f97316"
                fillOpacity={0.2}
              />
              <Circle
                cx={rerouteOrigin.x}
                cy={rerouteOrigin.y}
                r={7}
                fill="#f97316"
                stroke="#fff"
                strokeWidth={2.5}
              />
              {(() => {
                const label = truncate(username || 'Me', 10);
                const pillW = label.length * 5.6 + 12;
                const lx =
                  rerouteOrigin.x + 10 + pillW > WIDTH - 6
                    ? rerouteOrigin.x - pillW - 10
                    : rerouteOrigin.x + 10;
                const ly =
                  rerouteOrigin.y < PADDING
                    ? rerouteOrigin.y + 18
                    : rerouteOrigin.y - 14;
                return (
                  <React.Fragment>
                    <Rect
                      x={lx}
                      y={ly}
                      width={pillW}
                      height={16}
                      rx={8}
                      fill="#f97316"
                    />
                    <SvgText
                      x={lx + pillW / 2}
                      y={ly + 11.5}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontWeight="700"
                      fill="#fff">
                      {label}
                    </SvgText>
                  </React.Fragment>
                );
              })()}
            </React.Fragment>
          )}

          {/* ── Landmark pins ── */}
          {pins.map(({x, y, color, label, key}) => {
            const isStop = key.startsWith('stop');
            const pillW = label.length * 5.6 + 12;
            const lx = x + 10 + pillW > WIDTH - 6 ? x - pillW - 10 : x + 10;
            const ly = y < PADDING ? y + 18 : y - 14;
            return (
              <React.Fragment key={key}>
                <Circle
                  cx={x}
                  cy={y}
                  r={isStop ? 9 : 10}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={isStop ? 2.5 : 3}
                />
                <Rect
                  x={lx}
                  y={ly}
                  width={pillW}
                  height={16}
                  rx={8}
                  fill={color}
                />
                <SvgText
                  x={lx + pillW / 2}
                  y={ly + 11.5}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight="700"
                  fill="#fff">
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* ── Branding pill (top-right) — ported from RideSnapshotView ── */}
          <Rect
            x={WIDTH - 100}
            y={12}
            width={88}
            height={22}
            rx={11}
            fill="#f97316"
            fillOpacity={0.15}
          />
          <SvgText
            x={WIDTH - 56}
            y={27}
            textAnchor="middle"
            fontSize={11}
            fontWeight="700"
            fill="#f97316"
            letterSpacing={0.5}>
            {appName}
          </SvgText>
        </Svg>
      </View>
    );
  },
);
const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    position: 'absolute',
    top: -9999,
    left: -9999,
    backgroundColor: 'transparent',
  },
});

export default RoutePolygonSnapshot;

