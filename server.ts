import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import http from 'http';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS headers for multi-device Wi-Fi access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// SSE Clients for real-time notifications across devices on Wi-Fi
const sseClients: Response[] = [];

function broadcastVoteEvent(payload: any) {
  const data = JSON.stringify({ type: 'vote_cast', payload, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

// -------------------------------------------------------------
// CENTRAL PERSISTENT FILE STORE (data/eosis_db.json)
// Ensures all devices on the Wi-Fi share the exact same DPT & config!
// -------------------------------------------------------------
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'eosis_db.json');

// Default initial data for SMP Negeri 2 Kota Bogor
const INITIAL_CLASSES = [
  { id: 'k-7a', nama_kelas: '7-A', tingkat: 7, wali_kelas: 'Dra. Sri Wahyuni, M.Pd' },
  { id: 'k-7b', nama_kelas: '7-B', tingkat: 7, wali_kelas: 'Ahmad Fauzi, S.Pd' },
  { id: 'k-7c', nama_kelas: '7-C', tingkat: 7, wali_kelas: 'Dewi Lestari, S.Pd' },
  { id: 'k-8a', nama_kelas: '8-A', tingkat: 8, wali_kelas: 'Bambang Sudirman, M.Si' },
  { id: 'k-8b', nama_kelas: '8-B', tingkat: 8, wali_kelas: 'Rina Kusuma, S.Pd' },
  { id: 'k-8c', nama_kelas: '8-C', tingkat: 8, wali_kelas: 'Hendra Gunawan, S.Kom' },
  { id: 'k-9a', nama_kelas: '9-A', tingkat: 9, wali_kelas: 'Drs. H. Mulyadi' },
  { id: 'k-9b', nama_kelas: '9-B', tingkat: 9, wali_kelas: 'Siti Nurhaliza, M.Pd' },
  { id: 'k-9c', nama_kelas: '9-C', tingkat: 9, wali_kelas: 'Eko Prasetyo, S.Pd' },
  { id: 'k-guru', nama_kelas: 'DEWAN GURU & STAF', tingkat: 0, wali_kelas: 'Kepala Sekolah' }
];

const INITIAL_CANDIDATES = [
  {
    id: 'cand-1',
    nomor_urut: 1,
    nama_ketua: 'Muhammad Reza Pratama',
    nama_wakil: 'Amanda Putri Maharani',
    slogan: 'Inovatif, Berkarakter, dan Menginspirasi Prestasi',
    visi: 'Mewujudkan OSIS SMP Negeri 2 Kota Bogor sebagai wadah aspirasi siswa yang unggul, religius, berwawasan global, dan berakar pada nilai integritas kebangsaan.',
    misi: '1. Mengoptimalkan program ekstrakurikuler seni, riset ilmiah, dan olahraga.\n2. Mengembangkan literasi digital cerdas serta kampanye anti-perundungan (zero bullying).\n3. Menampung dan merealisasikan aspirasi siswa melalui kotak saran digital e-Spenda.\n4. Mengadakan festival bakat dan kepemimpinan siswa secara berkala.',
    foto_url: '/src/assets/images/kandidat_paslon_1_1793253208173.jpg',
    total_suara: 142
  },
  {
    id: 'cand-2',
    nomor_urut: 2,
    nama_ketua: 'Aisha Humaira Zahra',
    nama_wakil: 'Budi Kurnia Pratama',
    slogan: 'Solidaritas Bersama, Spenda Berwibawa & Peduli Lingkungan',
    visi: 'Membangun karakter siswa SPENDA yang peduli lingkungan (Green School), kreatif, berdisiplin tinggi, dan saling merangkul dalam kebersamaan.',
    misi: '1. Menggalakkan program eco-school peduli daur ulang dan hemat energi di sekolah.\n2. Menjalin keakraban antartingkat kelas melalui kompetisi classmeeting kreatif.\n3. Memberdayakan unit kegiatan keagamaan dan toleransi antarwarga sekolah.\n4. Memperkuat kolaborasi OSIS bersama dewan guru dan alumni berprestasi.',
    foto_url: '/src/assets/images/kandidat_paslon_2_1793253209127.jpg',
    total_suara: 168
  },
  {
    id: 'cand-3',
    nomor_urut: 3,
    nama_ketua: 'Annisa Rahmawati',
    nama_wakil: 'Rifqi Permana Putra',
    slogan: 'Aspiratif, Berprestasi, dan Berteknologi Menuju Masa Depan',
    visi: 'Mewujudkan lingkungan SMPN 2 Kota Bogor yang ramah anak, adaptif terhadap kemajuan teknologi, dan berdaya saing tinggi di tingkat regional maupun nasional.',
    misi: '1. Menginisiasi klub coding, multimedia, dan podcast edukasi siswa SPENDA.\n2. Meningkatkan bimbingan sebaya untuk persiapan olimpiade sains dan seni.\n3. Menyelenggarakan aksi bakti sosial dan kepedulian masyarakat Kota Bogor.\n4. Memperjuangkan transparansi kegiatan dan anggaran OSIS kepada perwakilan kelas.',
    foto_url: '/src/assets/images/kandidat_paslon_3_1793253209679.jpg',
    total_suara: 115
  }
];

const INITIAL_STUDENTS = [
  { id: 's-1', nisn: '0081234501', nama: 'Aditya Dimas Nugraha', tanggal_lahir: '2011-04-12', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:15:20Z', kategori: 'siswa' },
  { id: 's-2', nisn: '0081234502', nama: 'Bella Safitri Handayani', tanggal_lahir: '2011-06-25', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:22:11Z', kategori: 'siswa' },
  { id: 's-3', nisn: '0081234503', nama: 'Citra Kirana Dewi', tanggal_lahir: '2011-09-18', kelas_id: 'k-7a', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-4', nisn: '0081234504', nama: 'Danang Tri Wicaksono', tanggal_lahir: '2011-11-03', kelas_id: 'k-7a', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-5', nisn: '0081234505', nama: 'Erina Zahrani', tanggal_lahir: '2011-02-14', kelas_id: 'k-7a', sudah_memilih: true, waktu_memilih: '2026-10-28T08:35:40Z', kategori: 'siswa' },
  { id: 's-6', nisn: '0071234506', nama: 'Fajar Hidayatullah', tanggal_lahir: '2010-05-19', kelas_id: 'k-8a', sudah_memilih: true, waktu_memilih: '2026-10-28T09:10:15Z', kategori: 'siswa' },
  { id: 's-7', nisn: '0071234507', nama: 'Gita Permatasari', tanggal_lahir: '2010-08-30', kelas_id: 'k-8a', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-8', nisn: '0071234508', nama: 'Haikal Rasyid', tanggal_lahir: '2010-12-05', kelas_id: 'k-8a', sudah_memilih: true, waktu_memilih: '2026-10-28T09:25:33Z', kategori: 'siswa' },
  { id: 's-9', nisn: '0071234509', nama: 'Indah Kusuma Wardani', tanggal_lahir: '2010-01-22', kelas_id: 'k-8a', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-10', nisn: '0061234510', nama: 'Jonathan Edward Siregar', tanggal_lahir: '2009-03-21', kelas_id: 'k-9a', sudah_memilih: true, waktu_memilih: '2026-10-28T10:02:44Z', kategori: 'siswa' },
  { id: 's-11', nisn: '0061234511', nama: 'Kayla Az-Zahra', tanggal_lahir: '2009-07-15', kelas_id: 'k-9a', sudah_memilih: true, waktu_memilih: '2026-10-28T10:14:02Z', kategori: 'siswa' },
  { id: 's-12', nisn: '0061234512', nama: 'Luthfi Hakim', tanggal_lahir: '2009-10-09', kelas_id: 'k-9a', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  // Akun Demo Cepat
  { id: 's-demo', nisn: '0089998881', nama: 'Raden Arya Wibisono', tanggal_lahir: '2011-08-17', kelas_id: 'k-7b', sudah_memilih: false, waktu_memilih: null, kategori: 'siswa' },
  { id: 's-demo2', nisn: '0078887772', nama: 'Siti Sarah Nurhaliza', tanggal_lahir: '2010-03-20', kelas_id: 'k-8b', sudah_memilih: true, waktu_memilih: '2026-10-28T08:50:11Z', kategori: 'siswa' },
  // Akun Guru
  { id: 'g-1', nisn: '197501012005011001', nama: 'Drs. H. Mulyadi, M.Pd', tanggal_lahir: '1975-01-01', kelas_id: 'k-guru', sudah_memilih: false, waktu_memilih: null, kategori: 'guru' },
  { id: 'g-2', nisn: '198205122010012005', nama: 'Sri Wahyuni, S.Pd', tanggal_lahir: '1982-05-12', kelas_id: 'k-guru', sudah_memilih: false, waktu_memilih: null, kategori: 'guru' }
];

const INITIAL_SETTINGS = {
  id: 1,
  nama_sekolah: 'SMP NEGERI 2 KOTA BOGOR',
  logo_sekolah: '/src/assets/images/osis_spenda_logo_1793253206503.jpg',
  periode_pemilihan: '2025/2026',
  waktu_mulai: '2026-10-28T07:00:00Z',
  waktu_selesai: '2026-11-05T15:00:00Z',
  voting_dibuka: true,
  quick_count_publik: true
};

const INITIAL_ADMIN = {
  id: 'adm-1',
  username: 'admin',
  nama_lengkap: 'Pembina OSIS SMPN 2',
  password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};

interface DatabaseStore {
  supabase_url: string;
  supabase_key: string;
  settings: typeof INITIAL_SETTINGS;
  admin: typeof INITIAL_ADMIN;
  kelas: typeof INITIAL_CLASSES;
  kandidat: typeof INITIAL_CANDIDATES;
  siswa: typeof INITIAL_STUDENTS;
  suara: Array<{ id: string; kandidat_id: string; waktu: string }>;
}

function getDatabase(): DatabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Server DB] Error reading DB file:', err);
  }

  // Inisialisasi awal jika belum ada
  const initialDb: DatabaseStore = {
    supabase_url: process.env.VITE_SUPABASE_URL || '',
    supabase_key: process.env.VITE_SUPABASE_ANON_KEY || '',
    settings: { ...INITIAL_SETTINGS },
    admin: { ...INITIAL_ADMIN },
    kelas: [...INITIAL_CLASSES],
    kandidat: [...INITIAL_CANDIDATES],
    siswa: [...INITIAL_STUDENTS],
    suara: [
      ...Array(142).fill({ id: 'v-1', kandidat_id: 'cand-1', waktu: '2026-10-28T08:00:00Z' }),
      ...Array(168).fill({ id: 'v-2', kandidat_id: 'cand-2', waktu: '2026-10-28T08:30:00Z' }),
      ...Array(115).fill({ id: 'v-3', kandidat_id: 'cand-3', waktu: '2026-10-28T09:00:00Z' })
    ]
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseStore): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Server DB] Error writing DB file:', err);
    return false;
  }
}

// Helper normalisasi tanggal lahir
function normalizeDateStr(dateStr?: string | null): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim().replace(/['"]/g, '');
  if (!str) return '';

  // Format 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD or YYYY MM DD
  const ymdMatch = str.match(/^(\d{4})[-/.\s](\d{1,2})[-/.\s](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD MM YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{4})/);
  if (dmyMatch) {
    const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const year = parseInt(dmyMatch[3], 10);
    return `${year}-${month}-${day}`;
  }

  // Format 3: 8 digit tanpa pemisah (contoh: 17082011 atau 20110817)
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length === 8) {
    const firstFour = parseInt(digitsOnly.substring(0, 4), 10);
    if (firstFour >= 1930 && firstFour <= 2050) {
      const month = digitsOnly.substring(4, 6);
      const day = digitsOnly.substring(6, 8);
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        return `${firstFour}-${month}-${day}`;
      }
    }

    const lastFour = parseInt(digitsOnly.substring(4, 8), 10);
    if (lastFour >= 1930 && lastFour <= 2050) {
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        return `${lastFour}-${month}-${day}`;
      }
    }
  }

  // Format 4: Hanya Tahun (4 digit)
  const yearOnlyMatch = str.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    return `${yearOnlyMatch[1]}-01-01`;
  }

  return str;
}

