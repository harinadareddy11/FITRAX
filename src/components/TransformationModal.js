// src/components/TransformationModal.js
// Slide-to-reveal photo comparison with drag handle
import React, { useState, useRef } from 'react';
import {
  View, Text, Modal, Image, TouchableOpacity, PanResponder,
  Dimensions, StyleSheet, Animated,
} from 'react-native';
import { Colors } from '../theme';

const SCREEN = Dimensions.get('window');
const IMG_H = SCREEN.height * 0.55;

export default function TransformationModal({ visible, before, after, title, onClose }) {
  const [sliderX, setSliderX] = useState(SCREEN.width / 2);
  const containerRef = useRef(null);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gs) => {
      const x = Math.max(40, Math.min(SCREEN.width - 40, gs.moveX));
      setSliderX(x);
    },
  });

  if (!before || !after) return null;

  const leftPct = `${(sliderX / SCREEN.width) * 100}%`;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.screen}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title} numberOfLines={1}>{title || 'Transformation'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Comparison view */}
        <View style={s.compareWrap} ref={containerRef}>
          {/* AFTER (right, full width underneath) */}
          <Image source={{ uri: after.storageUrl }} style={s.img} resizeMode="cover" />

          {/* BEFORE (left, clipped by sliderX) */}
          <View style={[s.beforeClip, { width: sliderX }]}>
            <Image source={{ uri: before.storageUrl }} style={[s.img, { width: SCREEN.width }]} resizeMode="cover" />
          </View>

          {/* Divider line */}
          <View style={[s.divider, { left: sliderX - 1 }]} />

          {/* Drag handle */}
          <View style={[s.handle, { left: sliderX - 20 }]} {...pan.panHandlers}>
            <Text style={s.handleIcon}>◀ ▶</Text>
          </View>

          {/* Labels */}
          <View style={s.labelBefore}><Text style={s.labelText}>BEFORE</Text></View>
          <View style={s.labelAfter}><Text style={s.labelText}>AFTER</Text></View>
        </View>

        {/* Date info */}
        <View style={s.info}>
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>Before</Text>
            <Text style={s.infoDate}>{before.date}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoItem}>
            <Text style={s.infoLabel}>After</Text>
            <Text style={s.infoDate}>{after.date}</Text>
          </View>
        </View>

        <Text style={s.hint}>← Drag to reveal →</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  closeText: { color: '#FFF', fontSize: 18 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF', flex: 1, textAlign: 'center' },
  compareWrap: { width: SCREEN.width, height: IMG_H, overflow: 'hidden', position: 'relative' },
  img: { width: SCREEN.width, height: IMG_H, position: 'absolute', top: 0, left: 0 },
  beforeClip: { position: 'absolute', top: 0, left: 0, height: IMG_H, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, width: 2, height: IMG_H, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  handle: { position: 'absolute', top: IMG_H / 2 - 22, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 6 },
  handleIcon: { fontSize: 11, color: '#333', fontWeight: 'bold' },
  labelBefore: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  labelAfter: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  labelText: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#FFF', letterSpacing: 1 },
  info: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 40 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#666', marginBottom: 4 },
  infoDate: { fontFamily: 'SpaceMono_400Regular', fontSize: 15, color: '#FFF' },
  infoDivider: { width: 1, height: 36, backgroundColor: '#333' },
  hint: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#444', textAlign: 'center', marginTop: 16 },
});
