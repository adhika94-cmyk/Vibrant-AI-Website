<template>
  <div class="admin-wrapper">
    <!-- Backdrop for mobile drawer -->
    <div 
      v-if="isMobileSidebarOpen" 
      class="sidebar-backdrop" 
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar" :class="{ 'show': isMobileSidebarOpen }">
      <div class="sidebar-brand">
        <img 
          :src="settings.logo_sekolah || defaultLogo" 
          alt="Logo Sekolah" 
          class="rounded"
          style="width: 38px; height: 38px; object-fit: contain; background: #fff; padding: 2px;"
        />
        <div class="text-truncate">
          <div class="fw-bold text-white fs-6 lh-1">eOSIS SPENDA</div>
          <small class="text-white-50 text-truncate d-block" style="font-size: 0.75rem;">
            {{ settings.nama_sekolah }}
          </small>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="px-3 pb-2 text-uppercase text-white-50 fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
          Menu Utama
        </div>
        
        <router-link to="/admin/beranda" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-grid-1x2"></i>
          <span>Beranda</span>
        </router-link>

        <router-link to="/admin/kelas" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-buildings"></i>
          <span>Kelas</span>
        </router-link>

        <router-link to="/admin/siswa" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-people"></i>
          <span>Siswa</span>
        </router-link>

        <router-link to="/admin/guru" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-person-workspace"></i>
          <span>Guru & Staf</span>
        </router-link>

        <router-link to="/admin/kandidat" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-person-badge"></i>
          <span>Calon Kandidat</span>
        </router-link>

        <router-link to="/admin/perolehan-suara" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-bar-chart-line"></i>
          <span>Perolehan Suara</span>
        </router-link>

        <div class="px-3 pt-3 pb-2 text-uppercase text-white-50 fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em;">
          Sistem
        </div>

        <router-link to="/admin/pengaturan" class="sidebar-link" @click="isMobileSidebarOpen = false">
          <i class="bi bi-sliders"></i>
          <span>Pengaturan</span>
        </router-link>

        <button type="button" class="sidebar-link border-0 w-100 text-start bg-transparent text-danger-emphasis" @click="triggerLogout">
          <i class="bi bi-box-arrow-right text-danger"></i>
          <span class="text-danger">Keluar</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="d-flex align-items-center justify-content-between">
          <div class="text-truncate me-2">
            <span class="d-block text-white fw-medium text-truncate" style="font-size: 0.85rem;">
              {{ currentAdmin?.nama_lengkap || 'Administrator' }}
            </span>
            <span class="d-block text-white-50" style="font-size: 0.75rem;">
              @{{ currentAdmin?.username }}
            </span>
          </div>
          <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-mono-numbers" style="font-size: 0.7rem;">
            {{ isSupabaseActive ? 'Supabase' : 'Local DB' }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-content-area">
      <!-- Top Header Bar -->
      <header class="border-bottom px-3 px-lg-4 py-2 d-flex align-items-center justify-content-between sticky-top top-header" style="z-index: 1020; background-color: #b8b2b2;">
        <div class="d-flex align-items-center gap-3">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm d-lg-none"
            @click="isMobileSidebarOpen = !isMobileSidebarOpen"
            aria-label="Toggle Navigation"
          >
            <i class="bi bi-list fs-5"></i>
          </button>
          <div class="d-none d-sm-block">
            <span class="fw-semibold text-dark fs-6">{{ pageTitle }}</span>
            <span class="text-muted mx-2">·</span>
            <span class="text-muted small">Periode {{ settings.periode_pemilihan }}</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 gap-sm-3">
          <div class="d-flex align-items-center gap-2">
            <span 
              class="badge rounded-pill d-flex align-items-center gap-1"
              :class="settings.voting_dibuka ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
            >
              <i class="bi" :class="settings.voting_dibuka ? 'bi-check-circle-fill' : 'bi-lock-fill'"></i>
              <span class="d-none d-sm-inline">{{ settings.voting_dibuka ? 'Pemilihan Dibuka' : 'Pemilihan Ditutup' }}</span>
              <span class="d-inline d-sm-none">{{ settings.voting_dibuka ? 'Buka' : 'Tutup' }}</span>
            </span>
          </div>

          <!-- Real-Time Notification Bell Dropdown -->
          <div class="position-relative">
            <button 
              type="button" 
              class="btn btn-light btn-sm position-relative border d-flex align-items-center justify-content-center shadow-xs"
              style="width: 36px; height: 36px; border-radius: 8px;"
              @click.stop="toggleNotificationMenu"
              title="Notifikasi Real-Time Suara Masuk"
              aria-label="Notifikasi Real-Time"
            >
              <i 
                class="bi" 
                :class="unreadCount > 0 ? 'bi-bell-fill text-primary animate-bell' : 'bi-bell text-secondary'"
                style="font-size: 1.05rem;"
              ></i>
              <span 
                v-if="unreadCount > 0" 
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white font-mono-numbers shadow-sm"
                style="font-size: 0.65rem; padding: 0.25em 0.5em;"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>

            <!-- Backdrop to close dropdown -->
            <div 
              v-if="showNotificationMenu" 
              class="position-fixed top-0 start-0 w-100 h-100" 
              style="z-index: 1045;" 
              @click="showNotificationMenu = false"
            ></div>

            <!-- Dropdown Panel -->
            <div 
              v-if="showNotificationMenu" 
              class="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border overflow-hidden animate__animated animate__fadeIn"
              style="width: 360px; max-width: 90vw; z-index: 1050; border-color: #cbd5e1;"
            >
              <!-- Dropdown Header -->
              <div class="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold text-dark small mb-0">Notifikasi Suara Masuk</span>
                    <span 
                      class="badge d-inline-flex align-items-center gap-1 font-mono-numbers" 
                      :class="isRealtimeConnected ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'"
                      style="font-size: 0.65rem;"
                    >
                      <span class="pulse-dot" :class="isRealtimeConnected ? 'bg-success' : 'bg-primary'"></span>
                      <span>{{ isRealtimeConnected ? 'Supabase Live' : 'Realtime Aktif' }}</span>
                    </span>
                  </div>
                  <small class="text-muted" style="font-size: 0.7rem;">
                    {{ notifications.length }} riwayat suara diterima
                  </small>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <!-- Audio Mute Toggle -->
                  <button 
                    type="button" 
                    class="btn btn-sm btn-link p-1 text-secondary"
                    @click="toggleAudio"
                    :title="isAudioOn ? 'Matikan nada dering notifikasi' : 'Aktifkan nada dering notifikasi'"
                  >
                    <i class="bi" :class="isAudioOn ? 'bi-volume-up-fill text-primary' : 'bi-volume-mute-fill text-muted'"></i>
                  </button>
                  <!-- Clear all -->
                  <button 
                    v-if="notifications.length > 0"
                    type="button" 
                    class="btn btn-sm btn-link p-1 text-secondary text-decoration-none"
                    style="font-size: 0.72rem;"
                    @click="markAllAsRead"
                    title="Tandai semua dibaca"
                  >
                    <i class="bi bi-check2-all text-primary"></i>
                  </button>
                </div>
              </div>

              <!-- Notification List Body -->
              <div class="overflow-y-auto" style="max-height: 320px;">
                <div v-if="notifications.length === 0" class="text-center py-4 px-3 text-muted">
                  <i class="bi bi-bell-slash fs-2 text-secondary opacity-50 mb-1 d-block"></i>
                  <span class="small d-block fw-semibold text-dark">Belum ada suara masuk</span>
                  <small style="font-size: 0.725rem;">
                    Sistem mendengarkan siaran real-time Supabase saat siswa memberikan suara di bilik suara.
                  </small>
                </div>

                <div 
                  v-for="notif in notifications" 
                  :key="notif.id"
                  class="p-3 border-bottom d-flex align-items-start gap-2 transition-all"
                  :class="notif.read ? 'bg-white opacity-75' : 'bg-primary-subtle bg-opacity-25'"
                  @click="markAsRead(notif.id)"
                  style="cursor: pointer;"
                >
                  <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style="width: 28px; height: 28px;">
                    <i class="bi bi-check-lg" style="font-size: 0.85rem;"></i>
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-baseline justify-content-between gap-1 mb-1">
                      <span class="fw-bold text-dark small text-truncate">
                        {{ notif.message }}
                      </span>
                      <span class="text-muted font-mono-numbers" style="font-size: 0.675rem; white-space: nowrap;">
                        {{ formatRelativeTime(notif.timestamp) }}
                      </span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span 
                        class="badge border font-mono-numbers"
                        :class="notif.kategori === 'guru' ? 'bg-info-subtle text-info border-info-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'"
                        style="font-size: 0.65rem;"
                      >
                        {{ (notif.kategori || 'SISWA').toUpperCase() }}
                      </span>
                      <span class="text-muted font-mono-numbers" style="font-size: 0.7rem;">
                        {{ formatShortTime(notif.timestamp) }}
                      </span>
                    </div>
                  </div>
                  <span v-if="!notif.read" class="p-1 rounded-circle bg-primary flex-shrink-0 mt-2" style="width: 6px; height: 6px;"></span>
                </div>
              </div>

              <!-- Dropdown Footer -->
              <div class="p-2 px-3 bg-light border-top d-flex align-items-center justify-content-between">
                <button 
                  type="button" 
                  class="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                  style="font-size: 0.725rem;"
                  @click="testRealtimeBroadcast"
                  title="Simulasikan notifikasi suara masuk untuk pengujian"
                >
                  <i class="bi bi-broadcast me-1 text-primary"></i>Uji Real-Time
                </button>
                <button 
                  v-if="notifications.length > 0"
                  type="button" 
                  class="btn btn-link btn-sm text-decoration-none p-0 text-danger"
                  style="font-size: 0.725rem;"
                  @click="clearAllNotifications"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
            @click="showWifiModal = true"
            title="Akses Jaringan Wi-Fi & QR Code Pemilih"
          >
            <i class="bi bi-qr-code-scan"></i>
            <span class="d-none d-sm-inline">Akses Wi-Fi & HP</span>
          </button>

          <router-link to="/" target="_blank" class="btn btn-outline-primary btn-sm d-none d-md-inline-flex align-items-center gap-1">
            <i class="bi bi-box-arrow-up-right"></i>
            <span>Buka Portal Siswa</span>
          </router-link>

          <button class="btn btn-light btn-sm text-danger border" @click="triggerLogout" title="Keluar">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      <!-- Floating Real-Time Toast Notifications (Top Right) -->
      <div 
        class="toast-container position-fixed top-0 end-0 p-3" 
        style="z-index: 2060; margin-top: 55px; pointer-events: none;"
      >
        <transition-group name="toast-slide">
          <div 
            v-for="toast in activeToasts" 
            :key="toast.id" 
            class="toast show shadow-lg border-0 mb-2"
            role="alert"
            style="pointer-events: auto; border-radius: 12px; overflow: hidden; background: #ffffff; min-width: 320px; max-width: 380px; border-left: 5px solid #10b981 !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;"
          >
            <div class="toast-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <span class="p-1 rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                  <i class="bi bi-check-lg" style="font-size: 0.8rem;"></i>
                </span>
                <strong class="text-dark small">Suara Baru Masuk</strong>
                <span class="badge bg-success text-white font-mono-numbers px-2 py-0.5 rounded-pill" style="font-size: 0.65rem;">
                  LIVE
                </span>
              </div>
              <small class="text-muted font-mono-numbers ms-2" style="font-size: 0.7rem;">
                {{ formatShortTime(toast.timestamp) }}
              </small>
              <button type="button" class="btn-close ms-2" @click="dismissToast(toast.id)" aria-label="Close"></button>
            </div>
            <div class="toast-body py-2 px-3">
              <div class="fw-bold text-dark fs-6 mb-1">
                {{ toast.message }}
              </div>
              <div class="text-muted small d-flex align-items-center gap-1" style="font-size: 0.75rem;">
                <i class="bi bi-shield-check text-success"></i>
                <span>Tercatat aman & rahasia melalui Supabase Realtime</span>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- View Container -->
      <main class="p-3 p-lg-4 flex-grow-1" style="background-color: #b8b2b2;">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-top py-2 px-4 text-center text-muted small">
        <span>&copy; {{ new Date().getFullYear() }} {{ settings.nama_sekolah }} · Sistem Pemilihan OSIS Demokratis (eOSIS)</span>
      </footer>
    </div>

    <!-- Modal Konfirmasi Logout -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showLogoutModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showLogoutModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-4">
            <div class="text-danger mb-3">
              <i class="bi bi-exclamation-circle fs-1"></i>
            </div>
            <h5 class="fw-bold mb-2">Konfirmasi Keluar</h5>
            <p class="text-muted small mb-4">
              Apakah Anda yakin ingin keluar dari sesi administrator eOSIS?
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button type="button" class="btn btn-outline-secondary btn-sm px-3" @click="showLogoutModal = false">
                Batal
              </button>
              <button type="button" class="btn btn-danger btn-sm px-3" @click="confirmLogout">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Konfigurasi Akses Wi-Fi & QR Code Bilik Suara -->
    <WifiAccessModal 
      :show="showWifiModal" 
      :school-name="settings.nama_sekolah" 
      :school-logo="settings.logo_sekolah" 
      @close="showWifiModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService, AdminSession } from '../services/auth';
import { dbService } from '../services/db';
import { realtimeService } from '../services/realtime';
import WifiAccessModal from '../components/WifiAccessModal.vue';
import type { Pengaturan } from '../types';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const router = useRouter();
const route = useRoute();

const isMobileSidebarOpen = ref(false);
const showLogoutModal = ref(false);
const showWifiModal = ref(false);
const showNotificationMenu = ref(false);
const currentAdmin = ref<AdminSession | null>(null);
const settings = ref<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

const isSupabaseActive = computed(() => dbService.isUsingSupabase());
const isRealtimeConnected = computed(() => realtimeService.isConnected.value);
const notifications = computed(() => realtimeService.notifications.value);
const activeToasts = computed(() => realtimeService.activeToasts.value);
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);
const isAudioOn = ref(realtimeService.isAudioActive());