// Cerdas membandingkan password dengan tanggal lahir pemilih
function matchDobOrPassword(storedDob?: string | null, inputPass?: string | null): boolean {
  if (!storedDob || !inputPass) return false;
  const cleanInput = String(inputPass).trim().replace(/['"]/g, '');
  const cleanStored = String(storedDob).trim().replace(/['"]/g, '');
  if (!cleanInput || !cleanStored) return false;

  // 1. Direct exact match
  if (cleanInput.toLowerCase() === cleanStored.toLowerCase()) return true;

  // 2. Jika input adalah 4 digit tahun (misal: 2011 atau 1975)
  if (/^\d{4}$/.test(cleanInput)) {
    if (cleanStored.startsWith(cleanInput) || cleanStored.endsWith(cleanInput)) {
      return true;
    }
  }

  // 3. Normalisasi kedua tanggal
  const normInput = normalizeDateStr(cleanInput);
  const normStored = normalizeDateStr(cleanStored);
  if (normInput && normStored && normInput === normStored) {
    return true;
  }

  // 4. Perbandingan angka saja
  const inputDigits = cleanInput.replace(/\D/g, '');
  const storedDigits = cleanStored.replace(/\D/g, '');
  if (inputDigits && storedDigits) {
    if (inputDigits === storedDigits) return true;
    if (inputDigits.length === 4 && storedDigits.startsWith(inputDigits)) return true;
    if (storedDigits.length === 4 && inputDigits.startsWith(storedDigits)) return true;

    if (inputDigits.length === 8 && storedDigits.length === 8) {
      const storedY = storedDigits.substring(0, 4);
      const storedM = storedDigits.substring(4, 6);
      const storedD = storedDigits.substring(6, 8);

      const inputD = inputDigits.substring(0, 2);
      const inputM = inputDigits.substring(2, 4);
      const inputY = inputDigits.substring(4, 8);

      if (storedY === inputY && storedM === inputM && storedD === inputD) {
        return true;
      }
    }
  }

  return false;
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. System Status & Bootstrap
app.get('/api/bootstrap', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    success: true,
    supabase_url: db.supabase_url,
    supabase_key: db.supabase_key,
    settings: db.settings,
    total_siswa: db.siswa.length,
    total_kelas: db.kelas.length,
    total_kandidat: db.kandidat.length
  });
});

// 2. Supabase & App Config
app.get('/api/config', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    url: db.supabase_url || '',
    key: db.supabase_key || '',
    settings: db.settings
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const db = getDatabase();
  const { url, key, settings } = req.body;
  if (url !== undefined) db.supabase_url = url;
  if (key !== undefined) db.supabase_key = key;
  if (settings) db.settings = { ...db.settings, ...settings };
  saveDatabase(db);
  res.json({ success: true, message: 'Konfigurasi tersimpan di server pusat.' });
});

// 3. VOTER AUTH (SERVER-AUTHORITATIVE)
// Dipanggil oleh HP pemilih di jaringan Wi-Fi untuk memverifikasi NISN/NIP & Tanggal Lahir
app.post('/api/auth/voter', (req: Request, res: Response) => {
  const { nisn, password } = req.body;
  const cleanNisn = String(nisn || '').trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanNisn || !cleanPass) {
    return res.status(400).json({
      success: false,
      message: 'NISN/NIP dan Password wajib diisi.'
    });
  }

  const db = getDatabase();
  const found = db.siswa.find(s => {
    const sNisn = String(s.nisn || '').trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (sNisn !== cleanNisn) return false;

    return matchDobOrPassword(s.tanggal_lahir, cleanPass);
  });

  if (!found) {
    return res.status(401).json({
      success: false,
      message: 'Kombinasi NISN/NIP dan Password tidak cocok dengan data Daftar Pemilih Tetap (DPT).'
    });
  }

  // Sertakan nama kelas
  const targetKelas = db.kelas.find(k => k.id === found.kelas_id);
  const siswaData = {
    ...found,
    kelas_nama: targetKelas?.nama_kelas || (found as any).kelas_nama || 'Umum'
  };

  res.json({
    success: true,
    message: 'Verifikasi pemilih berhasil.',
    siswa: siswaData
  });
});

