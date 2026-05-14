// src/components/WeightChart.js
// Custom SVG line chart — no heavy third-party chart library needed
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme';

const W = Dimensions.get('window').width - 40; // screen width minus padding
const H = 160;
const PAD = { top: 16, bottom: 32, left: 40, right: 16 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

export default function WeightChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>Log at least 2 entries to see your weight trend</Text>
      </View>
    );
  }

  // Use last 14 entries max
  const points = data.slice(-14);
  const weights = points.map(d => parseFloat(d.weight));
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  // Convert data to SVG coordinates
  const coords = points.map((d, i) => ({
    x: PAD.left + (i / (points.length - 1)) * CHART_W,
    y: PAD.top + (1 - (parseFloat(d.weight) - minW) / range) * CHART_H,
    weight: d.weight,
    date: d.date,
  }));

  // Build smooth polyline path
  const linePath = coords.reduce((path, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = coords[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${path} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under line
  const fillPath = `${linePath} L ${coords[coords.length - 1].x} ${PAD.top + CHART_H} L ${coords[0].x} ${PAD.top + CHART_H} Z`;

  // Trend
  const first = weights[0];
  const last = weights[weights.length - 1];
  const diff = (last - first).toFixed(1);
  const trendColor = parseFloat(diff) < 0 ? Colors.success : parseFloat(diff) > 0 ? '#E67E22' : Colors.textSecondary;
  const trendLabel = parseFloat(diff) < 0 ? `↓ ${Math.abs(diff)} kg lost` : parseFloat(diff) > 0 ? `↑ ${diff} kg gained` : '→ No change';

  // Y-axis labels (3 labels)
  const yLabels = [maxW.toFixed(1), ((maxW + minW) / 2).toFixed(1), minW.toFixed(1)];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Weight Trend</Text>
        <Text style={[s.trend, { color: trendColor }]}>{trendLabel}</Text>
      </View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines */}
        {[0, 0.5, 1].map((t, i) => {
          const y = PAD.top + t * CHART_H;
          return (
            <React.Fragment key={i}>
              <Line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="#2C2C2E" strokeWidth="1" strokeDasharray="4,4" />
              <SvgText x={PAD.left - 6} y={y + 4} fontSize="9" fill="#666" textAnchor="end">{yLabels[i]}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Gradient fill */}
        <Path d={fillPath} fill="url(#grad)" />

        {/* Line */}
        <Path d={linePath} stroke={Colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {coords.map((pt, i) => (
          <Circle key={i} cx={pt.x} cy={pt.y} r={i === coords.length - 1 ? 5 : 3} fill={i === coords.length - 1 ? Colors.primary : '#2C2C2E'} stroke={Colors.primary} strokeWidth="1.5" />
        ))}

        {/* Latest weight label */}
        <SvgText x={coords[coords.length - 1].x} y={coords[coords.length - 1].y - 10} fontSize="11" fill={Colors.primary} textAnchor="middle" fontWeight="bold">
          {last}kg
        </SvgText>

        {/* X-axis: first and last dates */}
        <SvgText x={PAD.left} y={H - 4} fontSize="9" fill="#666">{points[0]?.date?.slice(5)}</SvgText>
        <SvgText x={PAD.left + CHART_W} y={H - 4} fontSize="9" fill="#666" textAnchor="end">{points[points.length - 1]?.date?.slice(5)}</SvgText>
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#161618', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E', marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#FFF' },
  trend: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  empty: { backgroundColor: '#161618', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E', marginTop: 16 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#666', textAlign: 'center' },
});
