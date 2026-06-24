import React, {forwardRef, useMemo} from 'react';
import {View, Text, Image, ImageBackground, StyleSheet, Dimensions} from 'react-native';
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

// ─── Centralized styles (card's own brand — see shareCard.styles.js) ──────────
import {cardTokens as T, cardStyles as ss} from '../../../styles/screens/shareCard';

const FORMATS = {
  story: {width: 1080, height: 1920, mapHeight: 520, graphHeight: 280},
  feed: {width: 1080, height: 1080, mapHeight: 300, graphHeight: 200},
};

// Read once at module load — safe because RN doesn't change screen size at runtime.
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// Scale factor that makes the card fit entirely within the device viewport.
// Android silently skips rendering views that extend past the viewport boundary,
// which causes the bottom half of a 1920-dp story card to vanish in captures.
function computeRenderScale(format) {
  const {width, height} = FORMATS[format] ?? FORMATS.story;
  return Math.min(SCREEN_W / width, SCREEN_H / height, 1);
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtDistance = km => {
  if (km == null) return {value: '—', unit: ''};
  return {value: km.toFixed(2), unit: 'km'};
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

const SpeedGraph = ({segments, averageSpeedKph, width, height}) => {
  const graph = useMemo(() => {
    const speeds = extractSpeeds(segments);
    if (speeds.length < 2) return null;

    const pad = {top: 28, right: 72, bottom: 52, left: 80};
    const drawW = width - pad.left - pad.right;
    const drawH = height - pad.top - pad.bottom;
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

    return {
      pts,
      linePts,
      fillPath,
      avgY,
      minSpd,
      maxSpd,
      avgSpd,
      pad,
      bottom,
      drawW,
    };
  }, [segments, averageSpeedKph, width, height]);

  if (!graph) {
    return (
      <View
        style={{width, height, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: T.textMuted, fontSize: 28}}>No speed data</Text>
      </View>
    );
  }

  const {pts, linePts, fillPath, avgY, minSpd, maxSpd, pad, bottom, drawW} =
    graph;

  return (
    // No background — SVG draws directly over whatever is behind it
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
        strokeWidth={2.5}
        strokeDasharray="16,10"
      />

      {/* Main speed line */}
      <Polyline
        points={linePts}
        fill="none"
        stroke={T.accent}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start dot */}
      <Circle cx={pts[0].x} cy={pts[0].y} r={10} fill={T.accent} />
      {/* End dot */}
      <Circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r={10}
        fill={T.blue}
      />

      {/* Y-axis: max label */}
      <SvgText
        x={pad.left - 14}
        y={pad.top + 10}
        fill={T.textMuted}
        fontSize={22}
        textAnchor="end">
        {maxSpd.toFixed(0)}
      </SvgText>

      {/* Y-axis: min label */}
      <SvgText
        x={pad.left - 14}
        y={bottom}
        fill={T.textMuted}
        fontSize={22}
        textAnchor="end">
        {minSpd.toFixed(0)}
      </SvgText>

      {/* Avg label */}
      <SvgText
        x={pad.left + drawW + 14}
        y={avgY + 9}
        fill="rgba(255,255,255,0.32)"
        fontSize={21}
        textAnchor="start">
        avg
      </SvgText>

      {/* Unit label top-right */}
      <SvgText
        x={pad.left + drawW + 14}
        y={pad.top + 10}
        fill={T.textMuted}
        fontSize={21}
        textAnchor="start">
        kph
      </SvgText>
    </Svg>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatBlock = ({label, value, unit, accent}) => (
  <View style={ss.statBlock}>
    <Text style={[ss.statValue, accent && {color: T.accent}]}>
      {value}
      {unit ? <Text style={ss.statUnit}> {unit}</Text> : null}
    </Text>
    <Text style={ss.statLabel}>{label}</Text>
  </View>
);

const DividerV = () => <View style={ss.dividerV} />;

// ─── Card content (shared between photo and dark modes) ───────────────────────
const CardContent = ({data, format, mapHeight, graphHeight, width}) => {
  const {
    rideName = 'Unnamed Ride',
    rideDate = null,
    riderName = null,
    generatedRidesId = '',
    distanceMeters = null,
    durationMinutes = null,
    averageSpeedKph = null,
    snapshotUrl = null, // pre-rendered polygon map from server
    speedSegments = [], // speed data for the graph
  } = data;

  const dist = fmtDistance(distanceMeters);
  const dur = fmtDuration(durationMinutes);
  const date = fmtDate(rideDate);
  const hasGraph = extractSpeeds(speedSegments).length >= 2;

  return (
    <View style={ss.inner}>
      {/* ── Header ── */}
      <View style={ss.header}>
        <View style={{alignItems: 'flex-end', gap: 4}}>
          {date ? <Text style={ss.headerDate}>{date}</Text> : null}
          {riderName ? <Text style={ss.headerRider}>@{riderName}</Text> : null}
        </View>
      </View>

      {/* Accent rule */}
      <View style={ss.accentLine} />

      {/* ── Polygon map (snapshotUrl) ── */}
      <View style={ss.mapWrapper}>
        {snapshotUrl ? (
          <Image
            source={{uri: snapshotUrl}}
            style={[ss.mapImage, {height: mapHeight}]}
            resizeMode="cover"
          />
        ) : (
          <View style={[ss.mapPlaceholder, {height: mapHeight}]}>
            <Text style={ss.mapPlaceholderText}>Route map unavailable</Text>
          </View>
        )}
      </View>

      {/* ── Ride name ── */}
      <View style={ss.nameWrapper}>
        <Text style={ss.rideName} numberOfLines={2}>
          {rideName}
        </Text>
      </View>

      {/* ── Speed graph (transparent background) ── */}
      {hasGraph && (
        <View style={ss.graphWrapper}>
          <SpeedGraph
            segments={speedSegments}
            averageSpeedKph={averageSpeedKph}
            width={width}
            height={graphHeight}
          />
        </View>
      )}

      {/* ── Stats ── */}
      <View style={ss.statsCard}>
        <StatBlock
          label="Distance"
          value={dist.value}
          unit={dist.unit}
          accent
        />
        <DividerV />
        <StatBlock label="Duration" value={dur} />
        <DividerV />
        <StatBlock
          label="Avg Speed"
          value={fmtSpeed(averageSpeedKph)}
          unit="kph"
        />
      </View>

      <View style={{flex: 1}} />

    
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const RideShareCard = forwardRef(function RideShareCard(
  {data = {}, format = 'story', photoUri = null, AppLogo = null},
  ref,
) {
  const cfg = FORMATS[format] ?? FORMATS.story;
  const {width, height, mapHeight, graphHeight} = cfg;

  // ── Viewport-safe rendering ───────────────────────────────────────────────
  // The card is 1080×1920 dp for "story", which exceeds any phone screen
  // (~800–900 dp tall). Android skips GPU compositing for views whose layout
  // extends past the viewport, so react-native-view-shot only captures the
  // on-screen portion — that's why the bottom half of the image goes missing.
  //
  // Fix: the OUTER wrapper is scaled to fit within the viewport (opacity:0 so
  // the user never sees it). The INNER view (where the ref lives) renders at
  // full 1080×1920 dp but is visually shrunk via transform so its post-transform
  // visual bounds sit entirely on-screen. Android composites it in full.
  // captureShareCard uses pixelRatio = 1/renderScale so the final PNG is still
  // output at the full target resolution.
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

  // ── User picked a background photo ───────────────────────────────────────
  if (photoUri) {
    return (
      <View style={outerStyle} pointerEvents="none">
        <View ref={ref} style={innerStyle} collapsable={false}>
          <ImageBackground
            source={{uri: photoUri}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* Gradient keeps text readable without burying the photo.
              Reduced bottom opacity (0.72 vs previous 0.96) so the
              background image remains visible in the lower half. */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.05)',
              'rgba(0,0,0,0.35)',
              'rgba(0,0,0,0.58)',
              'rgba(0,0,0,0.72)',
            ]}
            locations={[0, 0.30, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
          <CardContent
            data={data}
            format={format}
            mapHeight={mapHeight}
            graphHeight={graphHeight}
            width={width}
          />
        </View>
      </View>
    );
  }

  // ── Dark card (no user photo) ─────────────────────────────────────────────
  return (
    <View style={outerStyle} pointerEvents="none">
      <View
        ref={ref}
        style={[innerStyle, {backgroundColor: T.bgDeep}]}
        collapsable={false}>
        <CardContent
          data={data}
          format={format}
          mapHeight={mapHeight}
          graphHeight={graphHeight}
          width={width}
        />
      </View>
    </View>
  );
});

export default RideShareCard;

// ─── Capture helper ───────────────────────────────────────────────────────────
// `format` must match what was passed to <RideShareCard> so we can derive the
// same renderScale used when laying out the inner view, and compensate with
// pixelRatio so the output image is still the full target resolution
// (1080×1920 for story, 1080×1080 for feed) regardless of screen size.
export async function captureShareCard(cardRef, format = 'story') {
  if (!cardRef?.current) {
    console.warn('[captureShareCard] ref not attached');
    return null;
  }
  try {
    const {captureRef} = require('react-native-view-shot');
    // The inner view renders at full card dp dimensions but is visually scaled
    // down by renderScale. pixelRatio = 1/renderScale restores the output to
    // the original target pixel count (e.g. 1080×1920 px for story).
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