// 4. ATOMIC VOTE PROCESSING
app.post('/api/vote', (req: Request, res: Response) => {
  const { nisn, password, kandidat_id } = req.body;
  const cleanNisn = String(nisn || '').trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  const cleanPass = String(password || '').trim();

  const db = getDatabase();

  // Cek apakah voting dibuka
  if (!db.settings.voting_dibuka) {
    return res.status(403).json({
      success: false,
      message: 'Pemungutan suara saat ini sedang ditutup oleh administrator.'
    });
  }

  const student = db.siswa.find(s => {
    const sNisn = String(s.nisn || '').trim().replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (sNisn !== cleanNisn) return false;

    return matchDobOrPassword(s.tanggal_lahir, cleanPass);
  });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Data pemilih tidak ditemukan pada DPT server.'
    });
  }

  if (student.sudah_memilih) {
    return res.status(400).json({
      success: false,
      message: 'Anda sudah menggunakan hak suara Anda sebelumnya. Setiap pemilih hanya dapat memilih 1 kali.'
    });
  }

  const candidate = db.kandidat.find(k => k.id === kandidat_id);
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Pasangan calon yang dipilih tidak ditemukan.'
    });
  }

  // Tandai siswa sudah memilih
  student.sudah_memilih = true;
  student.waktu_memilih = new Date().toISOString();

  // Tambahkan suara ke kandidat
  candidate.total_suara = (candidate.total_suara || 0) + 1;

  // Catat ke ledger suara anonim
  db.suara.push({
    id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    kandidat_id,
    waktu: student.waktu_memilih
  });

  saveDatabase(db);

  // Broadcast notifikasi real-time ke semua dashboard admin yang sedang terbuka
  broadcastVoteEvent({
    kategori: student.kategori || 'siswa',
    kelas_id: student.kelas_id
  });

  res.json({
    success: true,
    message: 'Suara Anda berhasil dicatat secara rahasia dan aman. Terima kasih telah berpartisipasi!',
    nama_siswa: student.nama
  });
});

