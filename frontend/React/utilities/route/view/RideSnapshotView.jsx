// utilities/RideSnapshotView.jsx
import React, {forwardRef, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {
  Polyline,
  Circle,
  Text as SvgText,
  Rect,
} from 'react-native-svg';

const W = 600;
// Height is now route-only — no stats bar section
const H = 340;
const PADDING = 44; // inner padding so labels don't clip

// GeoJSON coords are [lng, lat] — this normalizes everything to {lat, lng}
function normalizeCoord(c) {
  if (!c) return null;
  if (Array.isArray(c) && c.length >= 2) return {lng: c[0], lat: c[1]};
  if (c.lat != null && c.lng != null) return {lat: c.lat, lng: c.lng};
  return null;
}

function buildProjection(allCoords) {
  const valid = allCoords.map(normalizeCoord).filter(Boolean);
  if (valid.length < 2) return null;

  const lats = valid.map(p => p.lat);
  const lngs = valid.map(p => p.lng);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;

  const drawW = W - PADDING * 2;
  const drawH = H - PADDING * 2;

  // Preserve aspect ratio — don't stretch
  const scaleX = drawW / lngSpan;
  const scaleY = drawH / latSpan;
  const scale = Math.min(scaleX, scaleY);

  // Center the route inside the draw area
  const offX = (drawW - lngSpan * scale) / 2;
  const offY = (drawH - latSpan * scale) / 2;

  return coord => {
    const c = normalizeCoord(coord);
    if (!c) return null;
    return {
      x: Math.round(PADDING + offX + (c.lng - minLng) * scale),
      // lat increases upward, SVG y increases downward
      y: Math.round(PADDING + offY + (maxLat - c.lat) * scale),
    };
  };
}

function truncate(str, max = 14) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// Extract all [lng,lat] pairs from GeoJSON FeatureCollection
function extractGeoJSONCoords(routeData) {
  if (!routeData?.features) return [];
  return routeData.features.flatMap(f => f?.geometry?.coordinates ?? []);
}

const RideSnapshotView = forwardRef(
  (
    {
      startingPoint,
      endingPoint,
      stopPoints = [],
      routeData = null, // GeoJSON FeatureCollection from your API
      // distance, duration, stopCount props are intentionally removed —
      // the stats bar has been eliminated per design update.
      appName = 'LAAGAN',
    },
    ref,
  ) => {
    const {polylineStr, landmarks} = useMemo(() => {
      // ── 1. Extract route coords from GeoJSON ──────────────────────────
      const routeCoords = extractGeoJSONCoords(routeData);

      // ── 2. All points for projection bounds ───────────────────────────
      const landmarkPoints = [
        startingPoint,
        ...(stopPoints || []),
        endingPoint,
      ].filter(Boolean);

      const allPoints =
        routeCoords.length > 0
          ? [...routeCoords, ...landmarkPoints]
          : landmarkPoints;

      if (allPoints.length === 0)
        return {polylineStr: '', landmarks: []};

      const project = buildProjection(allPoints);
      if (!project) return {polylineStr: '', landmarks: []};

      // ── 3. Polyline string ────────────────────────────────────────────
      const drawPoints =
        routeCoords.length > 0
          ? routeCoords
          : [startingPoint, ...(stopPoints || []), endingPoint].filter(Boolean);

      const polylineStr = drawPoints
        .map(p => project(p))
        .filter(Boolean)
        .map(({x, y}) => `${x},${y}`)
        .join(' ');

      // ── 4. Landmark pins ──────────────────────────────────────────────
      const landmarks = [];

      if (startingPoint) {
        const pt = project(startingPoint);
        if (pt)
          landmarks.push({
            ...pt,
            color: '#16a34a',
            label: truncate(startingPoint.name || 'Start'),
            key: 'start',
          });
      }

      (stopPoints || []).forEach((stop, i) => {
        if (!stop) return;
        const pt = project(stop);
        if (pt)
          landmarks.push({
            ...pt,
            color: '#d97706',
            label: truncate(stop.name || `Stop ${i + 1}`),
            key: `stop-${i}`,
          });
      });

      if (endingPoint) {
        const pt = project(endingPoint);
        if (pt)
          landmarks.push({
            ...pt,
            color: '#dc2626',
            label: truncate(endingPoint.name || 'End'),
            key: 'end',
          });
      }

      return {polylineStr, landmarks};
    }, [startingPoint, endingPoint, stopPoints, routeData]);

    return (
      // `backgroundColor: 'transparent'` on the wrapper View ensures
      // react-native-view-shot captures nothing behind the SVG layer.
      // collapsable={false} is required on Android so the ref is a real
      // native view node that captureRef can target.
      <View ref={ref} style={styles.container} collapsable={false}>
        {/*
          No fill Rect here — the SVG itself has no background, so the
          captured PNG will be fully transparent wherever no route/pin is drawn.
          react-native-view-shot respects SVG transparency correctly when
          format='png' and result='data-uri'.
        */}
        <Svg
          width={W}
          height={H}
          // Explicit transparent viewBox background
          style={{backgroundColor: 'transparent'}}>

          {/* ── Route glow ── */}
          {polylineStr ? (
            <Polyline
              points={polylineStr}
              fill="none"
              stroke="#f97316"
              strokeWidth={14}
              strokeOpacity={0.18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* ── Route main line ── */}
          {polylineStr ? (
            <Polyline
              points={polylineStr}
              fill="none"
              stroke="#f97316"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* ── Landmark pins + pill labels ── */}
          {landmarks.map(({x, y, color, label, key}) => {
            const pillW = label.length * 7.2 + 16;
            // Flip label to left side if pin is too close to right edge
            const labelX = x + 12 + pillW > W - 8 ? x - pillW - 12 : x + 12;
            // Flip label below if pin is near top
            const labelY = y < 30 ? y + 12 : y - 10;

            return (
              <React.Fragment key={key}>
                {/* Glow ring */}
                <Circle cx={x} cy={y} r={14} fill={color} fillOpacity={0.18} />
                {/* Pin dot */}
                <Circle
                  cx={x}
                  cy={y}
                  r={7}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {/* Pill background */}
                <Rect
                  x={labelX}
                  y={labelY}
                  width={pillW}
                  height={20}
                  rx={10}
                  fill={color}
                />
                {/* Pill text */}
                <SvgText
                  x={labelX + pillW / 2}
                  y={labelY + 13.5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="700"
                  fill="#fff">
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* ── Branding pill (top-right, kept) ── */}
          <Rect
            x={W - 100}
            y={12}
            width={88}
            height={22}
            rx={11}
            fill="#f97316"
            fillOpacity={0.15}
          />
          <SvgText
            x={W - 56}
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
    width: W,
    height: H,
    // Render off-screen — the view is invisible to the user but
    // react-native-view-shot can still capture it.
    position: 'absolute',
    top: -9999,
    left: -9999,
    // opacity must stay 1 — react-native-view-shot will not capture
    // a view whose opacity is 0.
    backgroundColor: 'transparent',
  },
});

export default RideSnapshotView;