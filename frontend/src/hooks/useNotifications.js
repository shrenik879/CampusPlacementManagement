import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import api from '../services/api';
import toast from 'react-hot-toast';

const RECONNECT_DELAY_MS = 5000;

/**
 * WebSocket notification hook using STOMP over SockJS.
 *
 * The backend uses .withSockJS() so we must use the SockJS client via
 * webSocketFactory — NOT the raw brokerURL — otherwise the handshake fails
 * and the bell stays "Offline".
 *
 * Subscribes to:
 *   /user/queue/notifications  — personal (status / round / broadcast)
 *   /topic/jobs                — new job posted (all students)
 */
export default function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected]         = useState(false);
  const clientRef  = useRef(null);
  const toastedIds = useRef(new Set());

  // ── Initial load via REST ─────────────────────────────────────────────────
  const loadInitial = useCallback(async () => {
    if (!enabled) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      const data = res.data || [];
      setNotifications(data);
      data.forEach(n => toastedIds.current.add(n.id));
    } catch { /* silent */ }
  }, [enabled]);

  // ── Add incoming notification ─────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    if (!notif?.id) return;
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      return [{ ...notif, read: false }, ...prev].slice(0, 50);
    });
    if (!toastedIds.current.has(notif.id)) {
      toastedIds.current.add(notif.id);
      const icon =
        notif.type === 'broadcast'          ? '📢' :
        notif.type === 'new_job'            ? '🆕' :
        notif.roundStatus === 'PASSED'      ? '✅' :
        notif.roundStatus === 'FAILED'      ? '❌' :
        notif.status     === 'SELECTED'     ? '🎉' :
        notif.status     === 'REJECTED'     ? '❌' : '📋';
      toast(notif.message || 'New notification', { duration: 5000, icon });
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  }, []);

  // ── WebSocket lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    loadInitial();

    const token = localStorage.getItem('token');
    if (!token) return;

    // Dynamically import SockJS so Vite doesn't break on SSR-like contexts
    let client;
    import('sockjs-client').then(({ default: SockJS }) => {
      client = new Client({
        // SockJS factory — REQUIRED when backend uses .withSockJS()
        webSocketFactory: () => new SockJS(
          `http://localhost:8081/ws?token=${encodeURIComponent(token)}`
        ),
        reconnectDelay: RECONNECT_DELAY_MS,
        onConnect: () => {
          setConnected(true);

          // Personal channel
          client.subscribe('/user/queue/notifications', (msg) => {
            try { addNotification(JSON.parse(msg.body)); } catch { /* skip */ }
          });

          // Broadcast channel (new jobs)
          client.subscribe('/topic/jobs', (msg) => {
            try { addNotification(JSON.parse(msg.body)); } catch { /* skip */ }
          });
        },
        onDisconnect:  () => setConnected(false),
        onStompError:  ()  => setConnected(false),
        onWebSocketError: () => setConnected(false),
      });

      client.activate();
      clientRef.current = client;
    }).catch(() => {
      // sockjs-client not available — stay offline gracefully
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setConnected(false);
    };
  }, [enabled, loadInitial, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, connected, markAllRead };
}
