<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <div>
        <h1 class="h4 fw-bold text-dark mb-1">Pengaturan Sistem eOSIS</h1>
        <p class="text-muted small mb-0">
          Konfigurasi identitas sekolah, periode pemilihan, keamanan admin, dan integrasi database Supabase
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <span 
          class="badge px-3 py-2 border font-mono-numbers"
          :class="isSupabaseActive ? 'bg-success-subtle text-success border-success-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'"
        >
          <i class="bi" :class="isSupabaseActive ? 'bi-cloud-check-fill' : 'bi-hdd-fill'"></i>
          <span class="ms-1">{{ isSupabaseActive ? 'Supabase Connected' : 'Local DB Active' }}</span>
        </span>
      </div>
    </div>

    <!-- Alert Status -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show small py-2 px-3 border-danger-subtle mb-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>
      <span>{{ errorMessage }}</span>
      <button type="button" class="btn-close py-2" @click="errorMessage = ''"></button>
    </div>

    <div class="row g-4">
      
      <!-- KOLOM 1: IDENTITAS SEKOLAH & PERIODE PEMILIHAN -->
      <div class="col-12 col-lg-6">
        <div class="card card-clean p-4 h-100">
          <div class="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
            <i class="bi bi-building-gear text-primary fs-5"></i>
            <h2 class="h6 fw-bold text-dark mb-0">Identitas Sekolah & Periode Pemilihan</h2>
          </div>

          <form @submit.prevent="saveSchoolSettings">
            <!-- Nama Sekolah -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Nama Sekolah</label>
              <input 
                v-model="schoolForm.nama_sekolah" 
                type="text" 
                class="form-control" 
                placeholder="SMP NEGERI 2 KOTA BOGOR"
                required
              />
              <div class="form-text small text-muted">
                Nama ini otomatis ditampilkan pada halaman siswa, berita acara, dan navigasi.
              </div>
            </div>

            <!-- Periode Pemilihan -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Periode Pemilihan</label>
              <input 
                v-model="schoolForm.periode_pemilihan" 
                type="text" 
                class="form-control font-mono-numbers" 
                placeholder="Contoh: 2025/2026"
                required
              />
            </div>

            <!-- Logo Sekolah -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Logo Sekolah</label>
              <div class="d-flex align-items-center gap-3 mb-2">
                <img 
                  :src="schoolForm.logo_sekolah || defaultLogo" 
                  alt="Preview Logo" 
                  class="rounded border p-1 bg-white"
                  style="width: 52px; height: 52px; object-fit: contain;"
                />
                <div class="flex-grow-1">
                  <div class="input-group input-group-sm">
                    <input 
                      v-model="schoolForm.logo_sekolah" 
                      type="text" 
                      class="form-control font-mono-numbers small" 
                      placeholder="URL logo atau unggah file..."
                    />
                    <label class="btn btn-outline-secondary mb-0">
                      <i class="bi bi-upload me-1"></i>Pilih File
                      <input type="file" accept="image/*" class="d-none" @change="handleLogoUpload" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Jadwal Pemilihan & Hitung Mundur -->
            <div class="row g-2 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold small text-secondary">Waktu Mulai Pemilihan</label>
                <input 
                  v-model="schoolForm.waktu_mulai" 
                  type="datetime-local" 
                  class="form-control form-control-sm font-mono-numbers" 
                />
                <div class="form-text small text-muted">Jadwal pembukaan bilik suara</div>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold small text-secondary">Waktu Selesai (Batas Akhir)</label>
                <input 
                  v-model="schoolForm.waktu_selesai" 
                  type="datetime-local" 
                  class="form-control form-control-sm font-mono-numbers" 
                />
                <div class="form-text small text-muted">Batas penutupan voting</div>
              </div>
            </div>

            <!-- Status Pemilihan (Buka / Tutup) -->
            <div class="mb-3 p-3 rounded bg-light border">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong class="d-block text-dark small">Status Hak Pilih Siswa</strong>
                  <small class="text-muted">
                    {{ schoolForm.voting_dibuka ? 'Siswa dapat masuk dan memberikan suara.' : 'Pemilihan ditutup; siswa tidak dapat memilih.' }}
                  </small>
                </div>
                <div class="form-check form-switch ms-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="switchVotingStatus"
                    v-model="schoolForm.voting_dibuka"
                    style="transform: scale(1.3);"
                  />
                </div>
              </div>
            </div>

            <!-- Quick Count Publik Toggle -->
            <div class="mb-4 p-3 rounded bg-light border">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong class="d-block text-dark small">Akses Quick Count Publik</strong>
                  <small class="text-muted">
                    {{ schoolForm.quick_count_publik ? 'Siswa dan publik dapat memantau perolehan quick count real-time.' : 'Quick count hanya dapat dilihat oleh admin di panel perolehan suara.' }}
                  </small>
                </div>
                <div class="form-check form-switch ms-3">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="switchQuickCountPublic"
                    v-model="schoolForm.quick_count_publik"
                    style="transform: scale(1.3);"
                  />
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-sm px-4" style="background-color: #1d4ed8;">
              <i class="bi bi-save me-1"></i>Simpan Pengaturan Sekolah
            </button>
          </form>
        </div>
      </div>

      <!-- KOLOM 2: KEAMANAN & KREDENSIAL ADMIN -->
      <div class="col-12 col-lg-6">
        <div class="card card-clean p-4 h-100">
          <div class="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
            <i class="bi bi-shield-lock-fill text-danger fs-5"></i>
            <h2 class="h6 fw-bold text-dark mb-0">Keamanan & Kredensial Administrator</h2>
          </div>

          <form @submit.prevent="saveAdminCredentials">
            <!-- Nama Admin -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Nama Lengkap Administrator</label>
              <input 
                v-model="adminForm.nama_lengkap" 
                type="text" 
                class="form-control" 
                placeholder="Pembina OSIS SMPN 2"
                required
              />
            </div>

            <!-- Username Admin -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Username Admin</label>
              <div class="input-group">
                <span class="input-group-text bg-light text-muted border-end-0">
                  <i class="bi bi-at"></i>
                </span>
                <input 
                  v-model="adminForm.username" 
                  type="text" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <!-- Password Baru -->
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">
                Ganti Kata Sandi (Kosongkan jika tidak ingin mengubah)
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light text-muted border-end-0">
                  <i class="bi bi-key"></i>
                </span>
                <input 
                  v-model="adminForm.new_password" 
                  type="password" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="Masukkan kata sandi baru (min 6 karakter)"
                />
              </div>
              <div class="form-text small text-muted">
                Keamanan: Password disimpan secara terenkripsi menggunakan hash standar SHA-256.
              </div>
            </div>

            <!-- Konfirmasi Password Baru -->
            <div class="mb-4" v-if="adminForm.new_password">
              <label class="form-label fw-semibold small text-secondary">Konfirmasi Kata Sandi Baru</label>
              <input 
                v-model="adminForm.confirm_password" 
                type="password" 
                class="form-control" 
                placeholder="Ulangi kata sandi baru"
              />
            </div>

            <button type="submit" class="btn btn-outline-danger btn-sm px-4">
              <i class="bi bi-shield-check me-1"></i>Perbarui Kredensial Admin
            </button>
          </form>
        </div>
      </div>

      <!-- ROW 2: KONFIGURASI AKSES WI-FI & HP PEMILIH -->
      <div class="col-12">
        <div class="card card-clean p-4 border-success-subtle bg-success-subtle bg-opacity-10">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 border-bottom pb-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-wifi text-success fs-4"></i>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h2 class="h6 fw-bold text-dark mb-0">Akses Jaringan Wi-Fi & Handphone Pemilih (Bilik Suara)</h2>
                  <span class="badge bg-success text-white font-mono-numbers" style="font-size: 0.7rem;">
                    HOST: 0.0.0.0:3000 AKTIF
                  </span>
                </div>
                <small class="text-muted">Konfigurasi alamat server & cetak QR Code agar siswa dapat mengakses eOSIS langsung melalui HP di jaringan Wi-Fi sekolah</small>
              </div>
            </div>

            <button 
              type="button" 
              class="btn btn-success btn-sm d-flex align-items-center gap-1"
              @click="showWifiModal = true"
            >
              <i class="bi bi-qr-code-scan"></i>
              <span>Buka QR Code & Cetak Poster Bilik Suara</span>
            </button>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-4">
              <div class="p-3 bg-white rounded border h-100">
                <span class="text-muted small d-block mb-1">1. Host Listening Binding</span>
                <strong class="text-dark d-block">0.0.0.0 (Semua Interface)</strong>
                <p class="text-muted small mb-0 mt-1" style="font-size: 0.75rem;">
                  Server Vite dikonfigurasi pada <code>host: 0.0.0.0</code> & port <code>3000</code> sehingga siap diakses oleh perangkat lain di jaringan yang sama.
                </p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="p-3 bg-white rounded border h-100">
                <span class="text-muted small d-block mb-1">2. Akses Tanpa Install Aplikasi</span>
                <strong class="text-dark d-block">Scan QR Code via Kamera HP</strong>
                <p class="text-muted small mb-0 mt-1" style="font-size: 0.75rem;">
                  Siswa cukup menghubungkan smartphone ke Wi-Fi sekolah, scan QR Code, dan langsung masuk ke halaman login responsif.
                </p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="p-3 bg-white rounded border h-100">
                <span class="text-muted small d-block mb-1">3. Poster Cetak A4 Siap Pakai</span>
                <strong class="text-dark d-block">Poster Petunjuk Bilik Suara</strong>
                <p class="text-muted small mb-0 mt-1" style="font-size: 0.75rem;">
                  Dilengkapi fitur cetak otomatis lembar instruksi resmi A4 dengan KOP Sekolah, QR Code besar, dan langkah login NISN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 3: KONFIGURASI SUPABASE & SQL SCHEMA VIEWER -->
      <div class="col-12">
        <div class="card card-clean p-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 border-bottom pb-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-database-fill-gear text-success fs-5"></i>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h2 class="h6 fw-bold text-dark mb-0">Integrasi Database Supabase</h2>
                  <span 
                    class="badge d-inline-flex align-items-center gap-1 font-mono-numbers"
                    :class="isSupabaseActive ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary border'"
                    style="font-size: 0.7rem;"
                  >
                    <i class="bi" :class="isSupabaseActive ? 'bi-check-circle-fill' : 'bi-hdd-fill'"></i>
                    <span>{{ isSupabaseActive ? 'Supabase Terhubung' : 'Local Storage Engine' }}</span>
                  </span>
                </div>
                <small class="text-muted">Hubungkan aplikasi langsung ke backend Supabase PostgreSQL untuk sinkronisasi multi-perangkat</small>
              </div>
            </div>

            <button 
              type="button" 
              class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              @click="copySqlScript"
            >
              <i class="bi bi-clipboard-check"></i>
              <span>{{ isSqlCopied ? 'Script Disalin!' : 'Salin Script SQL Supabase' }}</span>
            </button>
          </div>

          <!-- Alert Feedback Khusus Supabase (Tampil langsung di dalam card agar pengguna langsung melihat respon tombol) -->
          <div 
            v-if="supabaseFeedback" 
            class="alert alert-dismissible fade show small py-2 px-3 mb-3 border" 
            :class="{
              'alert-success border-success-subtle': supabaseFeedback.type === 'success',
              'alert-danger border-danger-subtle': supabaseFeedback.type === 'danger',
              'alert-warning border-warning-subtle': supabaseFeedback.type === 'warning',
              'alert-info border-info-subtle': supabaseFeedback.type === 'info'
            }"
            role="alert"
          >
            <div class="d-flex align-items-start gap-2">
              <i 
                class="bi fs-5 flex-shrink-0" 
                :class="{
                  'bi-check-circle-fill text-success': supabaseFeedback.type === 'success',
                  'bi-exclamation-triangle-fill text-danger': supabaseFeedback.type === 'danger',
                  'bi-exclamation-circle-fill text-warning': supabaseFeedback.type === 'warning',
                  'bi-info-circle-fill text-info': supabaseFeedback.type === 'info'
                }"
              ></i>
              <div class="flex-grow-1">
                <strong v-if="supabaseFeedback.title" class="d-block mb-1">{{ supabaseFeedback.title }}</strong>
                <span>{{ supabaseFeedback.message }}</span>
              </div>
              <button type="button" class="btn-close py-2 ms-auto" @click="supabaseFeedback = null"></button>
            </div>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold small text-secondary">
                Supabase Project URL <span class="text-danger">*</span>
              </label>
              <input 
                v-model="supabaseConfig.url" 
                type="text" 
                class="form-control font-mono-numbers small" 
                :class="{ 'is-invalid': supabaseErrors.url }"
                placeholder="https://xyzcompany.supabase.co"
                @input="supabaseErrors.url = ''; supabaseFeedback = null"
              />
              <div v-if="supabaseErrors.url" class="invalid-feedback small d-block">
                {{ supabaseErrors.url }}
              </div>
              <div v-else class="form-text small text-muted">
                Dapat diperoleh dari Project Settings > API di dashboard Supabase Anda.
              </div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label fw-semibold small text-secondary">
                Supabase Anon Public Key <span class="text-danger">*</span>
              </label>
              <input 
                v-model="supabaseConfig.key" 
                type="text" 
                class="form-control font-mono-numbers small" 
                :class="{ 'is-invalid': supabaseErrors.key }"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                @input="supabaseErrors.key = ''; supabaseFeedback = null"
              />
              <div v-if="supabaseErrors.key" class="invalid-feedback small d-block">
                {{ supabaseErrors.key }}
              </div>
              <div v-else class="form-text small text-muted">
                Hanya gunakan <strong>anon public key</strong>. Jangan pernah menempatkan service role key di frontend.
              </div>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mb-4 align-items-center">
            <button 
              type="button" 
              class="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-1" 
              @click="saveAndTestSupabase" 
              :disabled="isConnectingSupabase"
              style="background-color: #1d4ed8;"
            >
              <span v-if="isConnectingSupabase" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-plug-fill me-1"></i>
              <span>{{ isConnectingSupabase ? 'Menguji & Menghubungkan Supabase...' : 'Simpan & Hubungkan Supabase' }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm px-3 d-inline-flex align-items-center gap-1" 
              @click="disconnectSupabase"
              :disabled="isConnectingSupabase"
            >
              <i class="bi bi-hdd-network me-1"></i>
              <span>Gunakan Local Engine Default</span>
            </button>
          </div>

          <!-- Petunjuk Setup Supabase SQL -->
          <div class="p-3 rounded bg-light border">
            <strong class="d-block text-dark small mb-1">
              <i class="bi bi-info-circle text-primary me-1"></i>Langkah Aktivasi di Supabase:
            </strong>
            <ol class="small text-muted mb-2 ps-3">
              <li>Buat project baru di <a href="https://supabase.com" target="_blank" class="text-primary">supabase.com</a>.</li>
              <li>Buka menu <strong>SQL Editor</strong> di dashboard Supabase Anda.</li>
              <li>Klik tombol <strong>"Salin Script SQL Supabase"</strong> di atas, lalu tempelkan (paste) dan klik <strong>Run</strong>.</li>
              <li>Salin <strong>Project URL</strong> & <strong>anon key</strong> ke formulir di atas lalu klik <strong>Simpan & Hubungkan</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- ROW 3: RESET PEMILIH & RESET SISWA (ZONA KELOLA DATA) -->
      <div class="col-12 col-lg-6">
        <div class="card card-clean p-4 border-warning-subtle bg-warning-subtle bg-opacity-10 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-person-check-fill text-warning fs-5"></i>
              <h3 class="h6 fw-bold text-dark mb-0">Perintah Reset Pemilih (Hak Suara)</h3>
            </div>
            <span class="badge bg-warning text-dark small">
              {{ currentStats.sudahMemilih }} Sudah Memilih
            </span>
          </div>

          <p class="text-muted small mb-3">
            Mengembalikan status seluruh pemilih menjadi <strong>Belum Memilih</strong>, mengosongkan perolehan suara paslon (0), dan <strong>menghapus bersih seluruh rekaman pada tabel votes & suara di Supabase</strong>. Data siswa DPT tetap aman.
          </p>

          <div class="bg-white p-2 rounded border mb-3 small d-flex justify-content-between align-items-center">
            <span class="text-secondary">Total Suara Masuk Saat Ini:</span>
            <span class="fw-bold text-danger">{{ currentStats.totalSuaraMasuk }} Suara</span>
          </div>

          <div class="mt-auto">
            <button 
              type="button" 
              class="btn btn-warning btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
              @click="openResetModal('pemilih')"
            >
              <i class="bi bi-arrow-counterclockwise"></i>
              <span>Jalankan Reset Pemilih & Hapus Suara</span>
            </button>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card card-clean p-4 border-danger-subtle bg-danger-subtle bg-opacity-10 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-people-fill text-danger fs-5"></i>
              <h3 class="h6 fw-bold text-danger mb-0">Perintah Reset Siswa (Data DPT)</h3>
            </div>
            <span class="badge bg-danger small">
              {{ currentStats.totalSiswa }} Siswa Terdaftar
            </span>
          </div>

          <p class="text-muted small mb-3">
            Atur ulang data siswa DPT: Pulihkan ke data bawaan awal SMPN 2 atau kosongkan seluruh data siswa jika ingin mengunggah DPT baru. <strong>Tabel votes & suara di Supabase juga akan otomatis dibersihkan</strong>.
          </p>

          <div class="bg-white p-2 rounded border mb-3 small d-flex justify-content-between align-items-center">
            <span class="text-secondary">Status Daftar Pemilih Tetap:</span>
            <span class="fw-semibold text-dark">{{ currentStats.totalSiswa > 0 ? `${currentStats.totalSiswa} Siswa Aktif` : 'DPT Masih Kosong' }}</span>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-auto">
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm px-3"
              @click="openResetModal('siswa-default')"
            >
              <i class="bi bi-arrow-repeat me-1"></i>Pulihkan Siswa Default
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm px-3"
              @click="openResetModal('siswa-clear')"
            >
              <i class="bi bi-trash-fill me-1"></i>Kosongkan Seluruh Siswa
            </button>
          </div>
        </div>
      </div>

      <!-- ROW 4: DIAGNOSTIK TABEL SUPABASE CLOUD DATABASE -->
      <div class="col-12" v-if="isSupabaseActive">
        <div class="card card-clean p-4 border-primary-subtle bg-light">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-cloud-check-fill text-primary fs-5"></i>
              <div>
                <h3 class="h6 fw-bold text-dark mb-0">Diagnostik Database Supabase Cloud (Live Status)</h3>
                <small class="text-muted">Periksa jumlah baris langsung di cloud database untuk memastikan data votes/suara benar-benar terhapus</small>
              </div>
            </div>

            <button 
              type="button" 
              class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              @click="runDiagnostics"
              :disabled="isCheckingDiag"
            >
              <span v-if="isCheckingDiag" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-arrow-clockwise"></i>
              <span>{{ isCheckingDiag ? 'Memeriksa...' : 'Periksa Baris Supabase Sekarang' }}</span>
            </button>
          </div>

          <div class="row g-3">
            <div class="col-6 col-md-3">
              <div class="p-3 bg-white rounded border text-center">
                <small class="text-muted d-block mb-1">Tabel <code>siswa</code></small>
                <div class="h5 fw-bold mb-0 text-dark font-mono-numbers">
                  {{ diagData ? (diagData.siswaCount !== null ? `${diagData.siswaCount} baris` : '-') : 'Klik Periksa' }}
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="p-3 bg-white rounded border text-center">
                <small class="text-muted d-block mb-1">Tabel <code>kandidat</code></small>
                <div class="h5 fw-bold mb-0 text-dark font-mono-numbers">
                  {{ diagData ? (diagData.kandidatCount !== null ? `${diagData.kandidatCount} baris` : '-') : 'Klik Periksa' }}
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="p-3 bg-white rounded border text-center">
                <small class="text-muted d-block mb-1">Tabel <code>suara</code></small>
                <div class="h5 fw-bold mb-0 font-mono-numbers" :class="diagData && diagData.suaraCount === 0 ? 'text-success' : 'text-danger'">
                  {{ diagData ? (diagData.suaraCount !== null ? `${diagData.suaraCount} baris` : '-') : 'Klik Periksa' }}
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="p-3 bg-white rounded border text-center">
                <small class="text-muted d-block mb-1">Tabel <code>votes</code></small>
                <div class="h5 fw-bold mb-0 font-mono-numbers" :class="diagData && (diagData.votesCount === 0 || !diagData.votesTableExists) ? 'text-success' : 'text-danger'">
                  <span v-if="diagData">
                    {{ diagData.votesTableExists ? `${diagData.votesCount} baris` : 'Tabel Bersih / Kosong' }}
                  </span>
                  <span v-else>Klik Periksa</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="diagData && diagData.error" class="alert alert-warning py-2 px-3 small mt-3 mb-0">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ diagData.error }}
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL KONFIRMASI RESET INTERAKTIF (BEBAS DARI BLOKIR IFRAME / PROMPT) -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showResetModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(2px);"
      v-if="showResetModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom py-3" :class="resetAction === 'pemilih' ? 'bg-warning-subtle text-dark' : 'bg-danger text-white'">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2 mb-0">
              <i :class="resetAction === 'pemilih' ? 'bi bi-arrow-counterclockwise' : 'bi bi-exclamation-octagon-fill'"></i>
              <span>{{ modalTitle }}</span>
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              :class="{ 'btn-close-white': resetAction !== 'pemilih' }" 
              @click="closeResetModal" 
              :disabled="isResetting"
            ></button>
          </div>

          <div class="modal-body p-4">
            <p class="text-muted small mb-3">
              {{ modalDescription }}
            </p>

            <div class="bg-light p-3 rounded border mb-3">
              <strong class="d-block small text-dark mb-2">Tindakan yang akan dieksekusi:</strong>
              <ul class="small text-muted mb-0 ps-3">
                <li v-for="(item, idx) in modalCheckpoints" :key="idx" class="mb-1">
                  {{ item }}
                </li>
              </ul>
            </div>

            <div v-if="isSupabaseActive" class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i class="bi bi-cloud-check-fill fs-5 text-primary"></i>
              <div>
                <strong>Supabase Terhubung:</strong> Seluruh tabel cloud (<code>siswa</code>, <code>kandidat</code>, <code>suara</code>, dan <code>votes</code>) akan langsung disinkronkan dan dibersihkan.
              </div>
            </div>

            <div v-if="isResetting" class="text-center py-3">
              <div class="spinner-border text-primary mb-2" role="status"></div>
              <p class="small text-muted mb-0 fw-semibold">Sedang mereset data dan menghapus baris tabel votes di Supabase...</p>
            </div>

            <div v-else>
              <div v-if="resetAction === 'siswa-clear'" class="mb-3">
                <label class="form-label small fw-semibold text-danger">Ketik "KOSONGKAN" untuk mengonfirmasi:</label>
                <input 
                  v-model="confirmationInput" 
                  type="text" 
                  class="form-control form-control-sm font-monospace text-uppercase" 
                  placeholder="KOSONGKAN"
                />
              </div>

              <div v-else-if="resetAction === 'pemilih'" class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Ketik "RESET" untuk mengonfirmasi pengosongan suara:</label>
                <input 
                  v-model="confirmationInput" 
                  type="text" 
                  class="form-control form-control-sm font-monospace text-uppercase" 
                  placeholder="RESET"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light border-top py-2" v-if="!isResetting">
            <button type="button" class="btn btn-secondary btn-sm px-3" @click="closeResetModal">
              Batal
            </button>
            <button 
              type="button" 
              class="btn btn-sm px-4 fw-semibold"
              :class="resetAction === 'pemilih' ? 'btn-warning' : 'btn-danger'"
              :disabled="isConfirmDisabled"
              @click="executeReset"
            >
              <i class="bi bi-check2-circle me-1"></i>Ya, Jalankan Reset Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Konfigurasi Akses Wi-Fi & QR Code Bilik Suara -->
    <WifiAccessModal 
      :show="showWifiModal" 
      :school-name="schoolForm.nama_sekolah" 
      :school-logo="schoolForm.logo_sekolah" 
      @close="showWifiModal = false" 
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { dbService } from '../../services/db';
import WifiAccessModal from '../../components/WifiAccessModal.vue';
import type { Pengaturan, AdminUser, Statistics } from '../../types';

