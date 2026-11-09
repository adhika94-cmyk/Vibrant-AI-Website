<template>
  <div 
    v-if="show"
    class="modal fade show d-block" 
    tabindex="-1"
    style="background: rgba(15, 23, 42, 0.75); z-index: 1060;"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg overflow-hidden">
        
        <!-- MODAL HEADER -->
        <div class="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between" style="background-color: #1d4ed8 !important;">
          <div class="d-flex align-items-center gap-2">
            <div class="p-2 rounded bg-white bg-opacity-20 d-flex align-items-center justify-content-center">
              <i class="bi bi-wifi text-white fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title h6 fw-bold mb-0">Akses Pemilih via Jaringan Wi-Fi & Handphone</h5>
              <small class="text-white text-opacity-75" style="font-size: 0.75rem;">
                Konfigurasi link & QR Code bilik suara untuk di-scan oleh siswa/guru menggunakan HP
              </small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- MODAL BODY -->
        <div class="modal-body p-4 bg-light">
          
          <!-- Banner Status Akses Host 0.0.0.0 -->
          <div class="alert alert-success d-flex align-items-start gap-2 py-2 px-3 mb-4 border-success-subtle shadow-sm" role="alert">
            <i class="bi bi-check-circle-fill text-success fs-5 mt-0.5"></i>
            <div class="small">
              <strong class="text-success">Server Siap Akses Multi-Device (0.0.0.0:3000)</strong>
              <p class="mb-0 text-muted">
                Aplikasi telah dikonfigurasi untuk mendengarkan seluruh antarmuka jaringan (<em>host: 0.0.0.0</em>). Seluruh HP atau laptop yang terhubung ke jaringan Wi-Fi yang sama dapat langsung mengakses portal pemilihan.
              </p>
            </div>
          </div>

          <div class="row g-4">
            
            <!-- KOLOM KIRI: QR CODE & PREVIEW SCAN -->
            <div class="col-12 col-md-5">
              <div class="card card-clean p-3 text-center bg-white border h-100 d-flex flex-column align-items-center justify-content-between">
                <div>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-mono-numbers px-2 py-1 mb-2" style="font-size: 0.7rem;">
                    <i class="bi bi-qr-code me-1"></i>QR CODE BILIK SUARA
                  </span>
                  <h6 class="fw-bold text-dark mb-1">Scan via Kamera HP</h6>
                  <p class="text-muted small mb-3" style="font-size: 0.75rem;">
                    Arahkan kamera smartphone untuk langsung membuka portal pemilih tanpa mengetik URL
                  </p>
                </div>

                <!-- QR CODE CANVAS / IMAGE -->
                <div class="p-3 bg-white rounded-3 shadow-sm border border-2 border-primary-subtle mb-3 d-inline-block position-relative">
                  <img 
                    v-if="qrDataUrl" 
                    :src="qrDataUrl" 
                    alt="QR Code Akses Pemilih eOSIS" 
                    class="img-fluid"
                    style="width: 200px; height: 200px; object-fit: contain;"
                  />
                  <div v-else class="d-flex align-items-center justify-content-center" style="width: 200px; height: 200px;">
                    <span class="spinner-border text-primary" role="status"></span>
                  </div>
                </div>

                <div class="w-100">
                  <div class="d-grid gap-2">
                    <button 
                      type="button" 
                      class="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                      @click="copyVoterUrl"
                      style="background-color: #1d4ed8;"
                    >
                      <i class="bi" :class="isCopied ? 'bi-check2' : 'bi-clipboard'"></i>
                      <span>{{ isCopied ? 'Link Disalin ke Clipboard!' : 'Salin Link Akses Pemilih' }}</span>
                    </button>
                    <div class="d-flex gap-2">
                      <button 
                        type="button" 
                        class="btn btn-outline-secondary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        @click="downloadQrCode"
                        title="Unduh gambar QR Code (PNG)"
                      >
                        <i class="bi bi-download"></i>
                        <span>Unduh QR</span>
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-outline-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                        @click="printPoster"
                        title="Cetak Poster Bilik Suara A4"
                      >
                        <i class="bi bi-printer-fill"></i>
                        <span>Cetak Poster</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- KOLOM KANAN: FORM KONFIGURASI URL & WI-FI -->
            <div class="col-12 col-md-7">
              <div class="card card-clean p-4 bg-white border h-100">
                <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i class="bi bi-sliders2 text-primary"></i>
                  <span>Pengaturan URL & Jaringan Wi-Fi</span>
                </h6>

                <!-- Pilihan Mode URL -->
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-secondary">Pilih Sumber URL Akses</label>
                  <div class="btn-group w-100" role="group">
                    <button 
                      type="button" 
                      class="btn btn-sm"
                      :class="urlMode === 'auto' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="setUrlMode('auto')"
                      style="font-size: 0.8rem;"
                    >
                      <i class="bi bi-globe me-1"></i>URL Otomatis (Web/Cloud)
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm"
                      :class="urlMode === 'local' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="setUrlMode('local')"
                      style="font-size: 0.8rem;"
                    >
                      <i class="bi bi-router me-1"></i>IP Jaringan Wi-Fi Lokal
                    </button>
                  </div>
                </div>

                <!-- Input URL Akhir yang Aktif -->
                <div class="mb-3" v-if="urlMode === 'local'">
                  <label class="form-label fw-semibold small text-secondary">
                    IP Address Komputer Server di Wi-Fi <span class="text-danger">*</span>
                  </label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light text-muted font-mono-numbers">http://</span>
                    <input 
                      v-model="customIp" 
                      type="text" 
                      class="form-control font-mono-numbers" 
                      placeholder="Contoh: 192.168.1.100"
                      @input="generateQr"
                    />
                    <span class="input-group-text bg-light text-muted font-mono-numbers">:3000</span>
                  </div>
                  <div class="form-text small text-muted" style="font-size: 0.725rem;">
                    Ketik IP komputer server yang terhubung ke Wi-Fi sekolah (cek via CMD: <code>ipconfig</code> di Windows atau <code>ifconfig</code> di Mac/Linux).
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold small text-secondary">URL Lengkap yang Dihasilkan</label>
                  <div class="input-group input-group-sm">
                    <input 
                      type="text" 
                      class="form-control font-mono-numbers bg-light" 
                      :value="activeVoterUrl" 
                      readonly 
                    />
                    <button class="btn btn-outline-secondary" type="button" @click="copyVoterUrl">
                      <i class="bi" :class="isCopied ? 'bi-check2 text-success' : 'bi-clipboard'"></i>
                    </button>
                  </div>
                </div>

                <!-- Informasi Tambahan Wi-Fi untuk Poster -->
                <div class="p-3 bg-light rounded border mb-3">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="fw-semibold small text-dark d-flex align-items-center gap-1">
                      <i class="bi bi-broadcast-pin text-primary"></i>
                      <span>Identitas Wi-Fi TPS (Opsional untuk Poster)</span>
                    </span>
                    <span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.65rem;">Ditampilkan di Poster</span>
                  </div>
                  
                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Nama Wi-Fi (SSID)</label>
                      <input 
                        v-model="wifiInfo.ssid" 
                        type="text" 
                        class="form-control form-control-sm" 
                        placeholder="Contoh: WIFI_SMPN2_TPS"
                        @input="saveWifiSettings"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label small text-muted mb-1" style="font-size: 0.75rem;">Kata Sandi Wi-Fi</label>
                      <input 
                        v-model="wifiInfo.password" 
                        type="text" 
                        class="form-control form-control-sm" 
                        placeholder="Contoh: votingspenda"
                        @input="saveWifiSettings"
                      />
                    </div>
                  </div>
                </div>

                <!-- Petunjuk 3 Langkah untuk Siswa -->
                <div class="mt-auto pt-2 border-top">
                  <strong class="d-block small text-dark mb-1">
                    <i class="bi bi-info-circle text-primary me-1"></i>Alur Memilih Lewat Handphone:
                  </strong>
                  <ol class="small text-muted mb-0 ps-3" style="font-size: 0.75rem;">
                    <li>Siswa menyambungkan HP ke jaringan Wi-Fi sekolah.</li>
                    <li>Siswa memindai QR Code di bilik suara menggunakan kamera HP.</li>
                    <li>Siswa masuk dengan NISN & Tanggal Lahir (YYYY-MM-DD), lalu memberikan suara!</li>
                  </ol>
                </div>

              </div>
            </div>

          </div>

        </div>

        <!-- MODAL FOOTER -->
        <div class="modal-footer bg-white py-2 px-4 d-flex justify-content-between align-items-center border-top">
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            @click="toggleFullscreenQr"
          >
            <i class="bi" :class="isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></i>
            <span>{{ isFullscreen ? 'Tutup Layar Penuh' : 'Mode Layar Penuh (Proyektor TPS)' }}</span>
          </button>

          <button type="button" class="btn btn-secondary btn-sm px-4" @click="$emit('close')">
            Tutup
          </button>
        </div>

      </div>
    </div>
  </div>

  <!-- OVERLAY LAYAR PENUH UNTUK PROYEKTOR / SMART TV TPS -->
  <div 
    v-if="isFullscreen"
    class="fullscreen-qr-overlay position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
    style="background: #0f172a; z-index: 2090;"
  >
    <button 
      type="button" 
      class="btn btn-outline-light btn-sm position-absolute top-0 end-0 m-4 d-flex align-items-center gap-1"
      @click="isFullscreen = false"
    >
      <i class="bi bi-x-lg"></i>
      <span>Keluar Layar Penuh (Esc)</span>
    </button>

    <div class="bg-white p-4 p-md-5 rounded-4 shadow-lg text-dark" style="max-width: 580px; width: 90%;">
      <div class="d-flex align-items-center justify-content-center gap-3 mb-3">
        <img :src="schoolLogo" alt="Logo" class="rounded-circle border" style="width: 50px; height: 50px; object-fit: cover;" />
        <div class="text-start">
          <h4 class="h5 fw-bold mb-0 text-dark">{{ schoolName }}</h4>
          <span class="badge bg-primary px-2 py-1" style="font-size: 0.75rem;">PORTAL PEMILIHAN OSIS ONLINE</span>
        </div>
      </div>

      <h3 class="h4 fw-bold text-dark mb-1">SCAN UNTUK MEMBERIKAN SUARA</h3>
      <p class="text-muted small mb-3">Buka kamera HP Anda, arahkan ke QR Code di bawah ini</p>

      <div class="p-3 bg-white border border-3 border-primary rounded-4 d-inline-block shadow mb-3">
        <img :src="qrDataUrl" alt="QR Code" class="img-fluid" style="width: 260px; height: 260px;" />
      </div>

      <div class="bg-light p-2 rounded border font-mono-numbers fw-bold text-primary fs-6 mb-3">
        {{ activeVoterUrl }}
      </div>

      <div v-if="wifiInfo.ssid" class="d-flex justify-content-center gap-3 small text-muted">
        <span><i class="bi bi-wifi text-success me-1"></i>Wi-Fi: <strong>{{ wifiInfo.ssid }}</strong></span>
        <span v-if="wifiInfo.password"><i class="bi bi-key text-warning me-1"></i>Sandi: <strong>{{ wifiInfo.password }}</strong></span>
      </div>
    </div>
  </div>

  <!-- HIDDEN PRINT TEMPLATE FOR POSTER BILIK SUARA -->
  <div id="printable-voting-poster" class="d-none">
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; text-align: center; color: #1e293b; max-width: 800px; margin: 0 auto;">
      <div style="border-bottom: 3px double #1d4ed8; padding-bottom: 20px; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; gap: 20px;">
        <img :src="schoolLogo" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;" />
        <div style="text-align: left;">
          <h2 style="font-size: 22px; margin: 0; font-weight: 800; color: #1e3a8a;">{{ schoolName }}</h2>
          <h3 style="font-size: 16px; margin: 4px 0 0; font-weight: 700; color: #1d4ed8;">PANITIA PEMILIHAN KETUA & WAKIL KETUA OSIS</h3>
          <p style="font-size: 13px; margin: 2px 0 0; color: #64748b;">PETUNJUK E-VOTING RESMI MELALUI SMARTPHONE / HANDPHONE</p>
        </div>
      </div>

      <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-around; font-size: 15px;">
        <div v-if="wifiInfo.ssid"><strong>Jaringan Wi-Fi:</strong> {{ wifiInfo.ssid }}</div>
        <div v-if="wifiInfo.password"><strong>Kata Sandi Wi-Fi:</strong> {{ wifiInfo.password }}</div>
        <div><strong>Akses:</strong> Gratis untuk seluruh pemilih DPT</div>
      </div>

      <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.5px;">
        PINDAI QR CODE DI BAWAH INI UNTUK MEMILIH
      </h1>
      <p style="font-size: 14px; color: #475569; margin-bottom: 25px;">
        Gunakan aplikasi Kamera bawaan, Google Lens, atau pemindai QR di HP Anda
      </p>

      <div style="display: inline-block; padding: 20px; background: #ffffff; border: 4px solid #1d4ed8; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <img :src="qrDataUrl" style="width: 280px; height: 280px; display: block;" />
      </div>

      <div style="background: #f1f5f9; padding: 10px 20px; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 30px; display: inline-block;">
        Atau buka link: {{ activeVoterUrl }}
      </div>

      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 30px;">
        <h4 style="margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 800;">4 LANGKAH MUDAH MEMBERIKAN SUARA:</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.8;">
          <li><strong>Sambungkan HP ke Wi-Fi:</strong> Pastikan HP Anda telah terhubung ke Wi-Fi sekolah di atas.</li>
          <li><strong>Pindai QR Code:</strong> Buka Kamera atau aplikasi QR scanner di HP Anda dan arahkan ke kode QR di atas.</li>
          <li><strong>Masuk dengan Akun DPT:</strong> Masukkan <strong>NISN</strong> (untuk Siswa) atau <strong>NIP</strong> (untuk Guru) serta <strong>Tanggal Lahir</strong> (format: YYYY-MM-DD, contoh: 2010-08-17).</li>
          <li><strong>Tentukan Pilihan Anda:</strong> Simak visi & misi calon, klik <strong>"Pilih Paslon"</strong>, dan konfirmasi pilihan Anda.</li>
        </ol>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
        <span>Asas Pemilihan: Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL)</span>
        <span>eOSIS · SMP Negeri 2 Kota Bogor</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import QRCode from 'qrcode';

