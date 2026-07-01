import React, {forwardRef, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Polyline,
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import {
  cardTokens as T,
  cardStyles as ss,
} from '../../../styles/screens/shareCard';

// ─── Formats ────────────────────────────────────────────────────────────────
// `story`    → classic 9:16 (Instagram/FB Stories)
// `feed`     → 1:1 square (IG/FB/X feed post)
// `portrait` → 4:5 vertical (best-performing IG feed ratio)
// mapSize        = side length of the centered focal map card (square)
// columnHeight   = height of the stats/graph two-column row
// graphHeight    = height available for the speed graph inside its column
const FORMATS = {
  story: {
    width: 1080,
    height: 1920,
    mapSize: 640,
    columnHeight: 460,
    graphHeight: 300,
  },
  feed: {
    width: 1080,
    height: 1080,
    mapSize: 460,
    columnHeight: 300,
    graphHeight: 220,
  },
  portrait: {
    width: 1080,
    height: 1350,
    mapSize: 520,
    columnHeight: 340,
    graphHeight: 250,
  },
};

// Read once at module load — safe because RN doesn't change screen size at runtime.
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// Scale factor that makes the card fit entirely within the device viewport.
// Android silently skips rendering views that extend past the viewport boundary,
// which causes the bottom half of a tall card to vanish in captures.
function computeRenderScale(format) {
  const {width, height} = FORMATS[format] ?? FORMATS.feed;
  return Math.min(SCREEN_W / width, SCREEN_H / height, 1);
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtDistance = km => {
  if (km == null) {return {value: '—', unit: ''};}

  return {
    value: km,
    unit: 'km',
  };
};
const fmtDuration = min => {
  if (min == null) return '—';
  const h = Math.floor(min / 60),
    m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtDate = iso => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};
const fmtSpeed = kph => (kph == null ? '—' : Number(kph).toFixed(1));

function extractSpeeds(segments) {
  if (!segments?.length) return [];
  return segments.map(s =>
    typeof s === 'number'
      ? s
      : s.speedKph ?? s.speed ?? s.avgSpeedKph ?? s.averageSpeedKph ?? 0,
  );
}

// ─── Speed graph (sized to fit inside a half-width column) ────────────────────
const SpeedGraph = ({segments, averageSpeedKph, width, height}) => {
  const graph = useMemo(() => {
    const speeds = extractSpeeds(segments);
    if (speeds.length < 2) return null;

    // Padding is intentionally compact — this graph now renders at roughly
    // half the card width (one column), not the full card width.
    const pad = {top: 20, right: 40, bottom: 34, left: 48};
    const drawW = Math.max(width - pad.left - pad.right, 10);
    const drawH = Math.max(height - pad.top - pad.bottom, 10);
    const bottom = pad.top + drawH;

    const minSpd = Math.min(...speeds);
    const maxSpd = Math.max(...speeds);
    const span = maxSpd - minSpd || 1;

    const pts = speeds.map((spd, i) => ({
      x: pad.left + (i / (speeds.length - 1)) * drawW,
      y: pad.top + drawH - ((spd - minSpd) / span) * drawH,
    }));

    const linePts = pts
      .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    // Closed path for gradient fill under the line
    const fillPath = [
      `M ${pts[0].x.toFixed(1)},${bottom}`,
      ...pts.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `L ${pts[pts.length - 1].x.toFixed(1)},${bottom}`,
      'Z',
    ].join(' ');

    const avgSpd =
      averageSpeedKph ?? speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const clampedAvg = Math.min(Math.max(avgSpd, minSpd), maxSpd);
    const avgY = pad.top + drawH - ((clampedAvg - minSpd) / span) * drawH;

    return {pts, linePts, fillPath, avgY, minSpd, maxSpd, pad, bottom, drawW};
  }, [segments, averageSpeedKph, width, height]);

  if (!graph) {
    return (
      <View
        style={{width, height, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={ss.mapPlaceholderText}>No speed data</Text>
      </View>
    );
  }

  const {pts, linePts, fillPath, avgY, minSpd, maxSpd, pad, bottom, drawW} =
    graph;

  return (
    // No background — SVG draws directly over the glass card behind it.
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={T.accent} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={T.accent} stopOpacity="0.02" />
        </SvgGradient>
      </Defs>

      {/* Gradient fill under line */}
      <Path d={fillPath} fill="url(#sg)" />

      {/* Average speed dashed guide */}
      <Line
        x1={pad.left}
        y1={avgY}
        x2={pad.left + drawW}
        y2={avgY}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={2}
        strokeDasharray="12,8"
      />

      {/* Main speed line */}
      <Polyline
        points={linePts}
        fill="none"
        stroke={T.accent}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start dot */}
      <Circle cx={pts[0].x} cy={pts[0].y} r={7} fill={T.accent} />
      {/* End dot */}
      <Circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r={7}
        fill={T.blue}
      />

      {/* Y-axis: max label */}
      <SvgText
        x={pad.left - 10}
        y={pad.top + 8}
        fill={T.textMuted}
        fontSize={16}
        textAnchor="end">
        {maxSpd.toFixed(0)}
      </SvgText>

      {/* Y-axis: min label */}
      <SvgText
        x={pad.left - 10}
        y={bottom}
        fill={T.textMuted}
        fontSize={16}
        textAnchor="end">
        {minSpd.toFixed(0)}
      </SvgText>

      {/* Avg label */}
      <SvgText
        x={pad.left + drawW + 10}
        y={avgY + 6}
        fill="rgba(255,255,255,0.32)"
        fontSize={14}
        textAnchor="start">
        avg
      </SvgText>

      {/* Unit label top-right */}
      <SvgText
        x={pad.left + drawW + 10}
        y={pad.top + 8}
        fill={T.textMuted}
        fontSize={14}
        textAnchor="start">
        kph
      </SvgText>
    </Svg>
  );
};

// ─── Stat row (left column) — accent bar + big value + label ──────────────────
const StatRow = ({label, value, unit, accent}) => (
  <View style={ss.statRow}>
    <View style={[ss.statAccentBar, accent && {backgroundColor: T.accent}]} />
    <View style={ss.statTextWrap}>
      <Text style={ss.statValue} numberOfLines={1}>
        {value}
        {unit ? <Text style={ss.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={ss.statLabel}>{label}</Text>
    </View>
  </View>
);

// ─── Card content — shared across photo & dark-mode backgrounds ───────────────
const CardContent = ({data, cfg}) => {
  const {
    ridesName = null,
    riderUsername = null,
    startTime = null,
    snapshotUrl = null,
    distanceMeters = null,
    durationMinutes = null,
    averageSpeedKph = null,
    speedSegments = [],
  } = data;

  const date = fmtDate(startTime);
  const dist = fmtDistance(distanceMeters);
  const dur = fmtDuration(durationMinutes);
  const hasGraph = extractSpeeds(speedSegments).length >= 2;

  const {width, mapSize, columnHeight, graphHeight} = cfg;
  const sidePad = 64;
  const colGap = 28;
  const columnWidth = (width - sidePad * 2 - colGap) / 2;
  const graphInnerWidth = columnWidth - 32; // minus the graph card's own horizontal padding

  return (
    <View style={ss.inner}>
      {/* ── Header: rider · date ── */}
      <View style={ss.header}>
        {riderUsername || date ? (
          <View style={ss.headerPill}>
            <Text style={ss.headerText}>
              {riderUsername ? (
                <Text style={ss.headerRider}>{riderUsername}</Text>
              ) : null}
              {riderUsername && date ? '  ·  ' : ''}
              {date}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Centered focal point: route snapshot + ride name ── */}
      <View style={ss.focalWrapper}>
        <View style={[ss.mapCard, {width: mapSize, height: mapSize}]}>
          {snapshotUrl ? (
            <Image
              source={{uri: snapshotUrl}}
              style={ss.mapImage}
              resizeMode="cover"
            />
          ) : (
            <View style={ss.mapPlaceholder}>
              <Text style={ss.mapPlaceholderText}>Route map unavailable</Text>
            </View>
          )}
        </View>

        {ridesName ? (
          <Text style={ss.rideName} numberOfLines={2}>
            {ridesName}
          </Text>
        ) : null}
      </View>

      {/* ── Two-column row: stats (left) · graph (right) ── */}
      <View style={[ss.columnsRow, {height: columnHeight}]}>
        <View style={[ss.statsColumn, {width: columnWidth}]}>
          <StatRow
            label="Distance"
            value={dist.value}
            unit="km"
            accent
          />
          <View style={ss.statDivider} />
          <StatRow label="Duration" value={dur} />
          <View style={ss.statDivider} />
          <StatRow
            label="Avg Speed"
            value={fmtSpeed(averageSpeedKph)}
            unit="kph"
          />
        </View>

        <View style={[ss.graphColumn, {width: columnWidth}]}>
          <Text style={ss.graphLabel}>SPEED</Text>
          {hasGraph ? (
            <SpeedGraph
              segments={speedSegments}
              averageSpeedKph={averageSpeedKph}
              width={graphInnerWidth}
              height={graphHeight}
            />
          ) : (
            <View style={[ss.graphEmpty, {height: graphHeight}]}>
              <Text style={ss.mapPlaceholderText}>No speed data</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Footer branding ── */}
      <View style={ss.footer}>
        <Text style={ss.slogan}>Shared via RideSync</Text>
      </View>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const RideShareCard = forwardRef(function RideShareCard(
  {data = {}, format = 'feed', photoUri = null, AppLogo = null},
  ref,
) {
  const cfg = FORMATS[format] ?? FORMATS.feed;
  const {width, height} = cfg;

  const renderScale = computeRenderScale(format);
  const scaledW = Math.ceil(width * renderScale);
  const scaledH = Math.ceil(height * renderScale);

  // Outer: defines the on-screen footprint (invisible, no touch events).
  const outerStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: scaledW,
    height: scaledH,
    opacity: 0,
    overflow: 'visible', // don't clip the inner view's layout area
  };

  // Inner (ref target): full card dimensions + transform that maps the
  // top-left corner to (0,0) in the outer container after scaling.
  // RN applies transform array in order: translate → scale.
  const innerStyle = {
    width,
    height,
    transform: [
      {translateX: -(width * (1 - renderScale)) / 2},
      {translateY: -(height * (1 - renderScale)) / 2},
      {scale: renderScale},
    ],
  };

  return (
    <View style={outerStyle} pointerEvents="none">
      <View ref={ref} style={innerStyle} collapsable={false}>
        {/* ── Full-bleed background layer ── */}
        {photoUri ? (
          <>
            <ImageBackground
              source={{uri: photoUri}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            {/* Tri-stop tint: darker at top (header) and bottom (stats/graph),
                lighter in the middle so the focal map/photo still reads through. */}
            <LinearGradient
              colors={[
                'rgba(6,8,12,0.60)',
                'rgba(6,8,12,0.30)',
                'rgba(6,8,12,0.80)',
              ]}
              locations={[0, 0.42, 1]}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <LinearGradient
            colors={[T.bgDeep, '#161a24', T.bgDeep]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
          />
        )}

        {AppLogo ? (
          <View style={ss.logoBadge}>
            <Image
              source={typeof AppLogo === 'string' ? {uri: AppLogo} : AppLogo}
              style={ss.logoImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        <CardContent data={data} cfg={cfg} />
      </View>
    </View>
  );
});

export default RideShareCard;

// ─── Capture helper ───────────────────────────────────────────────────────────
// `format` must match what was passed to <RideShareCard> so we can derive the
// same renderScale used when laying out the inner view, and compensate with
// pixelRatio so the output image is still the full target resolution
// regardless of screen size.
export async function captureShareCard(cardRef, format = 'feed') {
  if (!cardRef?.current) {
    console.warn('[captureShareCard] ref not attached');
    return null;
  }
  try {
    const {captureRef} = require('react-native-view-shot');
    // The inner view renders at full card dp dimensions but is visually scaled
    // down by renderScale. pixelRatio = 1/renderScale restores the output to
    // the original target pixel count (e.g. 1080×1080 px for feed).
    const renderScale = computeRenderScale(format);
    return await captureRef(cardRef, {
      format: 'png',
      quality: 0.95,
      result: 'data-uri',
      pixelRatio: 1 / renderScale,
    });
  } catch (e) {
    console.warn('[captureShareCard] failed:', e);
    return null;
  }
}