const pageTitle = computed(() => {
  return (route.meta.title as string)?.replace(' - eOSIS', '') || 'Dashboard';
});

function toggleNotificationMenu() {
  showNotificationMenu.value = !showNotificationMenu.value;
  if (showNotificationMenu.value) {
    // Otomatis tandai telah dibaca saat panel dibuka
    realtimeService.markAllAsRead();
  }
}

function markAsRead(id: string) {
  realtimeService.markAsRead(id);
}

function markAllAsRead() {
  realtimeService.markAllAsRead();
}

function clearAllNotifications() {
  realtimeService.clearAll();
}

function dismissToast(id: string) {
  realtimeService.dismissToast(id);
}

function toggleAudio() {
  isAudioOn.value = realtimeService.toggleAudio();
}

function testRealtimeBroadcast() {
  realtimeService.broadcastVoteCast({
    kategori: 'siswa',
    message: 'Siswa baru saja memberikan suara'
  });
}

function formatShortTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
}

function formatRelativeTime(iso: string) {
  if (!iso) return '';
  const now = Date.now();
  const past = new Date(iso).getTime();
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 5) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour} jam lalu`;
}

async function loadData() {
  currentAdmin.value = authService.getAdminSession();
  settings.value = await dbService.getPengaturan();

  // Pastikan realtime terhubung ke Supabase jika client sudah ada
  const supa = dbService.getSupabaseClient();
  if (supa) {
    realtimeService.initRealtime(supa);
  }
}

function triggerLogout() {
  showLogoutModal.value = true;
}

function confirmLogout() {
  showLogoutModal.value = false;
  authService.logoutAdmin();
  router.push('/admin/login');
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  animation: pulseDot 1.5s infinite;
}

@keyframes pulseDot {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.animate-bell {
  animation: ringBell 2s infinite ease-in-out;
  transform-origin: top center;
}

@keyframes ringBell {
  0% { transform: rotate(0); }
  5% { transform: rotate(15deg); }
  10% { transform: rotate(-15deg); }
  15% { transform: rotate(10deg); }
  20% { transform: rotate(-10deg); }
  25% { transform: rotate(0); }
  100% { transform: rotate(0); }
}

/* Toast animations */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.35s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.transition-all {
  transition: all 0.2s ease;
}
</style>
