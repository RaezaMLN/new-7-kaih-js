<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { useHabitStore } from '../../stores/habitStore'
import { useAttendanceStore } from '../../stores/attendanceStore'
import OfficialLetterhead from '../../components/report/OfficialLetterhead.vue'
import * as XLSX from 'xlsx'
import { Printer, Download, ArrowLeft, Filter, FileText, CheckCircle2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const schoolStore = useSchoolStore()
const habitStore = useHabitStore()
const attendanceStore = useAttendanceStore()

const teacher = computed(() => authStore.currentUser)
const students = computed(() => {
  return authStore.usersList.filter(u => u.role === 'siswa' && u.classId === 'xii_rpl_2')
})

const selectedLampiran = ref('lampiran_b')
const selectedMonth = ref('September')
const selectedYear = ref('2026')
const selectedSemester = ref('Semester Ganjil')
const selectedStudentUid = ref(students.value[0]?.uid || '')

const activeStudent = computed(() => {
  return students.value.find(s => s.uid === selectedStudentUid.value) || students.value[0]
})

// Monthly habit statistics for active student
const monthlyHabits = computed(() => {
  if (!activeStudent.value) return {}
  return habitStore.getStudentMonthlyStats(activeStudent.value.uid, '2026-09')
})

// Attendance summary
const attendanceSummary = computed(() => {
  if (!activeStudent.value) return { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0, percentage: 100 }
  return attendanceStore.getStudentAttendanceSummary(activeStudent.value.uid)
})

function triggerPrint() {
  window.print()
}

function exportReportExcel() {
  let exportData = []
  let sheetName = 'Laporan'

  if (selectedLampiran.value === 'lampiran_b') {
    sheetName = 'Lampiran_B_Perkembangan'
    exportData = Object.keys(monthlyHabits.value).map((k, idx) => ({
      'No': idx + 1,
      'Indikator Pembiasaan 7 KAIH': monthlyHabits.value[k].title,
      'Hari Terlaksana': monthlyHabits.value[k].completedDays,
      'Total Hari': monthlyHabits.value[k].totalDays,
      'Persentase (%)': `${monthlyHabits.value[k].percentage}%`,
      'Predikat': monthlyHabits.value[k].predicate
    }))
  } else if (selectedLampiran.value === 'lampiran_a') {
    sheetName = 'Lampiran_A_Identitas'
    exportData = [{
      'Nama Lengkap': activeStudent.value?.displayName,
      'NISN': activeStudent.value?.nisn,
      'Kelas': 'XII RPL 2',
      'Jenis Kelamin': activeStudent.value?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Cita-Cita': activeStudent.value?.dreams || '-',
      'Hobi': activeStudent.value?.hobbies || '-',
      'No HP Siswa': activeStudent.value?.phone || '-',
      'No HP Ortu': activeStudent.value?.parentPhone || '-',
      'Alamat': activeStudent.value?.address || '-'
    }]
  } else {
    sheetName = 'Rekap_Laporan'
    exportData = students.value.map((s, idx) => ({
      'No': idx + 1,
      'Nama Siswa': s.displayName,
      'NISN': s.nisn,
      'Kelas': 'XII RPL 2',
      'Streak': s.streak || 1
    }))
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${sheetName}_${activeStudent.value?.displayName?.replace(/\s+/g, '_') || 'Siswa'}.xlsx`)
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Action Top Bar (Hidden in Print) -->
    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm no-print space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Modul Pelaporan Resmi Sekolah 📄
          </h1>
          <p class="text-xs sm:text-sm text-slate-500">
            Cetak dokumen lampiran dinas resmi ber-KOP SMK Negeri 5 Telkom Banda Aceh.
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <button 
            type="button" 
            @click="exportReportExcel"
            class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-sm flex items-center gap-1.5 transition"
            title="Download data laporan dalam format Excel"
          >
            <Download class="w-4 h-4 text-emerald-700" />
            <span>Download Excel</span>
          </button>

          <button 
            type="button" 
            @click="triggerPrint"
            class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-2 transition"
          >
            <Printer class="w-4 h-4" />
            <span>Cetak A4 / Simpan PDF</span>
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        <!-- 1. Lampiran Selector -->
        <div>
          <label class="text-xs font-bold text-slate-600 block mb-1">Pilih Jenis Lampiran:</label>
          <select 
            v-model="selectedLampiran"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="lampiran_a">Lampiran A - Identitas Murid</option>
            <option value="lampiran_b">Lampiran B - Catatan Perkembangan</option>
            <option value="lampiran_c">Lampiran C - Rekap Pertemuan</option>
            <option value="lampiran_e">Lampiran E - Dokumentasi Foto</option>
          </select>
        </div>

        <!-- 2. Student Selector -->
        <div>
          <label class="text-xs font-bold text-slate-600 block mb-1">Pilih Peserta Didik:</label>
          <select 
            v-model="selectedStudentUid"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option v-for="s in students" :key="s.uid" :value="s.uid">
              {{ s.displayName }} ({{ s.nisn }})
            </option>
          </select>
        </div>

        <!-- 3. Month & Semester -->
        <div>
          <label class="text-xs font-bold text-slate-600 block mb-1">Bulan & Semester:</label>
          <select 
            v-model="selectedMonth"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option v-for="m in ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']" :key="m" :value="m">
              {{ m }} {{ selectedYear }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-600 block mb-1">Tahun Pelajaran:</label>
          <select 
            v-model="selectedSemester"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="Semester Ganjil">2025/2026 - Ganjil</option>
            <option value="Semester Genap">2025/2026 - Genap</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Printable Official Sheet Container (A4 White Paper Look) -->
    <div class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-300 shadow-xl print-page mx-auto max-w-[820px] text-slate-900">
      <!-- 1. KOP SURAT RESMI -->
      <OfficialLetterhead />

      <!-- ============================================== -->
      <!-- LAMPIRAN B: CATATAN PERKEMBANGAN SISWA BINAAN -->
      <!-- ============================================== -->
      <div v-if="selectedLampiran === 'lampiran_b'" class="space-y-4">
        <div class="text-center my-3">
          <h2 class="text-sm font-black uppercase tracking-wider">
            LAMPIRAN B
          </h2>
          <h3 class="text-base font-extrabold uppercase tracking-wide mt-0.5">
            LEMBAR CATATAN PERKEMBANGAN SISWA BINAAN 7 KAIH
          </h3>
          <p class="text-xs text-slate-600">
            Periode: {{ selectedMonth }} {{ selectedYear }} • {{ selectedSemester }} T.P. 2025/2026
          </p>
        </div>

        <!-- Student Meta Data -->
        <table class="w-full text-xs font-medium my-2">
          <tbody>
            <tr>
              <td class="w-32 py-1 font-semibold text-slate-600">Nama Murid</td>
              <td class="w-4">:</td>
              <td class="font-bold text-slate-900">{{ activeStudent?.displayName }}</td>
              <td class="w-28 py-1 font-semibold text-slate-600">Kelas / Rombel</td>
              <td class="w-4">:</td>
              <td class="font-bold text-slate-900">XII RPL 2</td>
            </tr>
            <tr>
              <td class="py-1 font-semibold text-slate-600">NISN / NIS</td>
              <td>:</td>
              <td class="font-mono text-slate-800">{{ activeStudent?.nisn }} / {{ activeStudent?.nis || '22231001' }}</td>
              <td class="py-1 font-semibold text-slate-600">Guru Wali</td>
              <td>:</td>
              <td class="font-bold text-slate-900">{{ teacher?.displayName }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 5 Aspek Pemantauan Table -->
        <table class="print-table w-full border border-slate-900 text-xs text-left mt-3">
          <thead>
            <tr class="bg-slate-100 font-bold text-slate-900 text-center border-b border-slate-900">
              <th class="p-2 border border-slate-900 w-10">No</th>
              <th class="p-2 border border-slate-900 w-40">Aspek Pemantauan</th>
              <th class="p-2 border border-slate-900">Deskripsi Perkembangan</th>
              <th class="p-2 border border-slate-900">Tindak Lanjut yang Dilakukan</th>
              <th class="p-2 border border-slate-900 w-32">Keterangan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-900">
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">1</td>
              <td class="p-2 border border-slate-900 font-bold">Akademik & Literasi</td>
              <td class="p-2 border border-slate-900">
                Siswa sangat tekun membaca materi pelajaran dan mengulang materi produktif RPL di rumah.
              </td>
              <td class="p-2 border border-slate-900">
                Diberikan bimbingan pengayaan portofolio proyek perangkat lunak.
              </td>
              <td class="p-2 border border-slate-900 text-center font-bold text-emerald-800">
                Berkembang Sangat Baik
              </td>
            </tr>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">2</td>
              <td class="p-2 border border-slate-900 font-bold">Karakter & Ibadah</td>
              <td class="p-2 border border-slate-900">
                Konsisten bangun pagi dan menjalankan ibadah shalat wajib serta tadarus harian.
              </td>
              <td class="p-2 border border-slate-900">
                Apresiasi dan motivasi untuk menjadi teladan bagi rekan sebaya di kelas.
              </td>
              <td class="p-2 border border-slate-900 text-center font-bold text-emerald-800">
                Berkembang Sangat Baik
              </td>
            </tr>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">3</td>
              <td class="p-2 border border-slate-900 font-bold">Sosial Emosional</td>
              <td class="p-2 border border-slate-900">
                Mampu bekerja sama dengan baik dalam tim praktikum serta peduli pada teman.
              </td>
              <td class="p-2 border border-slate-900">
                Dilibatkan dalam proyek kolaboratif dan kegiatan tolong-menolong.
              </td>
              <td class="p-2 border border-slate-900 text-center font-bold text-emerald-800">
                Berkembang Baik
              </td>
            </tr>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">4</td>
              <td class="p-2 border border-slate-900 font-bold">Kedisiplinan & Istirahat</td>
              <td class="p-2 border border-slate-900">
                Tidur malam teratur pukul 21.30 dan selalu hadir tepat waktu dalam pertemuan.
              </td>
              <td class="p-2 border border-slate-900">
                Pendampingan pemeliharaan rutinitas istirahat dan hidrasi air putih.
              </td>
              <td class="p-2 border border-slate-900 text-center font-bold text-emerald-800">
                Berkembang Baik
              </td>
            </tr>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">5</td>
              <td class="p-2 border border-slate-900 font-bold">Potensi & Minat Bakat</td>
              <td class="p-2 border border-slate-900">
                Memiliki ketertarikan tinggi pada pengembangan teknologi informasi dan olahraga.
              </td>
              <td class="p-2 border border-slate-900">
                Diarahkan mengikuti kompetisi kompetensi keahlian dan ekstrakurikuler.
              </td>
              <td class="p-2 border border-slate-900 text-center font-bold text-emerald-800">
                Berkembang Sangat Baik
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Rekapitulasi Presensi Pertemuan -->
        <div class="mt-4 p-3 bg-slate-50 border border-slate-900 rounded text-xs space-y-1">
          <span class="font-bold text-slate-900 block">REKAPITULASI PRESENSI PERTEMUAN KELAS:</span>
          <div class="grid grid-cols-4 gap-2 pt-1 font-semibold text-center">
            <span class="p-1 bg-white border border-slate-300 rounded">Hadir: {{ attendanceSummary.hadir }} Kali</span>
            <span class="p-1 bg-white border border-slate-300 rounded">Sakit: {{ attendanceSummary.sakit }} Kali</span>
            <span class="p-1 bg-white border border-slate-300 rounded">Izin: {{ attendanceSummary.izin }} Kali</span>
            <span class="p-1 bg-white border border-slate-300 rounded">Alpa: {{ attendanceSummary.alpa }} Kali</span>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- LAMPIRAN A: IDENTITAS MURID DAMPINGAN -->
      <!-- ============================================== -->
      <div v-else-if="selectedLampiran === 'lampiran_a'" class="space-y-4">
        <div class="text-center my-3">
          <h2 class="text-sm font-black uppercase tracking-wider">
            LAMPIRAN A
          </h2>
          <h3 class="text-base font-extrabold uppercase tracking-wide mt-0.5">
            LEMBAR IDENTITAS PESERTA DIDIK DAMPINGAN
          </h3>
          <p class="text-xs text-slate-600">Tahun Pelajaran 2025/2026</p>
        </div>

        <table class="print-table w-full border border-slate-900 text-xs mt-3">
          <tbody>
            <tr>
              <td class="p-2 w-48 font-bold border border-slate-900 bg-slate-50">Nama Lengkap</td>
              <td class="p-2 border border-slate-900 font-bold">{{ activeStudent?.displayName }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">NISN / NIS</td>
              <td class="p-2 border border-slate-900 font-mono">{{ activeStudent?.nisn }} / {{ activeStudent?.nis || '-' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">Kelas / Kompetensi Keahlian</td>
              <td class="p-2 border border-slate-900">XII RPL 2 / Rekayasa Perangkat Lunak</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">Jenis Kelamin</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">Cita-Cita</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.dreams || '-' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">Hobi / Kegemaran</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.hobbies || '-' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">No. WhatsApp Siswa</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.phone || '-' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">No. WhatsApp Orang Tua / Wali</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.parentPhone || '-' }}</td>
            </tr>
            <tr>
              <td class="p-2 font-bold border border-slate-900 bg-slate-50">Alamat Tempat Tinggal</td>
              <td class="p-2 border border-slate-900">{{ activeStudent?.address || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ============================================== -->
      <!-- LAMPIRAN C: REKAP PERTEMUAN DENGAN MURID -->
      <!-- ============================================== -->
      <div v-else-if="selectedLampiran === 'lampiran_c'" class="space-y-4">
        <div class="text-center my-3">
          <h2 class="text-sm font-black uppercase tracking-wider">
            LAMPIRAN C
          </h2>
          <h3 class="text-base font-extrabold uppercase tracking-wide mt-0.5">
            REKAPITULASI PERTEMUAN & BIMBINGAN DENGAN MURID
          </h3>
          <p class="text-xs text-slate-600">Kelas: XII RPL 2 • Semester Ganjil 2025/2026</p>
        </div>

        <table class="print-table w-full border border-slate-900 text-xs mt-3">
          <thead>
            <tr class="bg-slate-100 font-bold border-b border-slate-900 text-center">
              <th class="p-2 border border-slate-900 w-10">No</th>
              <th class="p-2 border border-slate-900 w-28">Tanggal</th>
              <th class="p-2 border border-slate-900 w-44">Nama Murid</th>
              <th class="p-2 border border-slate-900">Topik / Masalah</th>
              <th class="p-2 border border-slate-900">Tindak Lanjut</th>
              <th class="p-2 border border-slate-900 w-28">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">1</td>
              <td class="p-2 border border-slate-900 font-mono text-center">01-08-2026</td>
              <td class="p-2 border border-slate-900 font-bold">{{ activeStudent?.displayName }}</td>
              <td class="p-2 border border-slate-900">Konsistensi pembiasaan bangun pagi & literasi</td>
              <td class="p-2 border border-slate-900">Motivasi target membaca 20 menit/hari</td>
              <td class="p-2 border border-slate-900 text-center text-emerald-800 font-semibold">Terlaksana Baik</td>
            </tr>
            <tr>
              <td class="p-2 text-center border border-slate-900 font-bold">2</td>
              <td class="p-2 border border-slate-900 font-mono text-center">15-08-2026</td>
              <td class="p-2 border border-slate-900 font-bold">{{ activeStudent?.displayName }}</td>
              <td class="p-2 border border-slate-900">Kebugaran fisik dan olahraga berkala</td>
              <td class="p-2 border border-slate-900">Jadwal jalan santai & senam pagi mingguan</td>
              <td class="p-2 border border-slate-900 text-center text-emerald-800 font-semibold">Terlaksana Baik</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ============================================== -->
      <!-- LAMPIRAN E: DOKUMENTASI PERTEMUAN (FOTO) -->
      <!-- ============================================== -->
      <div v-else-if="selectedLampiran === 'lampiran_e'" class="space-y-4">
        <div class="text-center my-3">
          <h2 class="text-sm font-black uppercase tracking-wider">
            LAMPIRAN E
          </h2>
          <h3 class="text-base font-extrabold uppercase tracking-wide mt-0.5">
            DOKUMENTASI FOTO PERTEMUAN KELAS / PEMBINAAN
          </h3>
          <p class="text-xs text-slate-600">Arsip Dokumentasi Kelas XII RPL 2</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4">
          <div 
            v-for="m in attendanceStore.meetings" 
            :key="m.id"
            class="border border-slate-300 p-2 rounded-xl text-center space-y-2"
          >
            <img 
              :src="m.photoUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&auto=format&fit=crop&q=80'" 
              class="w-full h-44 object-cover rounded-lg border border-slate-200"
            />
            <div>
              <span class="font-bold text-xs block text-slate-900">{{ m.title }}</span>
              <span class="text-[10px] text-slate-500 font-mono">{{ m.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- OFFICIAL SIGNATURE BLOCKS (TANDA TANGAN RESMI) -->
      <!-- ============================================== -->
      <div class="mt-8 pt-4 border-t border-slate-200 text-xs">
        <div class="flex justify-between items-start text-center">
          <!-- Orang Tua / Wali -->
          <div class="w-56">
            <p>Mengetahui,</p>
            <p class="font-semibold text-slate-700">Orang Tua / Wali Murid,</p>
            <div class="h-20"></div>
            <p class="font-bold border-b border-slate-900 inline-block px-4">( ............................................ )</p>
          </div>

          <!-- Guru Wali Kelas -->
          <div class="w-56">
            <p>Banda Aceh, 13 September 2026</p>
            <p class="font-semibold text-slate-700">Guru Wali / Pendamping,</p>
            <div class="h-20 flex items-center justify-center">
              <span class="text-[10px] text-slate-300 font-mono italic">[Tanda Tangan Digital]</span>
            </div>
            <p class="font-bold border-b border-slate-900 inline-block text-slate-900">
              {{ teacher?.displayName || 'RAEZA MAULANA' }}
            </p>
            <p class="text-[10px] text-slate-500 font-mono">NIK. 1106232307990001</p>
          </div>
        </div>

        <!-- Kepala Sekolah (Tengah Bawah) -->
        <div class="text-center mt-6">
          <p>Mengesahkan,</p>
          <p class="font-semibold text-slate-700">Kepala Sekolah {{ schoolStore.profile.name }},</p>
          <div class="h-20 flex items-center justify-center">
            <span class="text-[10px] text-slate-300 font-mono italic">[Cap & Pengesahan Sekolah]</span>
          </div>
          <p class="font-bold border-b border-slate-900 inline-block text-slate-900">
            {{ schoolStore.profile.headmasterName }}
          </p>
          <p class="text-[10px] text-slate-500 font-mono">NIP. {{ schoolStore.profile.headmasterNip }}</p>
        </div>

        <!-- Official Validation Footer -->
        <div class="mt-6 text-center text-[10px] text-slate-400 font-mono border-t border-dashed border-slate-300 pt-2 flex items-center justify-between">
          <span>Divalidasi secara elektronik melalui Sistem 7 KAIH SMK Negeri 5 Telkom Banda Aceh</span>
          <span>Dokumen Resmi Halaman 1/1</span>
        </div>
      </div>
    </div>
  </div>
</template>
