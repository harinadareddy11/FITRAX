// src/hooks/useOfflineSync.js
// Handles NetInfo listening and background sync trigger
import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncAll, getPendingCount } from '../services/offlineQueue';
import useAuthStore from '../store/useAuthStore';

export default function useOfflineSync() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const wasOffline = useRef(false);

  const refreshPending = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!user?.id || syncing) return;
    const count = await getPendingCount();
    if (count === 0) return;
    setSyncing(true);
    try {
      const result = await syncAll(user.id);
      if (result.synced > 0) console.log(`[Sync] ✓ ${result.synced} items uploaded`);
      if (result.failed > 0) console.log(`[Sync] ✗ ${result.failed} items failed permanently`);
    } catch (e) {
      console.log('[Sync] error:', e.message);
    } finally {
      await refreshPending();
      setSyncing(false);
    }
  }, [user?.id, syncing, refreshPending]);

  useEffect(() => {
    // Check pending on mount
    refreshPending();

    // Listen for network changes
    const unsub = NetInfo.addEventListener(state => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online && wasOffline.current) {
        // Just came back online → trigger sync
        triggerSync();
      }
      wasOffline.current = !online;
    });

    return () => unsub();
  }, [user?.id]);

  return { isOnline, pendingCount, syncing, triggerSync, refreshPending };
}
