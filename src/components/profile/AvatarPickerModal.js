import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { AVATARS } from '../../config/avatars';
import { Colors } from '../../theme';

export default function AvatarPickerModal({ visible, currentKey, onSelect, onClose }) {
  const [tab, setTab] = useState('male');
  const filtered = AVATARS.filter(a => a.category === tab);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Choose Avatar</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.close}>✕</Text></TouchableOpacity>
          </View>
          <View style={s.tabs}>
            {['male','female'].map(t => (
              <TouchableOpacity key={t} style={[s.tab, tab===t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab===t && s.tabTextActive]}>{t === 'male' ? '♂ Men' : '♀ Women'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filtered}
            numColumns={3}
            keyExtractor={i => i.key}
            contentContainerStyle={s.grid}
            renderItem={({ item }) => {
              const selected = item.key === currentKey;
              return (
                <TouchableOpacity style={[s.cell, selected && s.cellSelected]} onPress={() => onSelect(item.key)} activeOpacity={0.8}>
                  <Image source={item.source} style={s.img} />
                  {selected && <View style={s.check}><Text style={s.checkText}>✓</Text></View>}
                  <Text style={s.label}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'flex-end' },
  sheet: { backgroundColor:'#1A1A1C', borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:40, maxHeight:'80%' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:'#2C2C2E' },
  title: { fontFamily:'Outfit_700Bold', fontSize:18, color:'#FFF' },
  close: { color:'#666', fontSize:20 },
  tabs: { flexDirection:'row', margin:16, backgroundColor:'#2C2C2E', borderRadius:10, padding:4 },
  tab: { flex:1, paddingVertical:8, alignItems:'center', borderRadius:8 },
  tabActive: { backgroundColor:'#E65C00' },
  tabText: { fontFamily:'Outfit_600SemiBold', fontSize:14, color:'#666' },
  tabTextActive: { color:'#FFF' },
  grid: { paddingHorizontal:16, paddingBottom:20 },
  cell: { flex:1, margin:6, alignItems:'center', borderRadius:12, padding:8, borderWidth:2, borderColor:'transparent' },
  cellSelected: { borderColor:'#E65C00', backgroundColor:'rgba(230,92,0,0.1)' },
  img: { width:80, height:80, borderRadius:40 },
  check: { position:'absolute', top:8, right:8, backgroundColor:'#E65C00', borderRadius:10, width:20, height:20, alignItems:'center', justifyContent:'center' },
  checkText: { color:'#FFF', fontSize:11, fontWeight:'bold' },
  label: { fontFamily:'Outfit_400Regular', fontSize:11, color:'#888', marginTop:6 },
});
