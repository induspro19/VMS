import { useEffect, useRef, useCallback, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChannelStatus =
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'ERROR';

export interface UseRealtimeHealthOptions {
  /** Unique Supabase channel name. Changing this tears down and recreates. */
  channelName: string;
  /** Register all .on() listeners on the provided channel before it subscribes. */
  setupListeners: (channel: RealtimeChannel) => void;
  /** Called once after a *reconnect* (not on first connect) so the caller can re-fetch. */
  onReconnect: () => void;
  /** Pause subscription when false — useful before user?.id is available. */
  enabled?: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a single Supabase Realtime channel with automatic health monitoring,
 * exponential-backoff reconnection, and network-change awareness.
 *
 * Guarantees:
 *  • Only one channel with `channelName` is ever active at a time.
 *  • Reconnects after CLOSED / CHANNEL_ERROR / TIMED_OUT with 1→2→4→…→60 s backoff.
 *  • Pauses while the browser is offline; resumes and re-fetches on `online` event.
 *  • Calls `onReconnect()` after every recovery so callers can sync stale data.
 *  • All verbose logs are behind `import.meta.env.DEV`.
 */
export function useRealtimeHealth({
  channelName,
  setupListeners,
  onReconnect,
  enabled = true,
}: UseRealtimeHealthOptions) {
  const [status, setStatus] = useState<ChannelStatus>('CONNECTING');

  // Stable refs — avoid stale closures in setTimeout callbacks
  const channelRef      = useRef<RealtimeChannel | null>(null);
  const retryCountRef   = useRef(0);
  const retryTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef    = useRef(false);
  const setupRef        = useRef(setupListeners);
  const onReconnectRef  = useRef(onReconnect);

  // Keep refs in sync without re-running effects
  setupRef.current      = setupListeners;
  onReconnectRef.current = onReconnect;

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const destroyChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current).catch(() => {/* ignore */});
      channelRef.current = null;
    }
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // ── Schedule a reconnect with exponential backoff ─────────────────────────
  const scheduleReconnect = useCallback(
    (connectFn: () => void) => {
      if (unmountedRef.current) return;
      const delay = Math.min(1_000 * Math.pow(2, retryCountRef.current), 60_000);
      retryCountRef.current += 1;
      setStatus('RECONNECTING');
      if (import.meta.env.DEV) {
        console.debug(
          `[RealtimeHealth] ${channelName} — reconnecting in ${delay}ms (attempt #${retryCountRef.current})`
        );
      }
      retryTimerRef.current = setTimeout(() => {
        if (unmountedRef.current) return;
        if (!navigator.onLine) {
          // Still offline — stay DISCONNECTED; the 'online' handler will connect later
          setStatus('DISCONNECTED');
          return;
        }
        connectFn();
      }, delay);
    },
    [channelName]
  );

  // ── Create and subscribe to the channel ───────────────────────────────────
  const connect = useCallback(() => {
    if (unmountedRef.current || !enabled) return;

    destroyChannel();

    if (import.meta.env.DEV) {
      console.debug(`[RealtimeHealth] ${channelName} — connecting…`);
    }

    const isFirstConnect = retryCountRef.current === 0;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Let the caller attach event listeners before we subscribe
    setupRef.current(channel);

    channel.subscribe((subStatus, err) => {
      if (unmountedRef.current) return;

      if (import.meta.env.DEV) {
        console.debug(`[RealtimeHealth] ${channelName} — status: ${subStatus}`, err ?? '');
      }

      switch (subStatus) {
        case 'SUBSCRIBED':
          setStatus('SUBSCRIBED');
          if (!isFirstConnect) {
            // We recovered from a disconnect — tell the caller to re-sync data
            if (import.meta.env.DEV) {
              console.debug(`[RealtimeHealth] ${channelName} — reconnected, triggering data refresh`);
            }
            onReconnectRef.current();
          }
          retryCountRef.current = 0; // reset backoff counter on success
          break;

        case 'CHANNEL_ERROR':
          setStatus('ERROR');
          scheduleReconnect(connect);
          break;

        case 'TIMED_OUT':
        case 'CLOSED':
          setStatus('DISCONNECTED');
          scheduleReconnect(connect);
          break;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, destroyChannel, scheduleReconnect]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    unmountedRef.current = false;
    connect();

    const handleOnline = () => {
      if (import.meta.env.DEV) {
        console.debug(`[RealtimeHealth] ${channelName} — browser online, reconnecting`);
      }
      retryCountRef.current = 0; // fresh backoff from 1 s
      connect();
    };

    const handleOffline = () => {
      if (import.meta.env.DEV) {
        console.debug(`[RealtimeHealth] ${channelName} — browser offline`);
      }
      setStatus('DISCONNECTED');
      destroyChannel();
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unmountedRef.current = true;
      destroyChannel();
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, connect, destroyChannel]);

  return { status };
}
