<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <h1 class="h4 fw-bold text-dark mb-0">Manajemen Dewan Guru & Staf</h1>
          <span class="badge bg-info-subtle text-info border border-info-subtle font-mono-numbers">
            <i class="bi bi-person-workspace me-1"></i>Kategori Guru
          </span>
        </div>
        <p class="text-muted small mb-0">
          Kelola data pemilih khusus dewan guru, tenaga pendidik, dan staf administrasi SMP Negeri 2 Kota Bogor
        </p>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <!-- Tombol Generator DPT Otomatis -->
        <button 
          type="button" 
          class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" 
          @click="openGeneratorModal"
          title="Buat data guru otomatis untuk simulasi"
        >
          <i class="bi bi-magic"></i>
          <span>Generator Guru Massal</span>
        </button>

        <!-- Tombol Import CSV / Excel -->
        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" @click="openImportModal">
          <i class="bi bi-file-earmark-arrow-up"></i>
          <span>Import Data Guru</span>
        </button>

        <!-- Tambah Unit Langsung -->
        <router-link :to="{ path: '/admin/kelas', query: { tingkat: '0' } }" class="btn btn-outline-info btn-sm d-flex align-items-center gap-1">
          <i class="bi bi-building-plus"></i>
          <span>Tambah Unit Baru</span>
        </router-link>

        <!-- Tambah Pemilih Manual -->
        <button 
          type="button" 
          class="btn btn-primary btn-sm d-flex align-items-center gap-1" 
          @click="openAddModal" 
          style="background-color: #1d4ed8;"
        >
          <i class="bi bi-person-plus-fill"></i>
          <span>Tambah Guru Manual</span>
        </button>
      </div>
    </div>

    <!-- Warning if no Guru Units -->
    <div v-if="guruClasses.length === 0" class="alert alert-warning py-2 px-3 small border-warning-subtle mb-3">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>
      Belum ada <strong>Unit Guru/Staf</strong> yang terdaftar. Silakan tambahkan unit dengan <strong>Tingkat 0</strong> di 
      <router-link to="/admin/kelas" class="fw-bold text-decoration-none">Manajemen Kelas & Unit</router-link> terlebih dahulu.
    </div>

    <!-- Alert Success / Info -->
    <div v-if="alertMessage" class="alert alert-success alert-dismissible fade show small py-2 px-3 border-success-subtle mb-3" role="alert">
      <i class="bi bi-check-circle-fill me-1"></i>
      <span>{{ alertMessage }}</span>
      <button type="button" class="btn-close py-2" @click="alertMessage = ''"></button>
    </div>

    <!-- Stats Summary -->
    <div class="row g-2 mb-3">
      <div class="col-12 col-lg-8">
        <div class="alert alert-info py-2 px-3 small border-info-subtle mb-0 d-flex align-items-center h-100">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-info-circle-fill text-info fs-5 flex-shrink-0"></i>
            <span>Password login untuk Guru/Staf adalah <strong>4 digit tahun lahir</strong> (Contoh: 1980). NIP digunakan sebagai username.</span>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="p-2 px-3 rounded border bg-light d-flex align-items-center justify-content-between h-100 font-mono-numbers small">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-people text-primary"></i>
            <span class="text-muted">Total Guru: <strong class="text-dark">{{ filteredSiswaList.length.toLocaleString('id-ID') }}</strong></span>
          </div>
          <span class="text-success"><i class="bi bi-check2-circle me-1"></i>{{ countSudah.toLocaleString('id-ID') }}</span>
          <span class="text-danger"><i class="bi bi-clock-history me-1"></i>{{ countBelum.toLocaleString('id-ID') }}</span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="card card-clean mb-4">
      <div class="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" style="background-color: #f8fafc;">
        <!-- Filter Controls -->
        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Filter Status Memilih -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Status:</span>
            <select v-model="filterStatus" class="form-select form-select-sm" style="min-width: 130px;" @change="currentPage = 1">
              <option value="all">Semua Status</option>
              <option value="sudah">Sudah Memilih</option>
              <option value="belum">Belum Memilih</option>
            </select>
          </div>

          <!-- Per Halaman -->
          <div class="d-flex align-items-center gap-1">
            <span class="text-muted small fw-medium">Tampil:</span>
            <select v-model="pageSize" class="form-select form-select-sm" style="min-width: 90px;" @change="currentPage = 1">
              <option :value="25">25 / hal</option>
              <option :value="50">50 / hal</option>
              <option :value="100">100 / hal</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>

        <!-- Search Input -->
        <div class="input-group input-group-sm" style="max-width: 320px;">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi bi-search"></i>
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control border-start-0" 
            placeholder="Cari NIP atau Nama Guru..."
            @input="currentPage = 1"
          />
          <button v-if="searchQuery" class="btn btn-outline-secondary" type="button" @click="searchQuery = ''; currentPage = 1">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 60px;">No</th>
              <th>NIP / ID Guru</th>
              <th>Nama Lengkap</th>
              <th>Tanggal Lahir</th>
              <th>Unit / Penugasan</th>
              <th>Status Hak Suara</th>
              <th style="width: 140px;" class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSiswaList.length === 0">
              <td colspan="7" class="text-center py-5 text-muted small">
                <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                Tidak ada data guru yang ditemukan.
              </td>
            </tr>
            <tr v-for="(siswa, idx) in paginatedSiswaList" :key="siswa.id">
              <td class="font-mono-numbers text-muted">
                {{ pageSize === 'all' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1 }}
              </td>
              <td>
                <span class="font-mono-numbers fw-bold text-dark">{{ siswa.nisn }}</span>
              </td>
              <td>
                <span class="fw-semibold text-dark">{{ siswa.nama }}</span>
              </td>
              <td>
                <span class="text-muted small font-mono-numbers">{{ siswa.tanggal_lahir }}</span>
              </td>
              <td>
                <span class="badge bg-light text-dark border font-mono-numbers">
                  {{ siswa.kelas_nama || 'DEWAN GURU' }}
                </span>
              </td>
              <td>
                <span 
                  class="badge d-inline-flex align-items-center gap-1"
                  :class="siswa.sudah_memilih ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                >
                  <i class="bi" :class="siswa.sudah_memilih ? 'bi-check-circle-fill' : 'bi-x-circle'"></i>
                  <span>{{ siswa.sudah_memilih ? 'Sudah Memilih' : 'Belum Memilih' }}</span>
                </span>
              </td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <button 
                    v-if="siswa.sudah_memilih"
                    type="button" 
                    class="btn btn-outline-warning btn-sm py-1 px-2"
                    title="Reset Hak Suara"
                    @click="confirmResetVote(siswa)"
                  >
                    <i class="bi bi-arrow-counterclockwise"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-primary btn-sm py-1 px-2"
                    title="Edit Data"
                    @click="openEditModal(siswa)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-outline-danger btn-sm py-1 px-2"
                    title="Hapus"
                    @click="confirmDelete(siswa)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-3 border-top bg-light d-flex justify-content-center">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="currentPage--">&laquo;</button>
          </li>
          <li 
            v-for="p in totalPages" 
            :key="p" 
            class="page-item"
            :class="{ active: p === currentPage }"
          >
            <button class="page-link" @click="currentPage = p">{{ p }}</button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link" @click="currentPage++">&raquo;</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- MODAL IMPORT DATA GURU -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showImportModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showImportModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <div>
              <h5 class="modal-title fw-bold text-dark fs-6 mb-0">
                <i class="bi bi-file-earmark-arrow-up me-1 text-primary"></i>
                Import Data Guru & Staf dari CSV / Excel
              </h5>
              <small class="text-muted" style="font-size: 0.75rem;">
                Mendukung upload ribuan baris data sekaligus
              </small>
            </div>
            <button type="button" class="btn-close" @click="showImportModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-secondary">1. Upload File Excel / CSV:</label>
                <input type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" class="form-control form-control-sm" @change="handleFileUpload" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-secondary">2. Pilihan Unit Tujuan:</label>
                <select v-model="importTargetKelas" class="form-select form-select-sm">
                  <option value="auto">Deteksi Otomatis (Kolom Unit)</option>
                  <option v-for="k in guruClasses" :key="k.id" :value="k.id">
                    {{ k.nama_kelas }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="parsedPreview.length > 0" class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold small text-secondary">Pratinjau Data ({{ parsedPreview.length }} Baris):</span>
              </div>
              <div class="table-responsive rounded border bg-white" style="max-height: 160px;">
                <table class="table table-sm table-striped align-middle mb-0 font-mono-numbers" style="font-size: 0.75rem;">
                  <thead class="table-light">
                    <tr>
                      <th>No</th><th>NIP</th><th>Nama</th><th>Tgl Lahir</th><th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, pIdx) in parsedPreview.slice(0, 5)" :key="pIdx">
                      <td>{{ pIdx + 1 }}</td><td>{{ p.nisn }}</td><td>{{ p.nama }}</td><td>{{ p.tanggal_lahir }}</td><td>{{ p.nama_kelas }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="importLoading" class="text-center py-2">
              <div class="spinner-border text-primary spinner-border-sm mb-1" role="status"></div>
              <p class="small text-muted mb-0">Sedang memproses data...</p>
            </div>
            <div v-if="importResult" class="alert alert-info py-2 px-3 small border-info-subtle mb-0">
              <i class="bi bi-info-circle-fill me-1"></i>{{ importResult }}
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary btn-sm" @click="showImportModal = false">Tutup</button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm px-3" 
              @click="processImport" 
              :disabled="parsedPreview.length === 0 || importLoading"
            >
              Proses Import ({{ parsedPreview.length }} Guru)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL GENERATOR GURU MASSAL -->
    <div 
      class="modal fade" 
      :class="{ 'show d-block': showGeneratorModal }" 
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.6);"
      v-if="showGeneratorModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title fw-bold text-dark fs-6 mb-0">Generator Guru</h5>
            <button type="button" class="btn-close" @click="showGeneratorModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label fw-semibold small text-secondary">Jumlah Guru Baru:</label>
              <input v-model.number="generatorCount" type="number" class="form-control" min="1" max="500" />
            </div>
            <div v-if="generatorLoading" class="text-center py-2">
              <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary btn-sm" @click="showGeneratorModal = false">Batal</button>
            <button type="button" class="btn btn-success btn-sm" @click="processGenerator" :disabled="generatorLoading || generatorCount <= 0">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORM GURU -->
    <div class="modal fade" :class="{ 'show d-block': showModal }" v-if="showModal" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ isEditing ? 'Edit Data Guru' : 'Tambah Guru Baru' }}</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <form @submit.prevent="saveGuru">
            <div class="modal-body p-4">
              <div v-if="guruClasses.length === 0" class="alert alert-warning py-2 small mb-3">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                <strong>Perhatian:</strong> Belum ada Unit Guru/Staf yang terdaftar di sistem. 
                Silakan <router-link to="/admin/kelas?tingkat=0" class="fw-bold">tambah unit dengan Tingkat 0</router-link> terlebih dahulu agar dapat mendaftarkan guru secara manual.
              </div>
              <div v-if="formError" class="alert alert-danger py-2 small mb-3">{{ formError }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">NIP / ID Pegawai</label>
                <input v-model="formData.nisn" type="text" class="form-control font-mono-numbers" placeholder="Contoh: 19750101..." required />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Nama Lengkap & Gelar</label>
                <input v-model="formData.nama" type="text" class="form-control" placeholder="Contoh: Drs. Ahmad Fauzi, M.Pd" required />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Tanggal Lahir (Password: Tahun Lahir)</label>
                <input v-model="formData.tanggal_lahir" type="date" class="form-control" required />
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label small fw-semibold text-secondary mb-0">Unit / Penugasan</label>
                  <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" @click="loadData" title="Segarkan daftar unit">
                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                  </button>
                </div>
                <select v-model="formData.kelas_id" class="form-select" :required="guruClasses.length > 0" :disabled="guruClasses.length === 0">
                  <option value="" disabled>-- Pilih Unit --</option>
                  <option v-for="k in guruClasses" :key="k.id" :value="k.id">{{ k.nama_kelas }}</option>
                </select>
              </div>

              <div v-if="isEditing" class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="formData.sudah_memilih" id="swVote" />
                <label class="form-check-label small" for="swVote">Sudah Memilih</label>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary btn-sm" @click="showModal = false">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm px-4 shadow-sm" :disabled="guruClasses.length === 0">
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" v-if="showDeleteModal" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center p-4">
            <i class="bi bi-trash-fill fs-1 text-danger mb-2"></i>
            <h5 class="fw-bold">Hapus Data Guru?</h5>
            <p class="text-muted small">Tindakan ini tidak dapat dibatalkan.</p>
            <div class="d-flex gap-2 justify-content-center mt-3">
              <button class="btn btn-light btn-sm px-3" @click="showDeleteModal = false">Batal</button>
              <button class="btn btn-danger btn-sm px-3" @click="deleteGuru">Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { dbService } from '../../services/db';
import type { Siswa, Kelas } from '../../types';
import * as XLSX from 'xlsx';
import { parseStudentText } from '../../utils/studentParser';

const siswaList = ref<Siswa[]>([]);
const kelasList = ref<Kelas[]>([]);
const alertMessage = ref('');
const searchQuery = ref('');
const filterStatus = ref('all');
const pageSize = ref<number | 'all'>(50);
const currentPage = ref(1);

const showModal = ref(false);
const isEditing = ref(false);
const formError = ref('');
const formData = ref({
  id: '',
  nisn: '',
  nama: '',
  tanggal_lahir: '1980-01-01',
  kelas_id: '',
  sudah_memilih: false,
  kategori: 'guru' as const
});

const showDeleteModal = ref(false);
const itemToDelete = ref<Siswa | null>(null);

// Import & Generator states
const showImportModal = ref(false);
const importTargetKelas = ref('auto');
const importLoading = ref(false);
const importResult = ref('');
const parsedPreview = ref<any[]>([]);

const showGeneratorModal = ref(false);
const generatorCount = ref(10);
const generatorLoading = ref(false);

async function loadData() {
  const allSiswa = await dbService.getSiswaList();
  const allKelas = await dbService.getKelasList();
  kelasList.value = allKelas;
  
  // Ambil ID kelas yang tingkatnya 0 (Guru/Staf)
  const guruKelasIds = new Set(allKelas.filter(k => Number(k.tingkat) === 0).map(k => k.id));
  
  // Sinkronisasi: Tampilkan semua yang kategorinya 'guru' ATAU berada di unit tingkat 0
  siswaList.value = allSiswa.filter(s => {
    const isGuruCategory = s.kategori === 'guru';
    const isInGuruUnit = guruKelasIds.has(s.id) || guruKelasIds.has(s.kelas_id);
    return isGuruCategory || isInGuruUnit;
  });
}

const guruClasses = computed(() => {
  // Hanya ambil unit yang memiliki tingkat 0 (Guru/Staf) sesuai Manajemen Kelas & Unit
  // Gunakan Number() untuk antisipasi data dari database yang mungkin bertipe string
  const filtered = kelasList.value.filter(k => {
    const isGuruUnit = Number(k.tingkat) === 0;
    return isGuruUnit;
  });
  return filtered;
});

const filteredSiswaList = computed(() => {
  return siswaList.value.filter(s => {
    const matchStatus = filterStatus.value === 'all' || 
      (filterStatus.value === 'sudah' && s.sudah_memilih) ||
      (filterStatus.value === 'belum' && !s.sudah_memilih);
    const matchSearch = searchQuery.value === '' || 
      s.nama.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.nisn.includes(searchQuery.value.trim());
    return matchStatus && matchSearch;
  });
});

const totalPages = computed(() => {
  if (pageSize.value === 'all' || filteredSiswaList.value.length === 0) return 1;
  return Math.ceil(filteredSiswaList.value.length / (pageSize.value as number));
});

const paginatedSiswaList = computed(() => {
  if (pageSize.value === 'all') return filteredSiswaList.value;
  const start = (currentPage.value - 1) * (pageSize.value as number);
  return filteredSiswaList.value.slice(start, start + (pageSize.value as number));
});

const countSudah = computed(() => filteredSiswaList.value.filter(s => s.sudah_memilih).length);
const countBelum = computed(() => filteredSiswaList.value.filter(s => !s.sudah_memilih).length);

function openAddModal() {
  console.log('Opening Add Guru Modal...');
  isEditing.value = false;
  formError.value = '';
  
  // Ambil unit guru pertama jika ada
  const defaultKelasId = guruClasses.value.length > 0 ? guruClasses.value[0].id : '';
  
  formData.value = {
    id: '',
    nisn: '',
    nama: '',
    tanggal_lahir: '1980-01-01',
    kelas_id: defaultKelasId,
    sudah_memilih: false,
    kategori: 'guru'
  };
  showModal.value = true;
}

function openEditModal(guru: Siswa) {
  isEditing.value = true;
  formError.value = '';
  formData.value = {
    id: guru.id,
    nisn: guru.nisn,
    nama: guru.nama,
    tanggal_lahir: guru.tanggal_lahir,
    kelas_id: guru.kelas_id,
    sudah_memilih: guru.sudah_memilih,
    kategori: 'guru'
  };
  showModal.value = true;
}

async function saveGuru() {
  try {
    await dbService.saveSiswa({
      ...formData.value,
      id: formData.value.id || undefined
    });
    alertMessage.value = 'Data guru berhasil disimpan.';
    showModal.value = false;
    await loadData();
  } catch (e: any) {
    formError.value = e.message;
  }
}

function confirmDelete(guru: Siswa) {
  itemToDelete.value = guru;
  showDeleteModal.value = true;
}

async function deleteGuru() {
  if (!itemToDelete.value) return;
  await dbService.deleteSiswa(itemToDelete.value.id);
  alertMessage.value = 'Data guru berhasil dihapus.';
  showDeleteModal.value = false;
  await loadData();
}

async function confirmResetVote(guru: Siswa) {
  if (confirm(`Reset hak suara ${guru.nama}?`)) {
    await dbService.resetHakSuaraSiswa(guru.id);
    alertMessage.value = 'Hak suara berhasil direset.';
    await loadData();
  }
}

function openGeneratorModal() {
  generatorCount.value = 10;
  generatorLoading.value = false;
  showGeneratorModal.value = true;
}

async function processGenerator() {
  generatorLoading.value = true;
  try {
    await dbService.generateBulkSiswa(generatorCount.value, 'all', 'guru');
    showGeneratorModal.value = false;
    alertMessage.value = `${generatorCount.value} data guru baru berhasil digenerate.`;
    await loadData();
  } catch (e: any) {
    alert(e.message);
  } finally {
    generatorLoading.value = false;
  }
}

function openImportModal() {
  parsedPreview.value = [];
  importResult.value = '';
  importLoading.value = false;
  showImportModal.value = true;
}

async function handleFileUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: any) => {
    const data = e.target.result;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      const text = rows.map(row => row.join('\t')).join('\n');
      const { parsed } = parseStudentText(text, importTargetKelas.value, kelasList.value);
      parsedPreview.value = parsed.map(p => ({ ...p, kategori: 'guru' }));
    } else {
      const { parsed } = parseStudentText(data, importTargetKelas.value, kelasList.value);
      parsedPreview.value = parsed.map(p => ({ ...p, kategori: 'guru' }));
    }
  };

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}

async function processImport() {
  if (parsedPreview.value.length === 0) return;
  importLoading.value = true;
  try {
    const result = await dbService.importSiswaBatch(parsedPreview.value, true, importTargetKelas.value);
    importResult.value = `Berhasil: ${result.imported} baru, ${result.updated} diperbarui.`;
    alertMessage.value = 'Proses import data guru selesai.';
    setTimeout(() => {
      showImportModal.value = false;
      loadData();
    }, 1500);
  } catch (e: any) {
    importResult.value = 'Gagal: ' + e.message;
  } finally {
    importLoading.value = false;
  }
}

onMounted(loadData);
</script>