const defaultLogo = '/src/assets/images/osis_spenda_logo_1793253206503.jpg';

const showWifiModal = ref(false);
const alertMessage = ref('');
const errorMessage = ref('');
const isSqlCopied = ref(false);

const currentStats = ref<Statistics>({
  totalSiswa: 0,
  totalKelas: 0,
  totalKandidat: 0,
  sudahMemilih: 0,
  belumMemilih: 0,
  persentasePartisipasi: 0,
  totalSuaraMasuk: 0
});

// Diagnostik Supabase
const isCheckingDiag = ref(false);
const diagData = ref<{
  connected: boolean;
  siswaCount: number | null;
  kandidatCount: number | null;
  suaraCount: number | null;
  votesCount: number | null;
  votesTableExists: boolean;
  error?: string;
} | null>(null);

// Modal State
type ResetType = 'pemilih' | 'siswa-default' | 'siswa-clear';
const showResetModal = ref(false);
const resetAction = ref<ResetType | null>(null);
const confirmationInput = ref('');
const isResetting = ref(false);

const modalTitle = computed(() => {
  if (resetAction.value === 'pemilih') return 'Konfirmasi Reset Hak Suara Pemilih';
  if (resetAction.value === 'siswa-default') return 'Konfirmasi Pulihkan Siswa Bawaan';
  if (resetAction.value === 'siswa-clear') return 'Konfirmasi Kosongkan Seluruh Siswa (DPT)';
  return '';
});

