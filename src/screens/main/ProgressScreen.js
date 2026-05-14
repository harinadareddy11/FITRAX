// src/screens/main/ProgressScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, Image, RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../services/supabase/client';
import useAuthStore from '../../store/useAuthStore';
import { Colors, GlobalStyles } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';
import WeightChart from '../../components/WeightChart';
import TransformationModal from '../../components/TransformationModal';
import { queueWeightLog, queuePhoto, getPendingPhotos } from '../../services/offlineQueue';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 52) / 2;

// ── PIN unlock screen ──────────────────────────────────────────
function PinUnlock({ onUnlock, onCancel }) {
  const navigation = useNavigation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKey = async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(false); return; }
    const next = pin + k;
    if (next.length <= 4) {
      setPin(next);
      if (next.length === 4) {
        const saved = await SecureStore.getItemAsync('fitrax_pin');
        if (next === saved) {
          onUnlock();
        } else {
          setError(true);
          setPin('');
        }
      }
    }
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <SafeAreaView style={styles.lockScreen}>
      <TouchableOpacity style={styles.lockBack} onPress={() => navigation.goBack()}>
        <Text style={styles.lockBackText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.lockLogo}>FITRAX</Text>
      <Text style={styles.lockTitle}>Enter PIN</Text>
      <Text style={[styles.lockSub, error && { color: Colors.error }]}>
        {error ? 'Wrong PIN — try again' : 'Progress is locked for your privacy'}
      </Text>
      <View style={styles.pinDots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.pinDot, i < pin.length && (error ? styles.pinDotError : styles.pinDotFilled)]} />
        ))}
      </View>
      <View style={styles.pinKeypad}>
        {KEYS.map((k, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.pinKey, k === '' && { opacity: 0 }]}
            onPress={() => k && handleKey(k)}
            disabled={k === ''}
          >
            <Text style={styles.pinKeyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Main Progress Screen ───────────────────────────────────────
export default function ProgressScreen() {
  const { colors } = useTheme();
  const { user, userProfile } = useAuthStore(); // userProfile has height for BMI calc
  const [unlocked, setUnlocked] = useState(false);
  const [lockType, setLockType] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weightModal, setWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [checkingLock, setCheckingLock] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);   // fullscreen viewer
  const [editingWeight, setEditingWeight] = useState(null);   // today's existing weight entry
  const [compareMode, setCompareMode] = useState(false);      // manual compare selection
  const [compareSelection, setCompareSelection] = useState([]); // [photo, photo]
  const [transformation, setTransformation] = useState(null); // { before, after, title }

  // On focus: check lock type and authenticate
  useFocusEffect(useCallback(() => {
    let active = true;
    setUnlocked(false);
    setCheckingLock(true);

    (async () => {
      const lt = await SecureStore.getItemAsync('fitrax_lock_type').catch(() => 'none');
      if (!active) return;
      setLockType(lt || 'none');

      if (!lt || lt === 'none') {
        setUnlocked(true);
        setCheckingLock(false);
        return;
      }

      if (lt === 'biometric') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock FitRax Progress',
          fallbackLabel: 'Use PIN',
        });
        if (!active) return;
        if (result.success) {
          setUnlocked(true);
        }
        setCheckingLock(false);
      } else {
        // PIN — show pin screen
        setCheckingLock(false);
      }
    })();

    return () => { active = false; };
  }, []));

  const loadData = useCallback(async () => {
    if (!user?.id || !unlocked) return;
    try {
      const [photosRes, weightRes] = await Promise.all([
        supabase.from('photos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('weight_log').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ]);

      // Generate signed URLs for each photo (1 hour)
      const photosWithUrls = await Promise.all(
        (photosRes.data || []).map(async (photo) => {
          const { data: signed } = await supabase.storage
            .from('photos')
            .createSignedUrl(`${user.id}/${photo.id}.jpg`, 3600);
          return {
            id: photo.id,
            date: photo.date,
            storageUrl: signed?.signedUrl || '',
            weight: photo.weight,
            notes: photo.notes,
          };
        })
      );

      setPhotos(photosWithUrls);
      setWeightLogs((weightRes.data || []).map(d => ({ id: d.id, weight: d.weight, date: d.date })));
    } catch (e) {
      console.log('Progress load error:', e);
    }
  }, [user?.id, unlocked]);

  useEffect(() => { if (unlocked) loadData(); }, [unlocked]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // Compress image to ~250KB max, then upload to Supabase Storage as ArrayBuffer.
  // Supabase Storage in React Native requires ArrayBuffer — Blob/XHR approach causes
  // 'Network request failed'. We use FileSystem base64 + decode() for reliability.
  const compressAndUpload = async (uri) => {
    // Step 1: Resize to max 900px wide and compress to ~60% quality (~200-300KB)
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 900 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Step 2: Read compressed file as base64 string
    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: 'base64',
    });

    // Step 3: Decode base64 → ArrayBuffer (required by Supabase Storage SDK)
    return { arrayBuffer: decode(base64), compressedUri: compressed.uri };
  };

  const uploadPhoto = async (uri) => {
    setUploading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Compress ONCE — get both arrayBuffer (for upload) and compressedUri (for offline fallback)
      const { arrayBuffer, compressedUri } = await compressAndUpload(uri);

      try {
        // Online upload
        const photoId = `${Date.now()}`;
        const filePath = `${user.id}/${photoId}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('photos').upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) throw uploadError;
        const { error: dbError } = await supabase.from('photos').insert({
          id: photoId, user_id: user.id, date: today,
          storage_url: filePath, weight: null, notes: '', created_at: new Date().toISOString(),
        });
        if (dbError) throw dbError;
        await loadData();
        Alert.alert('Photo saved! 💪', 'Compressed and stored privately in FitRax.');
      } catch (networkErr) {
        // Offline fallback — compressedUri already available, no second compress needed
        const pending = await queuePhoto(compressedUri, today, null);
        setPhotos(prev => [pending, ...prev]);
        Alert.alert('💾 Saved Locally', 'No internet. Photo saved on your phone and will upload automatically when you reconnect.');
      }
    } catch (e) {
      console.error('Photo error:', e);
      Alert.alert('Error', e?.message || 'Could not process photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    await uploadPhoto(result.assets[0].uri);
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Gallery access needed', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    await uploadPhoto(result.assets[0].uri);
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await supabase.storage.from('photos').remove([`${user.id}/${photoId}.jpg`]);
            await supabase.from('photos').delete().eq('id', photoId).eq('user_id', user.id);
            setPhotos(p => p.filter(x => x.id !== photoId));
          } catch (e) {
            Alert.alert('Error', 'Could not delete photo.');
          }
        },
      },
    ]);
  };

  const handleSaveWeight = async () => {
    if (!weightInput) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const weightVal = parseFloat(weightInput);
    if (isNaN(weightVal) || weightVal < 20 || weightVal > 400) {
      Alert.alert('Invalid weight', 'Please enter a weight between 20 and 400 kg.');
      return;
    }
    try {
      if (editingWeight) {
        await supabase.from('weight_log').update({ weight: weightVal }).eq('id', editingWeight.id);
      } else {
        try {
          // BUG-03 fix: use date+user_id as conflict key (not UUID id)
          await supabase.from('weight_log').upsert({
            user_id: user.id, weight: weightVal,
            date: today, notes: '', created_at: new Date().toISOString(),
          }, { onConflict: 'date,user_id' });
        } catch (networkErr) {
          // Offline fallback
          await queueWeightLog({ date: today, weight: weightVal });
          setWeightLogs(prev => {
            const filtered = prev.filter(l => l.date !== today);
            return [{ id: `local_${today}`, date: today, weight: weightVal, pending: true }, ...filtered];
          });
          setWeightModal(false); setWeightInput(''); setEditingWeight(null);
          Alert.alert('💾 Saved Locally', 'Weight saved offline and will sync when you reconnect.');
          return;
        }
      }

      // — Sync current weight + recalculate BMI in profile —
      try {
        const heightCm = userProfile?.height || 0;
        const bmi = heightCm > 0
          ? parseFloat((weightVal / Math.pow(heightCm / 100, 2)).toFixed(1))
          : null;

        // Fetch current starting_weight to preserve it (set once, never overwrite)
        const { data: prof } = await supabase
          .from('profiles').select('starting_weight').eq('id', user.id).single();
        const profileUpdate = {
          weight: weightVal,
          ...(bmi !== null && { bmi }),
          // Set starting_weight only once (first time weight is ever logged)
          ...(!prof?.starting_weight && { starting_weight: weightVal }),
        };
        await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
      } catch (_) { /* non-critical — don't block UI */ }

      setWeightModal(false); setWeightInput(''); setEditingWeight(null);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not save weight.');
    }
  };

  // Opens the weight modal — if today already has an entry, offer edit/delete
  const handleWeightButton = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntry = weightLogs.find(l => l.date === today);
    if (todayEntry) {
      Alert.alert(
        `Today: ${todayEntry.weight} kg`,
        'You already logged weight today. What would you like to do?',
        [
          {
            text: '✏️ Edit',
            onPress: () => {
              setEditingWeight(todayEntry);
              setWeightInput(String(todayEntry.weight));
              setWeightModal(true);
            },
          },
          {
            text: '🗑️ Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase.from('weight_log').delete().eq('id', todayEntry.id);
                loadData();
              } catch (e) {
                Alert.alert('Error', 'Could not delete weight.');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      setEditingWeight(null);
      setWeightInput('');
      setWeightModal(true);
    }
  };

  // ── Not yet unlocked ───────────────────────────────────────
  if (checkingLock) {
    return (
      <SafeAreaView style={[GlobalStyles.screen, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular' }}>Checking lock...</Text>
      </SafeAreaView>
    );
  }

  if (!unlocked && lockType === 'pin') {
    return (
      <PinUnlock
        onUnlock={() => setUnlocked(true)}
        onCancel={() => {}}
      />
    );
  }

  if (!unlocked) {
    return (
      <SafeAreaView style={[GlobalStyles.screen, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]} edges={['top']}>
        <Text style={{ fontSize: 44, marginBottom: 16 }}>🔒</Text>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
          Progress is locked
        </Text>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Your progress photos are protected.
        </Text>
        <TouchableOpacity
          style={GlobalStyles.primaryButton}
          onPress={async () => {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Progress' });
            if (result.success) setUnlocked(true);
          }}
        >
          <Text style={GlobalStyles.primaryButtonText}>Unlock with Fingerprint</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Unlocked content ────────────────────────────────────────
  return (
    <SafeAreaView style={[GlobalStyles.screen, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={GlobalStyles.spaceBetween}>
          <View>
            <Text style={styles.pageTitle}>Progress Gallery</Text>
            <Text style={styles.pageSub}>
              {photos.length === 0
                ? 'Stored privately — not in your gallery'
                : `${photos.length} photo${photos.length > 1 ? 's' : ''} — keep taking daily!`
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.addWeightBtn} onPress={handleWeightButton}>
            <Text style={styles.addWeightText}>+ Weight</Text>
          </TouchableOpacity>
        </View>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <View style={[GlobalStyles.card, styles.emptyCard]}>
            <Text style={styles.emptyIcon}>🖼️</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySub}>Take your Day 1 photo now.{'\n'}You'll thank yourself in 30 days.</Text>
            <TouchableOpacity
              style={[GlobalStyles.primaryButton, { marginTop: 16, width: '100%' }]}
              onPress={handleTakePhoto}
              disabled={uploading}
            >
              <Text style={GlobalStyles.primaryButtonText}>
                {uploading ? 'Uploading...' : 'Take Day 1 Photo 📸'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[GlobalStyles.ghostButton, { marginTop: 10, width: '100%' }]}
              onPress={handlePickFromGallery}
              disabled={uploading}
            >
              <Text style={GlobalStyles.ghostButtonText}>Upload from Gallery 🖼️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Auto transformation banners ── */}
            {(() => {
              const sorted = [...photos].sort((a, b) => a.date > b.date ? 1 : -1);
              const oldest = sorted[0];
              const newest = sorted[sorted.length - 1];
              const daySpan = oldest && newest
                ? Math.round((new Date(newest.date) - new Date(oldest.date)) / 86400000)
                : 0;
              const banners = [];
              if (daySpan >= 7) banners.push({
                emoji: '🔥', title: '7-Day Transformation!',
                sub: 'See how far you\'ve come in a week',
                before: sorted[0], after: sorted[sorted.length - 1],
              });
              if (daySpan >= 30) banners.push({
                emoji: '💪', title: '30-Day Transformation!',
                sub: 'A month of progress — incredible!',
                before: sorted[0], after: sorted[sorted.length - 1],
              });
              return banners.map(b => (
                <TouchableOpacity key={b.title} style={styles.transformBanner}
                  onPress={() => setTransformation({ before: b.before, after: b.after, title: b.title })}
                  activeOpacity={0.85}>
                  <Text style={styles.transformEmoji}>{b.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transformTitle}>{b.title}</Text>
                    <Text style={styles.transformSub}>{b.sub}</Text>
                  </View>
                  <Text style={{ color: Colors.primary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ));
            })()}

            {/* ── Header row with Compare button ── */}
            <View style={[GlobalStyles.spaceBetween, { marginTop: 4, marginBottom: 4 }]}>
              <Text style={styles.gridLabel}>
                {compareMode ? `Select 2 photos (${compareSelection.length}/2)` : `${photos.length} photos`}
              </Text>
              {photos.length >= 2 && (
                <TouchableOpacity onPress={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
                  style={[styles.compareBtn, compareMode && styles.compareBtnActive]}>
                  <Text style={[styles.compareBtnText, compareMode && { color: '#FFF' }]}>
                    {compareMode ? '✕ Cancel' : '⚖️ Compare'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Photo grid ── */}
            <View style={styles.photoGrid}>
              {photos.map((photo) => {
                const isSelected = compareSelection.some(p => p.id === photo.id);
                return (
                  <TouchableOpacity
                    key={photo.id}
                    style={[styles.photoCell, isSelected && styles.photoCellSelected]}
                    onPress={() => {
                      if (compareMode) {
                        if (isSelected) {
                          setCompareSelection(prev => prev.filter(p => p.id !== photo.id));
                        } else if (compareSelection.length < 2) {
                          const next = [...compareSelection, photo];
                          setCompareSelection(next);
                          if (next.length === 2) {
                            const sorted = [...next].sort((a, b) => a.date > b.date ? 1 : -1);
                            setTransformation({ before: sorted[0], after: sorted[1], title: 'Your Transformation' });
                            setCompareMode(false);
                            setCompareSelection([]);
                          }
                        }
                      } else {
                        setSelectedPhoto(photo);
                      }
                    }}
                    onLongPress={() => !compareMode && handleDeletePhoto(photo.id)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: photo.storageUrl }} style={styles.photoThumb} resizeMode="cover" />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoDate}>{photo.date?.slice(5)}</Text>
                      {photo.weight && <Text style={styles.photoWeight}>{photo.weight}kg</Text>}
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {/* Add photo cell */}
              {!compareMode && (
                <TouchableOpacity style={[styles.photoCell, styles.addPhotoCell]}
                  onPress={() => {
                    if (uploading) return;
                    Alert.alert('Add Photo', 'Choose source', [
                      { text: 'Camera 📷', onPress: handleTakePhoto },
                      { text: 'Gallery 🖼️', onPress: handlePickFromGallery },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }} disabled={uploading}>
                  <Text style={styles.addPhotoIcon}>📸</Text>
                  <Text style={styles.addPhotoText}>{uploading ? 'Uploading...' : 'Add photo'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {compareMode && compareSelection.length === 0 && (
              <View style={styles.compareHint}>
                <Text style={styles.compareHintText}>Tap 2 photos to compare them side by side</Text>
              </View>
            )}
          </>
        )}

        {/* Privacy note */}
        <View style={[GlobalStyles.orangeBox, { marginTop: 16 }]}>
          <Text style={styles.privacyTitle}>🔒 Privacy guarantee:</Text>
          <Text style={styles.privacyText}>
            Photos are stored inside FitRax only. They will never appear in your phone gallery or WhatsApp backup.
          </Text>
        </View>

        {/* Weight log */}
        <Text style={[GlobalStyles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>WEIGHT LOG</Text>

        {/* Chart — only shows when 2+ entries exist */}
        <WeightChart data={[...weightLogs].reverse()} />

        {weightLogs.length === 0 ? (
          <View style={[GlobalStyles.cardDeep, styles.weightEmpty]}>
            <Text style={styles.noDataText}>No weight data yet</Text>
            <Text style={styles.noDataSub}>Log your weight daily from the + Weight button above</Text>
          </View>
        ) : (
          <View style={{ gap: 8, marginTop: 16 }}>
            {weightLogs.slice(0, 10).map((log, i) => {
              const prev = weightLogs[i + 1];
              const change = prev ? (log.weight - prev.weight).toFixed(1) : null;
              return (
                <View key={log.id} style={[GlobalStyles.card, styles.weightRow]}>
                  <Text style={styles.weightDate}>{log.date}</Text>
                  <Text style={styles.weightVal}>{log.weight} kg</Text>
                  {change !== null && (
                    <Text style={[styles.weightChange, {
                      color: parseFloat(change) > 0 ? Colors.primary :
                             parseFloat(change) < 0 ? Colors.success : Colors.textSecondary
                    }]}>
                      {parseFloat(change) > 0 ? '+' : ''}{change}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Weight log modal */}
      <Modal visible={weightModal} transparent animationType="slide"
        onRequestClose={() => { setWeightModal(false); setWeightInput(''); setEditingWeight(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingWeight ? 'Edit Today\'s Weight' : 'Log Today\'s Weight'}
            </Text>
            <TextInput
              style={[GlobalStyles.input, { marginTop: 16 }]}
              placeholder="Weight in kg (e.g. 75.5)"
              placeholderTextColor={Colors.textMuted}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[GlobalStyles.primaryButton, { marginTop: 14 }]}
              onPress={handleSaveWeight}
              disabled={!weightInput}
            >
              <Text style={GlobalStyles.primaryButtonText}>
                {editingWeight ? 'Update Weight' : 'Save Weight'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 10, alignItems: 'center' }}
              onPress={() => { setWeightModal(false); setWeightInput(''); setEditingWeight(null); }}
            >
              <Text style={{ color: Colors.textSecondary, fontFamily: 'Outfit_400Regular', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fullscreen photo viewer */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
        statusBarTranslucent
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setSelectedPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.fullscreenCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.storageUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.fullscreenInfo}>
                <Text style={styles.fullscreenDate}>{selectedPhoto.date}</Text>
                {selectedPhoto.weight && (
                  <Text style={styles.fullscreenWeight}>{selectedPhoto.weight} kg</Text>
                )}
                <TouchableOpacity
                  onPress={() => { setSelectedPhoto(null); handleDeletePhoto(selectedPhoto.id); }}
                  style={styles.fullscreenDelete}
                >
                  <Text style={styles.fullscreenDeleteText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Transformation compare modal */}
      <TransformationModal
        visible={!!transformation}
        before={transformation?.before}
        after={transformation?.after}
        title={transformation?.title}
        onClose={() => setTransformation(null)}
      />
    </SafeAreaView>
  );
}

// Missing useEffect import fix

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  pageTitle: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: Colors.textPrimary },
  pageSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  addWeightBtn: {
    backgroundColor: Colors.bgCard, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  addWeightText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.primary },
  emptyCard: { alignItems: 'center', paddingVertical: 32, marginTop: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 6,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  photoDate: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: '#FFF' },
  photoWeight: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.primary },
  addPhotoCell: {
    backgroundColor: Colors.bgCard, borderWidth: 1.5,
    borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoIcon: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.textSecondary },
  addPhotoText: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  privacyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.primary, marginBottom: 6 },
  privacyText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  weightEmpty: { alignItems: 'center', paddingVertical: 24 },
  noDataText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  noDataSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  weightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  weightDate: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  weightVal: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 17, color: Colors.textPrimary },
  weightChange: { fontFamily: 'SpaceMono_400Regular', fontSize: 13, marginLeft: 10, width: 40, textAlign: 'right' },
  // Lock screen
  lockScreen: { flex: 1, backgroundColor: Colors.bg },
  lockBack: { paddingHorizontal: 24, paddingTop: 16 },
  lockBackText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary },
  lockLogo: {
    fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.primary,
    letterSpacing: 3, textAlign: 'center', marginTop: 40,
  },
  lockTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.textPrimary, textAlign: 'center', marginTop: 24 },
  lockSub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32, marginBottom: 32 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  pinDotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pinDotError: { backgroundColor: Colors.error, borderColor: Colors.error },
  pinKeypad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10 },
  pinKey: {
    width: '30%', aspectRatio: 1.4,
    backgroundColor: Colors.bgCard, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  pinKeyText: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.textPrimary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.textPrimary },
  // Transformation banners
  transformBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(230,92,0,0.1)', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.primary, marginBottom: 10, marginTop: 12,
  },
  transformEmoji: { fontSize: 28 },
  transformTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  transformSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSecondary },
  // Compare controls
  gridLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.5 },
  compareBtn: { backgroundColor: Colors.bgCard, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  compareBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  compareBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.textSecondary },
  photoCellSelected: { borderWidth: 3, borderColor: Colors.primary },
  selectedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.primary, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  selectedBadgeText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  compareHint: { alignItems: 'center', paddingVertical: 16 },
  compareHintText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  // Fullscreen photo viewer
  fullscreenOverlay: {
    flex: 1, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
  },
  fullscreenImage: { width: '100%', height: '80%' },
  fullscreenClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  fullscreenCloseText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  fullscreenInfo: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    alignItems: 'center', gap: 8,
  },
  fullscreenDate: { fontFamily: 'SpaceMono_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  fullscreenWeight: { fontFamily: 'SpaceMono_700Bold_Italic', fontSize: 20, color: Colors.primary },
  fullscreenDelete: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(255,50,50,0.2)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,50,50,0.4)',
  },
  fullscreenDeleteText: { color: '#FF6B6B', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
});