// 5. SISWA MANAGEMENT ENDPOINTS
app.get('/api/siswa', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, data: db.siswa });
});

app.post('/api/siswa', (req: Request, res: Response) => {
  const db = getDatabase();
  const input = req.body;

  if (Array.isArray(input)) {
    // Bulk upsert
    input.forEach(item => {
      const idx = db.siswa.findIndex(s => s.id === item.id || s.nisn === item.nisn);
      if (idx >= 0) {
        db.siswa[idx] = { ...db.siswa[idx], ...item };
      } else {
        db.siswa.push(item);
      }
    });
  } else if (input && input.nisn) {
    const idx = db.siswa.findIndex(s => s.id === input.id || s.nisn === input.nisn);
    if (idx >= 0) {
      db.siswa[idx] = { ...db.siswa[idx], ...input };
    } else {
      db.siswa.push(input);
    }
  }

  saveDatabase(db);
  res.json({ success: true, count: db.siswa.length });
});

app.delete('/api/siswa/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const idOrNisn = req.params.id;
  db.siswa = db.siswa.filter(s => s.id !== idOrNisn && s.nisn !== idOrNisn);
  saveDatabase(db);
  res.json({ success: true, count: db.siswa.length });
});

app.post('/api/siswa/reset-status', (req: Request, res: Response) => {
  const db = getDatabase();
  const { kelas_id } = req.body || {};
  let resetCount = 0;

  db.siswa.forEach(s => {
    if (!kelas_id || s.kelas_id === kelas_id) {
      if (s.sudah_memilih) {
        s.sudah_memilih = false;
        s.waktu_memilih = null;
        resetCount++;
      }
    }
  });

  if (!kelas_id) {
    db.kandidat.forEach(k => { k.total_suara = 0; });
    db.suara = [];
  }

  saveDatabase(db);
  res.json({ success: true, count: resetCount });
});