const modalDescription = computed(() => {
  if (resetAction.value === 'pemilih') {
    return 'Tindakan ini akan mengembalikan status seluruh pemilih menjadi Belum Memilih dan menghapus seluruh perolehan suara paslon kandidat.';
  }
  if (resetAction.value === 'siswa-default') {
    return 'Tindakan ini akan mengganti daftar siswa saat ini dengan data siswa standar bawaan SMP Negeri 2 Kota Bogor dan mengosongkan seluruh perolehan suara.';
  }
  if (resetAction.value === 'siswa-clear') {
    return 'PERINGATAN: Seluruh data siswa (DPT) akan dihapus secara permanen dari sistem. Anda dapat menambahkan siswa kembali secara tak terbatas melalui import CSV atau Generator Siswa.';
  }
  return '';
});

const modalCheckpoints = computed(() => {
  if (resetAction.value === 'pemilih') {
    return [
      'Status seluruh siswa diubah menjadi Belum Memilih (sudah_memilih = false)',
      'Perolehan suara seluruh kandidat OSIS dikembalikan ke angka 0',
      'Seluruh rekaman di tabel votes dan tabel suara di database Supabase dihapus',
      'Data biodata siswa, kelas, dan akun login siswa tetap utuh'
    ];
  }
  if (resetAction.value === 'siswa-default') {
    return [
      'Daftar siswa dikembalikan ke data awal SMPN 2 Kota Bogor',
      'Seluruh perolehan suara kandidat direset ke 0',
      'Seluruh rekaman di tabel votes dan suara di Supabase dihapus'
    ];
  }
  if (resetAction.value === 'siswa-clear') {
    return [
      'Seluruh baris siswa di tabel siswa (Supabase & lokal) dihapus bersih (0 siswa)',
      'Seluruh rekaman di tabel votes dan suara di Supabase dihapus',
      'Perolehan suara kandidat direset ke 0'
    ];
  }
  return [];
});

