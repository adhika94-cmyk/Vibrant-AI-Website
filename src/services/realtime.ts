import { ref, computed } from 'vue';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface VoteNotification {
  id: string;
  message: string; // "Siswa baru saja memberikan suara"
  timestamp: string; // ISO string
  read: boolean;
  kategori?: 'siswa' | 'guru';
  kelas?: string;
}

const STORAGE_NOTIF_KEY = 'eosis_admin_realtime_notifications';
const CHANNEL_NAME = 'eosis-admin-realtime';
const BROADCAST_EVENT = 'vote_cast';

class RealtimeNotificationService {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private audioEnabled: boolean = true;
  private listeners: Array<(notif: VoteNotification) => void> = [];

  public notifications = ref<VoteNotification[]>([]);
  public activeToasts = ref<VoteNotification[]>([]);
  public isConnected = ref<boolean>(false);
  public lastEventTime = ref<string | null>(null);

  constructor() {
    this.loadPersistedNotifications();
    this.setupLocalBroadcast();
  }

  /**
   * Muat riwayat notifikasi dari sessionStorage
   */
  private loadPersistedNotifications() {
    try {
      const raw = sessionStorage.getItem(STORAGE_NOTIF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.notifications.value = parsed.slice(0, 50);
        }
      }
    } catch (e) {
      console.warn('[Realtime] Gagal memuat riwayat notifikasi', e);
    }
  }

  /**
   * Simpan riwayat notifikasi ke sessionStorage
   */
  private persistNotifications() {
    try {
      sessionStorage.setItem(
        STORAGE_NOTIF_KEY,
        JSON.stringify(this.notifications.value.slice(0, 50))
      );
    } catch (e) {
      console.warn('[Realtime] Gagal menyimpan riwayat notifikasi', e);
    }
  }

  /**
   * Setup kanal lokal (BroadcastChannel & storage event) untuk sinkronisasi multi-tab
   */
  private setupLocalBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcastChannel = new BroadcastChannel('eosis-realtime-channel');
        this.localBroadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'vote_cast') {
            this.handleIncomingNotification(event.data.payload, false);
          }
        };
      } catch (e) {
        console.warn('[Realtime] BroadcastChannel init fallback', e);
      }
    }

    // Storage event fallback untuk browser cross-tab
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'eosis_realtime_vote_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncomingNotification(data, false);
          } catch {}
        }
      });
    }
  }

  /**
   * Inisialisasi Supabase Realtime Channel
   */
  public initRealtime(client: SupabaseClient | null) {
    this.supabase = client;

    // Bersihkan channel sebelumnya jika ada
    if (this.channel && this.supabase) {
      try {
        this.supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[Realtime] Gagal melepaskan channel lama', e);
      }
      this.channel = null;
    }

    if (!this.supabase) {
      this.isConnected.value = false;
      return;
    }

    try {
      // Buat channel real-time Supabase untuk notifikasi admin
      this.channel = this.supabase.channel(CHANNEL_NAME, {
        config: {
          broadcast: {
            self: true // Terima juga broadcast yang dikirim oleh tab yang sama jika relevan
          }
        }
      });

      // 1. Dengarkan Supabase Realtime Broadcast Event
      this.channel.on('broadcast', { event: BROADCAST_EVENT }, (response: any) => {
        console.log('[Realtime Supabase] Broadcast diterima:', response);
        const payload = response.payload || response;
        this.handleIncomingNotification(payload, false);
      });

      // 2. Dengarkan Supabase Postgres Changes pada tabel 'siswa' jika replication aktif
      this.channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'siswa',
          filter: 'sudah_memilih=eq.true'
        },
        (payload: any) => {
          console.log('[Realtime Supabase] Postgres change siswa:', payload);
          this.handleIncomingNotification(
            {
              id: 'pg-' + (payload.new?.id || Date.now()),
              message: 'Siswa baru saja memberikan suara',
              timestamp: new Date().toISOString(),
              kategori: payload.new?.kategori || 'siswa',
              read: false
            },
            false
          );
        }
      );

      // 3. Dengarkan Supabase Postgres Changes pada tabel 'suara' atau 'votes'
      this.channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        () => {
          this.handleIncomingNotification(
            {
              id: 'pg-vote-' + Date.now(),
              message: 'Siswa baru saja memberikan suara',
              timestamp: new Date().toISOString(),
              read: false
            },
            false
          );
        }
      );

      // Subscribe ke channel
      this.channel.subscribe((status: string) => {
        console.log(`[Realtime Supabase] Status Channel '${CHANNEL_NAME}': ${status}`);
        this.isConnected.value = status === 'SUBSCRIBED';
      });
    } catch (err) {
      console.warn('[Realtime Supabase] Gagal inisialisasi Realtime Channel', err);
      this.isConnected.value = false;
    }
  }

  /**
   * Broadcast notifikasi ketika siswa berhasil memberikan suara
   */
  public async broadcastVoteCast(customPayload?: Partial<VoteNotification>) {
    const notif: VoteNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      message: 'Siswa baru saja memberikan suara',
      timestamp: new Date().toISOString(),
      read: false,
      kategori: customPayload?.kategori || 'siswa',
      kelas: customPayload?.kelas
    };

    // 1. Kirim via Supabase Realtime Broadcast (WebSocket)
    if (this.channel && this.supabase) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: BROADCAST_EVENT,
          payload: notif
        });
        console.log('[Realtime Supabase] Sukses mengirim broadcast notifikasi ke Supabase Realtime');
      } catch (err) {
        console.warn('[Realtime Supabase] Gagal mengirim broadcast', err);
      }
    }

    // 2. Kirim via Local BroadcastChannel (sinkronisasi instan antar-tab/jendela)
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          type: 'vote_cast',
          payload: notif
        });
      } catch {}
    }

    // 3. Simpan ke local event trigger
    try {
      localStorage.setItem('eosis_realtime_vote_event', JSON.stringify({ ...notif, _ts: Date.now() }));
    } catch {}

    // 4. Masukkan ke notifikasi lokal tab pemanggil
    this.handleIncomingNotification(notif, true);
  }

  /**
   * Tangani notifikasi yang masuk (dari Supabase WebSocket, BroadcastChannel, atau lokal)
   */
  private handleIncomingNotification(raw: any, isSelfEmit: boolean = false) {
    if (!raw) return;

    const notif: VoteNotification = {
      id: raw.id || 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      message: raw.message || 'Siswa baru saja memberikan suara',
      timestamp: raw.timestamp || new Date().toISOString(),
      read: false,
      kategori: raw.kategori || 'siswa',
      kelas: raw.kelas
    };

    // Mencegah duplikasi cepat (idempotensi dalam jendela 1.5 detik)
    const isDuplicate = this.notifications.value.some(
      (n) => n.id === notif.id || (n.timestamp === notif.timestamp && n.message === notif.message)
    );
    if (isDuplicate) return;

    // Tambah ke daftar riwayat notifikasi (paling baru di atas)
    this.notifications.value.unshift(notif);
    if (this.notifications.value.length > 50) {
      this.notifications.value.pop();
    }
    this.persistNotifications();

    this.lastEventTime.value = notif.timestamp;

    // Tampilkan Toast mengambang di layar
    this.showToast(notif);

    // Mainkan nada dering halus jika diizinkan
    this.playChime();

    // Beritahukan semua subscriber callback (misal auto-refresh grafik dashboard)
    this.listeners.forEach((cb) => {
      try {
        cb(notif);
      } catch (e) {
        console.error('[Realtime] Error in notification listener', e);
      }
    });
  }

  /**
   * Menampilkan toast notification yang otomatis menghilang setelah 6 detik
   */
  private showToast(notif: VoteNotification) {
    this.activeToasts.value.unshift(notif);

    // Batasi maks 3 toast bertumpuk di layar agar tidak memenuhi antarmuka
    if (this.activeToasts.value.length > 3) {
      this.activeToasts.value.pop();
    }

    // Auto dismiss setelah 6 detik
    setTimeout(() => {
      this.dismissToast(notif.id);
    }, 6000);
  }

  public dismissToast(id: string) {
    const idx = this.activeToasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.activeToasts.value.splice(idx, 1);
    }
  }

  /**
   * Daftarkan pendengar event kustom (misal untuk refresh otomatis statistik dashboard)
   */
  public onVoteEvent(callback: (notif: VoteNotification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Tandai satu notifikasi sebagai telah dibaca
   */
  public markAsRead(id: string) {
    const target = this.notifications.value.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.persistNotifications();
    }
  }

  /**
   * Tandai semua notifikasi sebagai telah dibaca
   */
  public markAllAsRead() {
    this.notifications.value.forEach((n) => (n.read = true));
    this.persistNotifications();
  }

  /**
   * Kosongkan seluruh riwayat notifikasi
   */
  public clearAll() {
    this.notifications.value = [];
    this.activeToasts.value = [];
    this.persistNotifications();
  }

  /**
   * Toggle audio chime on/off
   */
  public toggleAudio(): boolean {
    this.audioEnabled = !this.audioEnabled;
    return this.audioEnabled;
  }

  public isAudioActive(): boolean {
    return this.audioEnabled;
  }

  /**
   * Sintesis suara lonceng notifikasi harmonis (Web Audio API murni tanpa file eksternal)
   */
  public playChime() {
    if (!this.audioEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Dua nada harmonik cepat (C6 - E6 / 1046Hz - 1318Hz)
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio autoplay policy mungkin membatasi jika belum ada interaksi pengguna
    }
  }
}

export const realtimeService = new RealtimeNotificationService();
