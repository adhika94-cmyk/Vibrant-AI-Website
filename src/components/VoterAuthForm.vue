<template>
  <div class="voter-auth-form">
    <!-- Category Toggle -->
    <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
      <div>
        <h2 class="h5 fw-bold text-dark mb-0">Portal Pemilih</h2>
        <small class="text-muted">Pilih kategori untuk masuk</small>
      </div>
      <div class="d-flex flex-wrap gap-2" role="group">
        <button 
          type="button" 
          class="btn btn-sm px-3 fw-bold"
          :class="voterType === 'siswa' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="setVoterType('siswa')"
        >
          <i class="bi bi-mortarboard-fill me-1"></i>SISWA
        </button>

        <button 
          type="button" 
          class="btn btn-sm px-3 fw-bold"
          :class="voterType === 'guru' ? 'btn-primary' : 'btn-outline-secondary'"
          @click="setVoterType('guru')"
        >
          <i class="bi bi-person-workspace me-1"></i>GURU / STAF
        </button>
      </div>
    </div>

    <!-- Alert Error -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 small py-2 px-3 mb-3 border-danger-subtle animate__animated animate__shakeX" role="alert">
      <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
      <div>{{ error }}</div>
    </div>

    <!-- Form Login -->
    <form @submit.prevent="handleSubmit">
      <!-- Identifier Field (NISN / NIP) -->
      <div class="mb-3">
        <label class="form-label fw-semibold text-secondary small mb-1">
          {{ voterType === 'siswa' ? 'Nomor Induk Siswa Nasional (NISN)' : 'Nomor Induk Pegawai (NIP)' }}
        </label>
        <div class="input-group">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi" :class="voterType === 'siswa' ? 'bi-card-text' : 'bi-person-badge'"></i>
          </span>
          <input 
            v-model.trim="form.identifier"
            type="text" 
            class="form-control border-start-0 ps-0 font-mono-numbers" 
            :placeholder="voterType === 'siswa' ? 'Contoh: 0089998881' : 'Contoh: 19750101...'"
            required
            autocomplete="username"
          />
        </div>
        <div class="form-text text-muted" style="font-size: 0.75rem;">
          {{ voterType === 'siswa' ? '10 digit NISN yang terdaftar' : 'NIP atau ID Guru yang terdaftar' }}
        </div>
      </div>

      <!-- Password Field (DOB / Birth Year) -->
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <label class="form-label fw-semibold text-secondary small mb-0">
            {{ voterType === 'siswa' ? 'Tanggal / Tahun Lahir Siswa' : 'Password (Tahun / Tanggal Lahir)' }}
          </label>
          <div v-if="voterType === 'siswa'" class="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              class="btn btn-outline-secondary py-0 px-2"
              :class="{ 'active': inputMode === 'text' }"
              style="font-size: 0.7rem;"
              @click="inputMode = 'text'"
            >
              Ketik Bebas
            </button>
            <button 
              type="button" 
              class="btn btn-outline-secondary py-0 px-2"
              :class="{ 'active': inputMode === 'date' }"
              style="font-size: 0.7rem;"
              @click="inputMode = 'date'"
            >
              Pilih Kalender
            </button>
          </div>
        </div>
        <div class="input-group">
          <span class="input-group-text bg-light text-muted border-end-0">
            <i class="bi" :class="voterType === 'siswa' ? 'bi-calendar-event' : 'bi-shield-lock'"></i>
          </span>
          <input 
            v-if="voterType === 'siswa' && inputMode === 'date'"
            v-model="form.password"
            type="date" 
            class="form-control border-start-0 ps-0" 
            required
            autocomplete="current-password"
          />
          <input 
            v-else-if="voterType === 'siswa' && inputMode === 'text'"
            v-model.trim="form.password"
            type="text" 
            class="form-control border-start-0 ps-0 font-mono-numbers" 
            placeholder="Contoh: 17-08-2011, 2011-08-17, atau 2011"
            required
            autocomplete="current-password"
          />
          <input 
            v-else
            v-model.trim="form.password"
            type="text" 
            maxlength="20"
            class="form-control border-start-0 ps-0 font-mono-numbers" 
            placeholder="Tahun / Tanggal Lahir (Contoh: 1975)"
            required
            autocomplete="current-password"
          />
        </div>
        <div class="form-text text-muted" style="font-size: 0.75rem;">
          {{ voterType === 'siswa' ? 'Mendukung format: DD-MM-YYYY, YYYY-MM-DD, 8 digit angka, atau tahun lahir saja.' : 'Gunakan 4 digit tahun kelahiran atau tanggal lahir Anda.' }}
        </div>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        class="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
        :disabled="loading"
        style="background-color: #1d4ed8; border-color: #1d4ed8;"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
        <i v-else class="bi bi-box-arrow-in-right"></i>
        <span>{{ loading ? 'Memverifikasi...' : 'Masuk Portal Pemilih' }}</span>
      </button>
    </form>

    <!-- Quick Demo Links (Internal to component for easier testing) -->
    <div class="mt-4 pt-3 border-top">
      <p class="text-muted fw-semibold mb-2" style="font-size: 0.7rem;">DEMO LOGIN CEPAT:</p>
      <div class="d-grid gap-2">
        <button 
          v-for="demo in demoAccounts" 
          :key="demo.id"
          type="button" 
          class="btn btn-light btn-sm text-start border d-flex align-items-center justify-content-between py-2 px-3"
          @click="useDemo(demo)"
        >
          <div>
            <span class="fw-bold text-dark small d-block">{{ demo.name }}</span>
            <span class="text-muted" style="font-size: 0.65rem;">{{ demo.type.toUpperCase() }}: {{ demo.id }} · Pass: {{ demo.pass }}</span>
          </div>
          <i class="bi bi-chevron-right text-primary"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { authService } from '../services/auth';

const emit = defineEmits(['success']);

const voterType = ref<'siswa' | 'guru'>('siswa');
const inputMode = ref<'text' | 'date'>('text');
const loading = ref(false);
const error = ref('');

const form = reactive({
  identifier: '',
  password: ''
});

// Watcher-like behavior via function
function setVoterType(type: 'siswa' | 'guru') {
  voterType.value = type;
  error.value = '';
  form.identifier = '';
  form.password = '';
}

const demoAccounts = [
  { id: '0089998881', pass: '2011-08-17', name: 'Raden Arya (Siswa)', type: 'siswa' },
  { id: '197501012005011001', pass: '1975', name: 'Drs. H. Mulyadi (Guru)', type: 'guru' }
];

async function useDemo(demo: any) {
  voterType.value = demo.type as 'siswa' | 'guru';
  inputMode.value = 'text';
  form.identifier = demo.id;
  form.password = demo.pass;
  error.value = '';
  
  // Auto login for demo
  await handleSubmit();
}

async function handleSubmit() {
  error.value = '';
  loading.value = true;

  try {
    const result = await authService.loginSiswa(form.identifier, form.password);
    if (result.success) {
      emit('success', result.siswa);
    } else {
      error.value = result.message;
    }
  } catch (err: any) {
    error.value = 'Terjadi kesalahan sistem: ' + (err.message || 'Unknown error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.animate__animated {
  animation-duration: 0.5s;
}
</style>