const isConfirmDisabled = computed(() => {
  if (isResetting.value) return true;
  if (resetAction.value === 'pemilih') {
    return confirmationInput.value.trim().toUpperCase() !== 'RESET';
  }
  if (resetAction.value === 'siswa-clear') {
    return confirmationInput.value.trim().toUpperCase() !== 'KOSONGKAN';
  }
  return false;
});

function openResetModal(action: ResetType) {
  resetAction.value = action;
  confirmationInput.value = '';
  showResetModal.value = true;
}

function closeResetModal() {
  if (isResetting.value) return;
  showResetModal.value = false;
  resetAction.value = null;
  confirmationInput.value = '';
}

async function executeReset() {
  if (!resetAction.value) return;
  isResetting.value = true;
  alertMessage.value = '';
  errorMessage.value = '';

  try {
    if (resetAction.value === 'pemilih') {
      const res = await dbService.resetPemilihStatus();
      if (res.error) {
        errorMessage.value = `Reset berhasil dilakukan di storage lokal, namun Supabase mencatat: ${res.error}`;
      } else {
        alertMessage.value = `Berhasil! Status seluruh pemilih (${res.count} siswa yang telah memilih) berhasil dikembalikan menjadi Belum Memilih. Perolehan suara paslon dan rekaman di tabel votes & suara di database Supabase telah berhasil dihapus bersih.`;
      }
    } else if (resetAction.value === 'siswa-default') {
      const res = await dbService.resetSiswaToDefault();
      if (res.error) {
        errorMessage.value = `Data siswa lokal dipulihkan, status Supabase: ${res.error}`;
      } else {
        alertMessage.value = 'Berhasil! Data DPT siswa telah dipulihkan ke data standar bawaan sekolah, serta rekaman suara pada tabel votes & suara Supabase telah dibersihkan.';
      }
    } else if (resetAction.value === 'siswa-clear') {
      const res = await dbService.clearAllSiswa();
      if (res.error) {
        errorMessage.value = `DPT lokal dikosongkan, status Supabase: ${res.error}`;
      } else {
        alertMessage.value = 'Berhasil! Seluruh data siswa (DPT) dan seluruh rekaman di tabel votes & suara database Supabase telah dikosongkan sepenuhnya.';
      }
    }

    closeResetModal();
    await loadData();
    if (isSupabaseActive.value) {
      await runDiagnostics();
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Terjadi kesalahan saat memproses reset data.';
    closeResetModal();
  } finally {
    isResetting.value = false;
  }
}

async function runDiagnostics() {
  if (!isSupabaseActive.value) return;
  isCheckingDiag.value = true;
  try {
    diagData.value = await dbService.getSupabaseDiagnostics();
  } catch (err: any) {
    diagData.value = {
      connected: false,
      siswaCount: null,
      kandidatCount: null,
      suaraCount: null,
      votesCount: null,
      votesTableExists: false,
      error: err.message
    };
  } finally {
    isCheckingDiag.value = false;
  }
}

const schoolForm = reactive<Pengaturan>({
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: defaultLogo,
  periode_pemilihan: '2025/2026',
  voting_dibuka: true
});

const adminForm = reactive({
  nama_lengkap: '',
  username: '',
  new_password: '',
  confirm_password: ''
});

const supabaseConfig = reactive({
  url: '',
  key: ''
});

const isConnectingSupabase = ref(false);
const supabaseFeedback = ref<{
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  message: string;
} | null>(null);

const supabaseErrors = reactive({
  url: '',
  key: ''
});

const isSupabaseActive = computed(() => dbService.isUsingSupabase());

async function loadData() {
  const currentSettings = await dbService.getPengaturan();
  Object.assign(schoolForm, currentSettings);

  const admin: AdminUser = await dbService.getAdmin();
  adminForm.nama_lengkap = admin.nama_lengkap;
  adminForm.username = admin.username;

  const currentSb = dbService.getSupabaseConfig();
  supabaseConfig.url = currentSb.url;
  supabaseConfig.key = currentSb.key;

  currentStats.value = await dbService.getStatistics();
}

function handleLogoUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      schoolForm.logo_sekolah = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

async function saveSchoolSettings() {
  alertMessage.value = '';
  errorMessage.value = '';

  try {
    await dbService.updatePengaturan({
      nama_sekolah: schoolForm.nama_sekolah.trim(),
      periode_pemilihan: schoolForm.periode_pemilihan.trim(),
      logo_sekolah: schoolForm.logo_sekolah,
      voting_dibuka: schoolForm.voting_dibuka,
      waktu_mulai: schoolForm.waktu_mulai,
      waktu_selesai: schoolForm.waktu_selesai,
      quick_count_publik: schoolForm.quick_count_publik
    });

    alertMessage.value = 'Pengaturan identitas sekolah dan status pemilihan berhasil disimpan.';
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal menyimpan pengaturan sekolah.';
  }
}

async function saveAdminCredentials() {
  alertMessage.value = '';
  errorMessage.value = '';

  if (adminForm.new_password) {
    if (adminForm.new_password.length < 6) {
      errorMessage.value = 'Kata sandi baru minimal 6 karakter.';
      return;
    }
    if (adminForm.new_password !== adminForm.confirm_password) {
      errorMessage.value = 'Konfirmasi kata sandi tidak cocok.';
      return;
    }
  }

  try {
    await dbService.updateAdminCredentials(
      adminForm.username.trim(),
      adminForm.new_password ? adminForm.new_password.trim() : undefined,
      adminForm.nama_lengkap.trim()
    );

    alertMessage.value = 'Kredensial administrator berhasil diperbarui dengan aman (SHA-256).';
    adminForm.new_password = '';
    adminForm.confirm_password = '';
  } catch (err: any) {
    errorMessage.value = err.message || 'Gagal memperbarui kredensial admin.';
  }
}

async function saveAndTestSupabase() {
  alertMessage.value = '';
  errorMessage.value = '';
  supabaseFeedback.value = null;
  supabaseErrors.url = '';
  supabaseErrors.key = '';

  let cleanUrl = (supabaseConfig.url || '').trim();
  let cleanKey = (supabaseConfig.key || '').trim();

  let hasError = false;
  if (!cleanUrl) {
    supabaseErrors.url = 'Supabase Project URL wajib diisi.';
    hasError = true;
  }
  if (!cleanKey) {
    supabaseErrors.key = 'Supabase Anon Public Key wajib diisi.';
    hasError = true;
  }

  if (hasError) {
    supabaseFeedback.value = {
      type: 'danger',
      title: 'Formulir Belum Lengkap',
      message: 'Silakan isi Supabase Project URL dan Anon Public Key terlebih dahulu sebelum menghubungkan.'
    };
    return;
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
    supabaseConfig.url = cleanUrl;
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  supabaseConfig.url = cleanUrl;

  isConnectingSupabase.value = true;
  try {
    const testResult = await dbService.testSupabaseConnection(cleanUrl, cleanKey);
    if (!testResult.success) {
      supabaseFeedback.value = {
        type: 'danger',
        title: 'Koneksi Supabase Gagal',
        message: testResult.message
      };
      return;
    }

    const success = dbService.setCustomSupabaseConfig(cleanUrl, cleanKey);
    if (success) {
      if (testResult.hasTables === false) {
        supabaseFeedback.value = {
          type: 'warning',
          title: 'Terhubung ke Host Supabase (Tabel Belum Dibuat)',
          message: testResult.message
        };
      } else {
        supabaseFeedback.value = {
          type: 'success',
          title: 'Supabase Berhasil Terhubung!',
          message: 'Koneksi ke project Supabase berhasil diaktifkan dan seluruh tabel terverifikasi siap digunakan.'
        };
      }
      await runDiagnostics();
    } else {
      supabaseFeedback.value = {
        type: 'danger',
        title: 'Konfigurasi Tidak Valid',
        message: 'Format URL atau Key Supabase tidak dapat diinisialisasi.'
      };
    }
  } catch (err: any) {
    supabaseFeedback.value = {
      type: 'danger',
      title: 'Terjadi Kesalahan',
      message: err.message || 'Gagal menghubungkan ke Supabase.'
    };
  } finally {
    isConnectingSupabase.value = false;
  }
}

function disconnectSupabase() {
  supabaseConfig.url = '';
  supabaseConfig.key = '';
  supabaseErrors.url = '';
  supabaseErrors.key = '';
  dbService.setCustomSupabaseConfig('', '');
  diagData.value = null;
  supabaseFeedback.value = {
    type: 'info',
    title: 'Mode Database Lokal',
    message: 'Sistem telah kembali menggunakan Local Database Engine bawaan browser (IndexedDB/LocalStorage).'
  };
}

async function copySqlScript() {
  try {
    const res = await fetch('/supabase_schema.sql');
    const sqlText = await res.text();
    await navigator.clipboard.writeText(sqlText);
    isSqlCopied.value = true;
    setTimeout(() => {
      isSqlCopied.value = false;
    }, 3000);
  } catch {
    alert('Silakan buka file /supabase_schema.sql untuk menyalin query.');
  }
}

onMounted(async () => {
  await loadData();
  if (isSupabaseActive.value) {
    await runDiagnostics();
  }
});
</script>
