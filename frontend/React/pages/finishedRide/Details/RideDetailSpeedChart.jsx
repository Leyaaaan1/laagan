/**
 * RideDetailSpeedChart.jsx
 *
 * Combo chart: speed line (left axis) + duration bars (right axis)
 * per checkpoint segment. Uses react-native-webview to render Chart.js
 * since RN has no native canvas — the WebView receives segments + avg
 * speed as JSON injected into the HTML template.
 *
 * Props:
 *   segments        – SpeedSegmentDTO[]  ({ fromLabel, toLabel, averageSpeedKph, durationMinutes, distanceMeters })
 *   averageSpeedKph – number | null
 */
import React, { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import WebView from 'react-native-webview';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

const fmtDist = m => {
  if (m == null) return '—';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

const fmtDur = min => {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const buildHtml = (segments, avgSpeed, isDark) => {
  const labels = segments.map(s => `${s.fromLabel} → ${s.toLabel}`);
  const speeds = segments.map(s => s.averageSpeedKph ?? 0);
  const durs = segments.map(s => s.durationMinutes ?? 0);
  const singlePoint = segments.length < 2;

  const bg = 'transparent';
  const textColor = 'rgba(255,255,255,0.55)';
  const gridColor = 'rgba(255,255,255,0.08)';

  return `<!DOCTYPE html>
<html>
<head>z 
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${bg}; font-family: -apple-system, sans-serif; }
  .wrap { padding: 0 4px 8px; }
</style>
</head>
<body>
<div class="wrap">
  <div style="position: relative; width: 100%; height: 220px;">
    <canvas id="c"></canvas>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script>
  const avgSpeed = ${avgSpeed ?? 0};
  const labels = ${JSON.stringify(labels)};
  const speeds = ${JSON.stringify(speeds)};
  const durs   = ${JSON.stringify(durs)};
  const singlePoint = ${singlePoint};
  
  new Chart(document.getElementById('c'), {
    data: {
      labels,
      datasets: [
{
          type: 'line',
          label: 'Duration (min)',
          data: durs,
          borderColor: 'rgba(55,138,221,0.85)',
          pointBackgroundColor: 'rgba(55,138,221,0.9)',
          borderWidth: 2,
          pointRadius: singlePoint ? 9 : 4,
          pointHoverRadius: singlePoint ? 11 : 6,
          pointBorderWidth: singlePoint ? 2 : 1,
          pointBorderColor: '#fff',
          fill: false,
          tension: 0.35,
          yAxisID: 'yDur',
          order: 2,
        },
        
         {
          type: 'line',
          label: 'Speed (kph)',
          data: speeds,
          borderColor: '${colors.primary}',
          borderWidth: 2.5,
          pointBackgroundColor: '${colors.primary}',
          pointRadius: singlePoint ? 9 : 5,
          pointHoverRadius: singlePoint ? 11 : 7,
          pointBorderWidth: singlePoint ? 2 : 1,
          pointBorderColor: '#fff',
          fill: false,
          tension: 0.35,
          yAxisID: 'ySpeed',
          order: 1,
        },
        {
          type: 'line',
          label: 'Ride avg',
          data: Array(labels.length).fill(avgSpeed),
          borderColor: 'rgba(136,136,136,0.7)',
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          yAxisID: 'ySpeed',
          order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label === 'Speed (kph)')
                return ' Speed: ' + ctx.parsed.y.toFixed(1) + ' kph';
              if (ctx.dataset.label === 'Duration (min)')
                return ' Duration: ' + ctx.parsed.y + ' min';
              if (ctx.dataset.label === 'Ride avg')
                return ' Avg: ' + ctx.parsed.y.toFixed(1) + ' kph';
              return '';
            },
          },
        },
      },
      scales: {
        x: {  
          offset: true,
          ticks: {
            color: '${textColor}',
            font: { size: 10 },
            autoSkip: false,
            maxRotation: 0,
          },
          grid: { color: '${gridColor}' },
        },
        ySpeed: {
          position: 'left',
          title: {
            display: true,
            text: 'kph',
            color: '${colors.primary}',
            font: { size: 10 },
          },
          ticks: {
            color: '${textColor}',
            font: { size: 10 },
            callback: v => v.toFixed(0),
          },
          grid: { color: '${gridColor}' },
          min: 0,
        },
        yDur: {
          position: 'right',
          title: {
            display: true,
            text: 'min',
            color: 'rgba(55,138,221,0.8)',
            font: { size: 10 },
          },
          ticks: {
            color: '${textColor}',
            font: { size: 10 },
            stepSize: 1,
          },
          grid: { display: false },
          min: 0,
        },
      },
    },
  });
</script>
</body>
</html>`;
};

const RideDetailSpeedChart = ({ segments = [], averageSpeedKph }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const html = useMemo(
    () => buildHtml(segments, averageSpeedKph, isDark),
    [segments, averageSpeedKph, isDark],
  );

  if (!segments.length) return null;



  const totalDur = segments.reduce((a, s) => a + (s.durationMinutes ?? 0), 0);

  return (
    <View style={rideDetailStyles.chartSection}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={rideDetailStyles.chartSectionHeader}>
        <View style={rideDetailStyles.chartSectionIconWrap}>
          <FontAwesome name="line-chart" size={13} color={colors.primary} />
        </View>
        <Text style={rideDetailStyles.chartSectionTitle}>Speed by segment</Text>
        <View style={rideDetailStyles.chartAvgBadge}>
          <Text style={rideDetailStyles.chartAvgBadgeText}>
            avg {(averageSpeedKph ?? 0).toFixed(1)} kph
          </Text>
        </View>
      </View>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <View style={rideDetailStyles.chartLegend}>
        <View style={rideDetailStyles.chartLegendItem}>
          <View
            style={[
              rideDetailStyles.chartLegendDot,
              { backgroundColor: '#1D9E75' },
            ]}
          />
          <Text style={rideDetailStyles.chartLegendLabel}>Speed (kph)</Text>
        </View>
        <View style={rideDetailStyles.chartLegendItem}>
          <View
            style={[
              rideDetailStyles.chartLegendDot,
              { backgroundColor: 'rgba(55,138,221,0.5)' },
            ]}
          />
          <Text style={rideDetailStyles.chartLegendLabel}>Duration (min)</Text>
        </View>
        <View style={rideDetailStyles.chartLegendItem}>
          <View
            style={[
              rideDetailStyles.chartLegendDot,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#888',
              },
            ]}
          />
          <Text style={rideDetailStyles.chartLegendLabel}>Ride avg</Text>
        </View>
      </View>

      {/* ── Chart (WebView canvas) ────────────────────────────────────── */}
      <View style={{ height: 240, marginHorizontal: -4 }}>
        <WebView
          source={{ html }}
          style={{ backgroundColor: 'transparent' }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      </View>

      {/* ── Segment detail rows ───────────────────────────────────────── */}
      <View style={rideDetailStyles.chartContainer}>
        {segments.map((seg, i) => {
          const speed = seg.averageSpeedKph ?? 0;
          const diff = averageSpeedKph ? speed - averageSpeedKph : null;
          const diffColor =
            diff == null
              ? colors.textMuted
              : diff >= 0
                ? '#1D9E75'
                : diff >= -5
                  ? '#f59e0b'
                  : colors.primary;

          return (
            <View
              key={`${seg.fromLabel}-${i}`}
              style={[
                rideDetailStyles.chartSegmentWrap,
                i === segments.length - 1 && rideDetailStyles.chartSegmentLast,
              ]}>
              {/* leg label */}
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={rideDetailStyles.chartFromLabel} numberOfLines={1}>
                  {seg.fromLabel ?? 'Start'}
                </Text>
                <FontAwesome
                  name="arrow-right"
                  size={9}
                  color={colors.textMuted}
                />
                <Text style={rideDetailStyles.chartToLabel} numberOfLines={1}>
                  {seg.toLabel ?? 'End'}
                </Text>
              </View>

              {/* stats row */}
              <View style={rideDetailStyles.chartDetail}>
                <View style={rideDetailStyles.chartDetailItem}>
                  <Text style={rideDetailStyles.chartDetailLabel}>Speed</Text>
                  <Text
                    style={[
                      rideDetailStyles.chartDetailValue,
                      { color: '#1D9E75' },
                    ]}>
                    {speed > 0 ? speed.toFixed(1) + ' kph' : '—'}
                  </Text>
                </View>
                <View style={rideDetailStyles.chartDetailDivider} />
                <View style={rideDetailStyles.chartDetailItem}>
                  <Text style={rideDetailStyles.chartDetailLabel}>
                    Duration
                  </Text>
                  <Text style={rideDetailStyles.chartDetailValue}>
                    {fmtDur(seg.durationMinutes)}
                  </Text>
                </View>
                <View style={rideDetailStyles.chartDetailDivider} />
                <View style={rideDetailStyles.chartDetailItem}>
                  <Text style={rideDetailStyles.chartDetailLabel}>
                    Distance
                  </Text>
                  <Text style={rideDetailStyles.chartDetailValue}>
                    {fmtDist(seg.distanceMeters)}
                  </Text>
                </View>
                <View style={rideDetailStyles.chartDetailDivider} />
                <View style={rideDetailStyles.chartDetailItem}>
                  <Text style={rideDetailStyles.chartDetailLabel}>vs avg</Text>
                  <Text
                    style={[
                      rideDetailStyles.chartDetailValue,
                      { color: diffColor },
                    ]}>
                    {diff != null
                      ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kph`
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Footer summary ────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 0.5,
          borderTopColor: colors.borderLight,
        }}>
        <Text style={rideDetailStyles.chartHint}>
          {segments.length} {segments.length === 1 ? 'leg' : 'legs'}
        </Text>
        <Text style={rideDetailStyles.chartHint}>{fmtDur(totalDur)} total</Text>
      </View>
    </View>
  );
};

export default RideDetailSpeedChart;
