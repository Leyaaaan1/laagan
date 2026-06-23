import React, {forwardRef, useMemo} from 'react';
import {View, Text, Image, ImageBackground, StyleSheet} from 'react-native';
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  accent: '#1D9E75',
  accentSoft: 'rgba(29,158,117,0.18)',
  blue: '#378ADD',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.68)',
  textMuted: 'rgba(255,255,255,0.38)',
  bgDeep: '#0D0F14',
  bgCard: 'rgba(13,15,20,0.80)',
  bgSurface: 'rgba(27,31,46,0.88)',
  border: 'rgba(255,255,255,0.10)',
  borderMid: 'rgba(255,255,255,0.16)',
};

const FORMATS = {
  story: {width: 1080, height: 1920, mapHeight: 520, graphHeight: 280},
  feed: {width: 1080, height: 1080, mapHeight: 300, graphHeight: 200},
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtDistance = m => {
  if (m == null) return {value: '—', unit: ''};
  const km = m / 1000;
  return km >= 1
    ? {value: km.toFixed(2), unit: 'km'}
    : {value: String(Math.round(m)), unit: 'm'};
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
        <View style={ss.logoRow}>
          <View style={ss.logoDot}>
            <Text style={ss.logoEmoji}>🏍</Text>
          </View>
          <Text style={ss.appName}>RideSync</Text>
        </View>
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
          <View style={ss.graphHeader}>
            <Text style={ss.graphLabel}>SPEED PROFILE</Text>
          </View>
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

      {/* ── Footer ── */}
      <View style={ss.footer}>
        <Text style={ss.slogan}>Ride together. Every km counts.</Text>
        {generatedRidesId ? (
          <Text style={ss.refCode}>ref · {generatedRidesId}</Text>
        ) : null}
      </View>
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

  // Positioned off-screen so it renders without being visible to the user.
  // react-native-view-shot captures it at full resolution.
  // opacity:0 keeps card in render tree (ImageBackground loads) but invisible.
  // top:-height breaks Android capture — Android skips off-viewport views.
  const cardStyle = [ss.cardRoot, {width, height, opacity: 0}];

  // ── User picked a background photo ───────────────────────────────────────
  if (photoUri) {
    return (
      <View ref={ref} style={cardStyle} collapsable={false} pointerEvents="none">
        <ImageBackground
          source={{uri: photoUri}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Heavy gradient so text stays readable over any photo */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.08)',
            'rgba(0,0,0,0.45)',
            'rgba(0,0,0,0.82)',
            'rgba(0,0,0,0.96)',
          ]}
          locations={[0, 0.28, 0.62, 1]}
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
    );
  }

  // ── Dark card (no user photo) ─────────────────────────────────────────────
  return (
    <View
      ref={ref}
      style={[cardStyle, {backgroundColor: T.bgDeep}]}
      collapsable={false}
      pointerEvents="none">
      <CardContent
        data={data}
        format={format}
        mapHeight={mapHeight}
        graphHeight={graphHeight}
        width={width}
      />
    </View>
  );
});

export default RideShareCard;

// ─── Capture helper (unchanged) ───────────────────────────────────────────────
export async function captureShareCard(cardRef) {
  if (!cardRef?.current) {
    console.warn('[captureShareCard] ref not attached');
    return null;
  }
  try {
    const {captureRef} = require('react-native-view-shot');
    return await captureRef(cardRef, {
      format: 'png',
      quality: 0.95,
      result: 'data-uri',
    });
  } catch (e) {
    console.warn('[captureShareCard] failed:', e);
    return null;
  }
}

// ─── Styles (all values in 1080-space — card renders at 1080px wide) ─────────
const ss = StyleSheet.create({
  cardRoot: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  inner: {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 56,
    paddingTop: 72,
    paddingBottom: 20,
  },
  logoRow: {flexDirection: 'row', alignItems: 'center'},
  logoDot: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(29,158,117,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {fontSize: 26},
  appName: {
    color: T.textPrimary,
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: 0.5,
    marginLeft: 14,
  },
  headerDate: {color: T.textSecondary, fontSize: 20},
  headerRider: {color: T.accent, fontWeight: '600', fontSize: 20},

  accentLine: {
    height: 2,
    backgroundColor: T.accent,
    opacity: 0.65,
    marginHorizontal: 56,
    borderRadius: 2,
    marginBottom: 32,
  },

  // Snapshot map
  mapWrapper: {
    marginHorizontal: 48,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 36,
  },
  mapImage: {width: '100%'},
  mapPlaceholder: {
    backgroundColor: T.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {color: T.textMuted, fontSize: 28},

  // Ride name
  nameWrapper: {
    paddingHorizontal: 56,
    marginBottom: 16,
  },
  rideName: {
    color: T.textPrimary,
    fontWeight: '800',
    fontSize: 72,
    letterSpacing: -0.5,
    lineHeight: 82,
  },

  // Speed graph (no background — transparent)
  graphWrapper: {marginBottom: 20},
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 56,
    marginBottom: 4,
  },
  graphLabel: {
    color: T.textMuted,
    fontSize: 18,
    letterSpacing: 2.5,
    fontWeight: '600',
  },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    marginHorizontal: 48,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  statBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 12},
  statValue: {
    color: T.textPrimary,
    fontWeight: '700',
    fontSize: 46,
    lineHeight: 54,
  },
  statUnit: {
    color: T.textSecondary,
    fontWeight: '400',
    fontSize: 26,
  },
  statLabel: {
    color: T.textMuted,
    fontSize: 17,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dividerV: {
    width: 1,
    backgroundColor: T.borderMid,
    marginVertical: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 56,
    paddingBottom: 72,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  slogan: {
    color: T.textSecondary,
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  refCode: {
    color: T.textMuted,
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 0.8,
    marginTop: 4,
  },
});