app.post('/api/siswa/clear', (req: Request, res: Response) => {
  const db = getDatabase();
  const count = db.siswa.length;
  db.siswa = [];
  db.kandidat.forEach(k => { k.total_suara = 0; });
  db.suara = [];
  saveDatabase(db);
  res.json({ success: true, count });
});

// 6. KELAS & KANDIDAT & PENGATURAN
app.get('/api/kelas', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, data: db.kelas });
});

app.post('/api/kelas', (req: Request, res: Response) => {
  const db = getDatabase();
  const newClass = req.body;
  const idx = db.kelas.findIndex(k => k.id === newClass.id);
  if (idx >= 0) {
    db.kelas[idx] = { ...db.kelas[idx], ...newClass };
  } else {
    db.kelas.push(newClass);
  }
  saveDatabase(db);
  res.json({ success: true, data: db.kelas });
});

app.get('/api/kandidat', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, data: db.kandidat });
});

app.post('/api/kandidat', (req: Request, res: Response) => {
  const db = getDatabase();
  const cand = req.body;
  const idx = db.kandidat.findIndex(k => k.id === cand.id);
  if (idx >= 0) {
    db.kandidat[idx] = { ...db.kandidat[idx], ...cand };
  } else {
    db.kandidat.push(cand);
  }
  saveDatabase(db);
  res.json({ success: true, data: db.kandidat });
});

app.get('/api/pengaturan', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, data: db.settings });
});

app.post('/api/pengaturan', (req: Request, res: Response) => {
  const db = getDatabase();
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json({ success: true, data: db.settings });
});

// 7. REAL-TIME SERVER-SENT EVENTS (SSE)
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[eOSIS Full-Stack Server] Server aktif dan mendengarkan pada http://${HOST}:${PORT}`);
    console.log(`[eOSIS Full-Stack Server] Jaringan Wi-Fi multi-device siap melayani pemilih.`);
  });
}

startServer().catch(err => {
  console.error('[eOSIS Server Error]', err);
  process.exit(1);
});