const props = withDefaults(defineProps<{
  show: boolean;
  schoolName?: string;
  schoolLogo?: string;
}>(), {
  schoolName: 'SMP NEGERI 2 KOTA BOGOR',
  schoolLogo: '/src/assets/images/osis_spenda_logo_1793253206503.jpg'
});

defineEmits<{
  (e: 'close'): void;
}>();

const urlMode = ref<'auto' | 'local'>('auto');
const customIp = ref('');
const qrDataUrl = ref('');
const isCopied = ref(false);
const isFullscreen = ref(false);

const wifiInfo = reactive({
  ssid: '',
  password: ''
});

// Deteksi host saat ini
const originUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
});

// URL aktif pemilih
const activeVoterUrl = computed(() => {
  if (urlMode.value === 'local' && customIp.value.trim()) {
    let ip = customIp.value.trim().replace(/^https?:\/\//, '').replace(/:[0-9]+$/, '').replace(/\/+$/, '');
    return `http://${ip}:3000/`;
  }
  return `${originUrl.value}/`;
});

// Buat QR Code secara dinamis
async function generateQr() {
  try {
    const url = activeVoterUrl.value;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    qrDataUrl.value = dataUrl;
  } catch (err) {
    console.error('Gagal generate QR Code:', err);
  }
}

function setUrlMode(mode: 'auto' | 'local') {
  urlMode.value = mode;
  generateQr();
}

async function copyVoterUrl() {
  try {
    await navigator.clipboard.writeText(activeVoterUrl.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2500);
  } catch (err) {
    console.error('Gagal menyalin URL:', err);
  }
}

function downloadQrCode() {
  if (!qrDataUrl.value) return;
  const link = document.createElement('a');
  link.href = qrDataUrl.value;
  link.download = `QR_Akses_Pemilih_eOSIS_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleFullscreenQr() {
  isFullscreen.value = !isFullscreen.value;
}

function saveWifiSettings() {
  try {
    localStorage.setItem('eosis_wifi_config', JSON.stringify({
      ssid: wifiInfo.ssid,
      password: wifiInfo.password,
      customIp: customIp.value,
      urlMode: urlMode.value
    }));
  } catch (e) {
    // ignore
  }
}

function loadWifiSettings() {
  try {
    const saved = localStorage.getItem('eosis_wifi_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.ssid) wifiInfo.ssid = parsed.ssid;
      if (parsed.password) wifiInfo.password = parsed.password;
      if (parsed.customIp) customIp.value = parsed.customIp;
      if (parsed.urlMode) urlMode.value = parsed.urlMode;
    }
  } catch (e) {
    // ignore
  }
}

function printPoster() {
  const posterElem = document.getElementById('printable-voting-poster');
  if (!posterElem) return;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Poster Bilik Suara eOSIS - ${props.schoolName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${posterElem.innerHTML}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    generateQr();
  }
});

watch(activeVoterUrl, () => {
  generateQr();
});

onMounted(() => {
  loadWifiSettings();
  generateQr();

  // Handle escape key for fullscreen
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
      isFullscreen.value = false;
    }
  });
});
</script>

<style scoped>
.font-mono-numbers {
  font-family: 'JetBrains Mono', monospace;
}
.fullscreen-qr-overlay {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
