/**
 * RideUpdateModal.jsx
 * Compact modal preview of the Ride Analytics screen.
 * Static — no animations. Matches the screenshot layout.
 *
 * Props:
 *   visible   {boolean}
 *   onClose   {function}
 *   onConfirm {function}
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { height: H } = Dimensions.get('window');
const PRIMARY = '#9b2626';

// ── Route Map Preview ─────────────────────────────────────────────────────────
const RouteMapPreview = () => {
  const checkpoints = [
    { label: 'Azuela Cove',       color: '#22c55e', dot: '#22c55e' },
    { label: 'Poblacion Dis...',  color: '#f97316', dot: '#f5f5f5' },
    { label: 'PLDT Subdivis...', color: '#f97316', dot: '#f5f5f5' },
    { label: 'Purok 19',          color: '#f97316', dot: '#f5f5f5' },
    { label: 'Toril District',    color: PRIMARY,   dot: '#f5f5f5' },
  ];

  return (
    <View style={map.container}>
      {/* Zigzag route line + checkpoint pills */}
      <View style={map.routeArea}>
        {/* Orange connecting line drawn as absolute positioned views */}
        <View style={map.line1} />
        <View style={map.line2} />
        <View style={map.line3} />
        <View style={map.line4} />

        {/* Azuela Cove — top right */}
        <View style={[map.pill, map.pillGreen, { top: 10, right: 12 }]}>
          <Text style={[map.pillTxt, { color: '#000' }]}>Azuela Cove</Text>
          <View style={[map.dot, { backgroundColor: '#22c55e' }]} />
        </View>

        {/* Poblacion — upper mid */}
        <View style={[map.pill, map.pillOrange, { top: 44, right: 60 }]}>
          <Text style={map.pillTxt}>Poblacion Dis...</Text>
          <View style={[map.dot, { backgroundColor: '#fff' }]} />
        </View>

        {/* PLDT — mid */}
        <View style={[map.pill, map.pillOrange, { top: 78, right: 44 }]}>
          <Text style={map.pillTxt}>PLDT Subdivis...</Text>
          <View style={[map.dot, { backgroundColor: '#fff' }]} />
        </View>

        {/* Purok 19 — lower mid */}
        <View style={[map.pill, map.pillOrange, { bottom: 40, left: 90 }]}>
          <Text style={map.pillTxt}>Purok 19</Text>
          <View style={[map.dot, { backgroundColor: '#fff' }]} />
        </View>

        {/* Toril District — bottom left */}
        <View style={[map.pill, map.pillRed, { bottom: 14, left: 8 }]}>
          <View style={[map.dotLeft, { backgroundColor: PRIMARY }]} />
          <Text style={map.pillTxt}>Toril District</Text>
        </View>
      </View>

      {/* Stat bar */}
      <View style={map.statBar}>
        {[['DISTANCE', '27'], ['DURATION', '38m'], ['STOPS', '3']].map(([l, v]) => (
          <View key={l} style={map.statCell}>
            <Text style={map.statLbl}>{l}</Text>
            <Text style={map.statVal}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Speed Chart Preview ───────────────────────────────────────────────────────
// Simple SVG-free polyline using absolutely positioned dots + lines
const ChartPreview = () => {
  // Approximate the chart shape from the screenshot as percent positions
  // red line (speed): starts low, peaks at seg2, dips, rises slightly
  // blue line (duration): starts high, drops, stays low, rises at end
  const W_CHART = Dimensions.get('window').width - 36 - 20; // modal padding

  const redPoints  = [
    { x: 0.00, y: 0.95 },
    { x: 0.25, y: 0.20 },
    { x: 0.50, y: 0.70 },
    { x: 0.75, y: 0.88 },
    { x: 1.00, y: 0.82 },
  ];
  const bluePoints = [
    { x: 0.00, y: 0.05 },
    { x: 0.25, y: 0.80 },
    { x: 0.50, y: 0.90 },
    { x: 0.75, y: 0.60 },
    { x: 1.00, y: 0.30 },
  ];

  const CH = 80;
  const CW = W_CHART;

  const toCoords = pts =>
    pts.map(p => ({ cx: p.x * CW, cy: p.y * CH }));

  const redCoords  = toCoords(redPoints);
  const blueCoords = toCoords(bluePoints);

  const renderLine = (coords, color) =>
    coords.slice(0, -1).map((p, i) => {
      const next = coords[i + 1];
      const dx = next.cx - p.cx;
      const dy = next.cy - p.cy;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.cx,
            top: p.cy - 1,
            width: len,
            height: 2,
            backgroundColor: color,
            transformOrigin: '0 1px',
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    });

  const renderDots = (coords, color) =>
    coords.map((p, i) => (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: p.cx - 4,
          top: p.cy - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          borderWidth: 1.5,
          borderColor: '#111',
        }}
      />
    ));

  const segments = ['Azuela Cove', 'Poblacion', 'PLDT Sub.', 'Purok 19', 'Toril'];

  return (
    <View style={chart.wrap}>
      {/* Header */}
      <View style={chart.header}>
        <Text style={chart.title}> Speed by segment</Text>
        <Text style={chart.avg}>avg 73.6 kph</Text>
      </View>

      {/* Legend */}
      <View style={chart.legend}>
        <View style={chart.legendItem}>
          <View style={[chart.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={chart.legendTxt}>Speed (kph)</Text>
        </View>
        <View style={chart.legendItem}>
          <View style={[chart.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={chart.legendTxt}>Duration (min)</Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={{ height: CH, marginBottom: 4 }}>
        {/* Y-axis labels */}
        <View style={chart.yAxis}>
          {['600', '400', '200', '0'].map(v => (
            <Text key={v} style={chart.yLbl}>{v}</Text>
          ))}
        </View>

        {/* Plot area */}
        <View style={[chart.plotArea, { height: CH, width: CW }]}>
          {/* avg dashed line */}
          <View style={chart.avgLine} />

          {renderLine(redCoords,  '#ef4444')}
          {renderLine(blueCoords, '#3b82f6')}
          {renderDots(redCoords,  '#ef4444')}
          {renderDots(blueCoords, '#3b82f6')}
        </View>
      </View>

      {/* X-axis segment labels */}
      <View style={chart.xAxis}>
        {segments.map(s => (
          <Text key={s} style={chart.xLbl} numberOfLines={1}>{s}</Text>
        ))}
      </View>
    </View>
  );
};

// ── Segment Table ─────────────────────────────────────────────────────────────
const SegmentTable = () => {
  const rows = [
    {
      from: 'Azuela Cove', to: 'Poblacion District',
      speed: '20.9 kph', speedColor: '#ccc',
      duration: '11m', distance: '3.8 km',
      vsAvg: '-52.7 kph', vsColor: PRIMARY,
    },
    {
      from: 'Poblacion District', to: 'PLDT Subdivision',
      speed: '515.4 kph', speedColor: '#22c55e',
      duration: '1m', distance: '8.6 km',
      vsAvg: '+441.8 kph', vsColor: '#22c55e',
    },
    {
      from: 'PLDT Subdivision', to: 'Purok 19',
      speed: '—', speedColor: '#555',
      duration: '—', distance: '—',
      vsAvg: '—', vsColor: '#555',
    },
  ];

  return (
    <View style={tbl.wrap}>
      {rows.map((r, i) => (
        <View key={i} style={tbl.group}>
          {/* Route header */}
          <View style={tbl.routeRow}>
            <Text style={tbl.routeFrom}>{r.from}</Text>
            <Text style={tbl.arrow}> → </Text>
            <Text style={tbl.routeTo}>{r.to}</Text>
          </View>
          {/* Columns header */}
          <View style={tbl.colHead}>
            {['SPEED', 'DURATION', 'DISTANCE', 'VS AVG'].map(h => (
              <Text key={h} style={tbl.colHd}>{h}</Text>
            ))}
          </View>
          {/* Values */}
          <View style={tbl.colVals}>
            <Text style={[tbl.val, { color: r.speedColor }]}>{r.speed}</Text>
            <Text style={tbl.val}>{r.duration}</Text>
            <Text style={tbl.val}>{r.distance}</Text>
            <Text style={[tbl.val, { color: r.vsColor }]}>{r.vsAvg}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ── Tab Bar ───────────────────────────────────────────────────────────────────
const TabBar = ({ onConfirm, onClose }) => (
  <View style={tabs.bar}>
    <TouchableOpacity style={tabs.tab} onPress={onClose}>
      <Text style={tabs.tabTxt}>Ride Summary</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[tabs.tab, tabs.active]} onPress={onConfirm}>
      <Text style={[tabs.tabTxt, tabs.activeTxt]}>My Stats</Text>
    </TouchableOpacity>
    <TouchableOpacity style={tabs.tab} onPress={onClose}>
      <Text style={tabs.tabTxt}>My Summary</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
const RideUpdateModal = ({ visible = false, onClose, onConfirm }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}>

    {/* Backdrop */}
    <TouchableOpacity
      style={s.backdrop}
      activeOpacity={1}
      onPress={onClose}
    />

    {/* Sheet */}
    <View style={s.sheet}>
      {/* Drag handle */}
      <View style={s.handle} />

      {/* NEW badge + dismiss */}
      <View style={s.topRow}>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>NEW  •  Ride Analytics</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}>
        <RouteMapPreview />
        <ChartPreview />
        <SegmentTable />
      </ScrollView>

      {/* Tab bar CTA */}
      <TabBar onConfirm={onConfirm} onClose={onClose} />
    </View>
  </Modal>
);

export default RideUpdateModal;

// ── Shared styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0d1117',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#222',
    maxHeight: H * 0.78,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: 'rgba(155,38,38,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(155,38,38,0.35)',
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.5,
  },
  closeTxt: {
    fontSize: 14,
    color: '#555',
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
});

// ── Map styles ────────────────────────────────────────────────────────────────
const map = StyleSheet.create({
  container: {
    backgroundColor: '#0a1628',
    borderRadius: 10,
    overflow: 'hidden',
  },
  routeArea: {
    height: 140,
    position: 'relative',
  },
  // Orange route lines approximating the screenshot zigzag
  line1: { position: 'absolute', bottom: 50, left: 100, width: 70,  height: 2, backgroundColor: '#f97316', transform: [{ rotate: '-20deg' }] },
  line2: { position: 'absolute', bottom: 68, left: 158, width: 60,  height: 2, backgroundColor: '#f97316', transform: [{ rotate: '-14deg' }] },
  line3: { position: 'absolute', bottom: 80, left: 202, width: 65,  height: 2, backgroundColor: '#f97316', transform: [{ rotate: '-18deg' }] },
  line4: { position: 'absolute', bottom: 92, left: 254, width: 70,  height: 2, backgroundColor: '#f97316', transform: [{ rotate: '-12deg' }] },

  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    gap: 5,
  },
  pillGreen:  { backgroundColor: '#22c55e' },
  pillOrange: { backgroundColor: '#f97316' },
  pillRed:    { backgroundColor: PRIMARY   },

  pillTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  dot:     { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  dotLeft: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },

  statBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e2a3a',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#1e2a3a',
  },
  statLbl: { fontSize: 8,  color: '#556', fontWeight: '600', letterSpacing: 0.5 },
  statVal: { fontSize: 14, color: '#fff', fontWeight: '800', marginTop: 1 },
});

// ── Chart styles ──────────────────────────────────────────────────────────────
const chart = StyleSheet.create({
  wrap: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 12, fontWeight: '800', color: '#fff' },
  avg:   { fontSize: 10, fontWeight: '700', color: '#888', backgroundColor: '#1a1a1a', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },

  legend: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontSize: 9, color: '#666' },

  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    width: 28,
  },
  yLbl: { fontSize: 8, color: '#444', textAlign: 'right' },

  plotArea: {
    position: 'absolute',
    left: 30,
    top: 0,
    right: 0,
  },
  avgLine: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#333',
  },

  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    marginTop: 2,
  },
  xLbl: { fontSize: 7, color: '#444', flex: 1, textAlign: 'center' },
});

// ── Table styles ──────────────────────────────────────────────────────────────
const tbl = StyleSheet.create({
  wrap: {
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
  },
  group: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  routeFrom: { fontSize: 11, fontWeight: '700', color: '#fff' },
  arrow:     { fontSize: 10, color: '#555' },
  routeTo:   { fontSize: 11, color: '#888' },

  colHead: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  colHd: {
    flex: 1,
    fontSize: 8,
    color: '#555',
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  colVals: { flexDirection: 'row' },
  val: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#ccc',
    textAlign: 'center',
  },
});

// ── Tab bar styles ────────────────────────────────────────────────────────────
const tabs = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: '#0d1117',
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
  },
  active: {
    backgroundColor: PRIMARY,
  },
  tabTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTxt: {
    color: '#fff',
  },
});