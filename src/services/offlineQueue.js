// src/services/offlineQueue.js
// Offline-first sync queue for sessions, weight logs, and photos
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase/client';
import { updateStreakAfterSession } from './streakService';

const QUEUE_KEY   = 'fitrax_sync_queue';
const PHOTOS_DIR  = FileSystem.documentDirectory + 'pending_photos/';

// ── Internal helpers ──────────────────────────────────────────────────────────
async function ensurePhotosDir() {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns count of pending items */
export async function getPendingCount() {
  const q = await readQueue();
  return q.length;
}

/** Returns all pending photo objects (for local display before sync) */
export async function getPendingPhotos() {
  const q = await readQueue();
  return q.filter(i => i.type === 'photo').map(i => ({
    id: i.id,
    storageUrl: i.data.localPath, // local file URI, shows in Image component
    date: i.data.date,
    weight: i.data.weight,
    pending: true,
  }));
}

/** Queue a workout session for later sync */
export async function queueSession(payload) {
  const queue = await readQueue();
  queue.push({ id: `session_${Date.now()}`, type: 'session', data: payload, retries: 0, ts: Date.now() });
  await writeQueue(queue);
}

/** Queue a weight log entry */
export async function queueWeightLog(payload) {
  const queue = await readQueue();
  // Remove any existing same-day entry first (prevent duplicates on sync)
  const filtered = queue.filter(i => !(i.type === 'weight_log' && i.data.date === payload.date));
  filtered.push({ id: `weight_${Date.now()}`, type: 'weight_log', data: payload, retries: 0, ts: Date.now() });
  await writeQueue(filtered);
}

/** Save compressed image locally and queue for upload. Returns a "pending" photo object. */
export async function queuePhoto(compressedUri, date, weight) {
  await ensurePhotosDir();
  const filename = `photo_${Date.now()}.jpg`;
  const localPath = PHOTOS_DIR + filename;
  await FileSystem.copyAsync({ from: compressedUri, to: localPath });
  const queue = await readQueue();
  const id = `photo_${Date.now()}`;
  queue.push({ id, type: 'photo', data: { localPath, filename, date, weight }, retries: 0, ts: Date.now() });
  await writeQueue(queue);
  return { id, storageUrl: localPath, date, weight, pending: true };
}

/** Main sync — call this when network comes back. Returns { synced, failed } */
export async function syncAll(userId) {
  if (!userId) return { synced: 0, failed: 0 };
  const queue = await readQueue();
  if (!queue.length) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      switch (item.type) {
        case 'session':    await _syncSession(userId, item.data);    break;
        case 'weight_log': await _syncWeightLog(userId, item.data);  break;
        case 'photo':      await _syncPhoto(userId, item.data);      break;
      }
      synced++;
    } catch (e) {
      console.log(`[Sync] failed ${item.type}:`, e.message);
      item.retries = (item.retries || 0) + 1;
      if (item.retries < 4) remaining.push(item); // give up after 3 retries
      else failed++;
    }
  }

  await writeQueue(remaining);
  return { synced, failed };
}

// ── Sync handlers ─────────────────────────────────────────────────────────────

async function _syncSession(userId, d) {
  // Deduplicate: skip if session already exists
  const { data: existing } = await supabase
    .from('workout_sessions').select('id').eq('id', d.sessionId).maybeSingle();
  if (existing) return; // already uploaded (maybe from previous attempt)

  const { error } = await supabase.from('workout_sessions').insert({
    id: d.sessionId,
    user_id: userId,
    date: d.date,
    type: d.splitType?.toLowerCase().replace(' ', '_') || 'custom',
    day_name: d.dayName,
    split_type: d.splitType,
    exercises: d.exercises,
    total_volume_kg: d.totalVolumeKg,
    duration: d.duration,
    logging_mode: d.loggingMode,
  });
  if (error) throw error;
  await updateStreakAfterSession(userId);
}

async function _syncWeightLog(userId, d) {
  // Delete any existing entry for the same date first (clean upsert)
  await supabase.from('weight_log').delete().eq('user_id', userId).eq('date', d.date);
  const { error } = await supabase.from('weight_log').insert({ user_id: userId, date: d.date, weight: d.weight });
  if (error) throw error;
}

async function _syncPhoto(userId, d) {
  // Read compressed local file
  const base64 = await FileSystem.readAsStringAsync(d.localPath, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);

  // Use same bucket ('photos') and table ('photos') as the online upload path
  const photoId = d.filename.replace('photo_', '').replace('.jpg', ''); // reuse the original timestamp id
  const storagePath = `${userId}/${photoId}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from('photos')  // ✅ BUG-02 fix: was 'progress-photos' — wrong bucket
    .upload(storagePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
  if (uploadErr) throw uploadErr;

  const { error: dbErr } = await supabase.from('photos').insert({  // ✅ BUG-02 fix: was 'progress_photos' — wrong table
    id: photoId,
    user_id: userId,
    date: d.date,
    storage_url: storagePath,
    weight: d.weight || null,
    notes: '',
    created_at: new Date().toISOString(),
  });
  if (dbErr) throw dbErr;

  // Delete local file after successful upload
  await FileSystem.deleteAsync(d.localPath, { idempotent: true });
}

