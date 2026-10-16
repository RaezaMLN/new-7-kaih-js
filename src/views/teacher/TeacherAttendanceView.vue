<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useAttendanceStore } from '../../stores/attendanceStore'
import ImageUpload from '../../components/common/ImageUpload.vue'
import * as XLSX from 'xlsx'
import { 
  ClipboardCheck, 
  Calendar, 
  Check, 
  Save, 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  Ban,
  Download
} from 'lucide-vue-next'

const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()

// Filter students for Pak Raeza's class (XII RPL 2)
const students = computed(() => {
  return authStore.usersList.filter(u => u.role === 'siswa' && u.classId === 'xii_rpl_2')
})

const selectedMeetingId = ref(attendanceStore.meetings[0]?.id || '')
const selectedMeeting = computed(() => attendanceStore.getMeeting(selectedMeetingId.value))

// Attendance form records: { studentUid: 'H' | 'S' | 'I' | 'A' }
const records = ref({})
const photoUrl = ref('')
const isHoliday = ref(false)
const isSaved = ref(false)

onMounted(() => {
  loadMeetingData()
})

function loadMeetingData() {
  const m = selectedMeeting.value
  if (!m) return
  isHoliday.value = Boolean(m.isHoliday)
  photoUrl.value = m.photoUrl || ''
  
  // Set existing or default all to 'H'
  const map = {}
  students.value.forEach(s => {
    map[s.uid] = m.records?.[s.uid] || 'H'
  })
  records.value = map
}

function handleMeetingChange() {
  loadMeetingData()
}

// 1-Click Fast Attendance: Set all to Hadir
function markAllPresent() {
  students.value.forEach(s => {
    records.value[s.uid] = 'H'
  })
}

// Toggle holiday / no meeting
function toggleHoliday() {
  isHoliday.value = !isHoliday.value
}

function handleSave() {
  attendanceStore.saveMeetingAttendance(selectedMeetingId.value, {
    records: records.value,
    photoUrl: photoUrl.value,
    isHoliday: isHoliday.value
  })

  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}

function exportAttendanceExcel() {
  const exportData = students.value.map((s, idx) => {
    const summary = attendanceStore.getStudentAttendanceSummary(s.uid)
    const row = {
      'No': idx + 1,
      'Nama Peserta Didik': s.displayName,
      'NISN': s.nisn,
      'Kelas': 'XII RPL 2'
    }

    // Add each meeting status
    attendanceStore.meetings.forEach(m => {
      const status = m.isHoliday ? 'Libur' : (m.records?.[s.uid] || 'H')
      row[`Pertemuan ${m.number} (${m.date})`] = status
    })

    row['Hadir (H)'] = summary.hadir
    row['Sakit (S)'] = summary.sakit
    row['Izin (I)'] = summary.izin
    row['Alpa (A)'] = summary.alpa
    row['Persentase Kehadiran (%)'] = `${summary.percentage}%`

    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Presensi_XII_RPL_2')
  XLSX.writeFile(workbook, `Rekap_Presensi_XII_RPL_2_2025_2026.xlsx`)
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Presensi Murid (Pertemuan Kelas)
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Pilih status kehadiran siswa pada pertemuan bimbingan karakter.
        </p>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="exportAttendanceExcel"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-sm transition flex items-center gap-1.5"
        >
          <Download class="w-4 h-4 text-emerald-700" />
          <span>Export Excel</span>
        </button>

        <!-- Meeting Selector -->
        <div class="flex items-center gap-2">
          <select 
            v-model="selectedMeetingId" 
            @change="handleMeetingChange"
            class="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-brand-500"
          >
            <option v-for="m in attendanceStore.meetings" :key="m.id" :value="m.id">
              Pertemuan {{ m.number }} ({{ m.date }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Alert / Meeting Status Banner -->
    <div 
      v-if="isHoliday"
      class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between"
    >
      <div class="flex items-center gap-2.5">
        <Ban class="w-5 h-5 text-amber-600" />
        <span class="text-xs sm:text-sm font-bold">
          Pertemuan ini ditandai sebagai: Libur / Tidak Ada Pertemuan
        </span>
      </div>
      <button 
        type="button" 
        @click="toggleHoliday" 
        class="text-xs font-bold px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition"
      >
        Aktifkan Pertemuan
      </button>
    </div>

    <!-- Quick Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-2">
        <button 
          type="button"
          @click="markAllPresent"
          class="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Check class="w-4 h-4 stroke-[3]" />
          <span>Tandai Semua Hadir (H)</span>
        </button>

        <button 
          type="button"
          @click="toggleHoliday"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          {{ isHoliday ? 'Batal Libur' : 'Tidak Ada Pertemuan' }}
        </button>
      </div>

      <button 
        type="button"
        @click="handleSave"
        class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
      >
        <CheckCircle2 v-if="isSaved" class="w-4 h-4 text-emerald-300 animate-bounce" />
        <Save v-else class="w-4 h-4" />
        <span>{{ isSaved ? 'Tersimpan ✓' : 'Simpan Absensi' }}</span>
      </button>
    </div>

    <!-- Student Attendance Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3.5 px-4 w-12">#</th>
              <th class="py-3.5 px-4">Nama Peserta Didik</th>
              <th class="py-3.5 px-4">NISN</th>
              <th class="py-3.5 px-4">Kelas</th>
              <th class="py-3.5 px-4 text-center">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            <tr 
              v-for="(s, idx) in students" 
              :key="s.uid"
              class="hover:bg-slate-50/50 transition"
              :class="records[s.uid] === 'A' ? 'bg-rose-50/40' : ''"
            >
              <td class="py-3.5 px-4 font-bold text-slate-400">{{ idx + 1 }}</td>
              <td class="py-3.5 px-4">
                <span class="font-bold text-slate-900 block">{{ s.displayName }}</span>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-500">{{ s.nisn }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-600">XII RPL 2</td>
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-center gap-1.5 select-none">
                  <!-- H = Hadir -->
                  <button 
                    type="button"
                    @click="records[s.uid] = 'H'"
                    class="w-8 h-8 rounded-lg font-bold text-xs transition flex items-center justify-center border"
                    :class="records[s.uid] === 'H' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                    title="Hadir"
                  >
                    H
                  </button>

                  <!-- S = Sakit -->
                  <button 
                    type="button"
                    @click="records[s.uid] = 'S'"
                    class="w-8 h-8 rounded-lg font-bold text-xs transition flex items-center justify-center border"
                    :class="records[s.uid] === 'S' 
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                    title="Sakit"
                  >
                    S
                  </button>

                  <!-- I = Izin -->
                  <button 
                    type="button"
                    @click="records[s.uid] = 'I'"
                    class="w-8 h-8 rounded-lg font-bold text-xs transition flex items-center justify-center border"
                    :class="records[s.uid] === 'I' 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                    title="Izin"
                  >
                    I
                  </button>

                  <!-- A = Alpa / Tidak Hadir -->
                  <button 
                    type="button"
                    @click="records[s.uid] = 'A'"
                    class="w-8 h-8 rounded-lg font-bold text-xs transition flex items-center justify-center border"
                    :class="records[s.uid] === 'A' 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                    title="Tidak Hadir / Alpa"
                  >
                    A
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Documentation Upload (Lampiran E) -->
    <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
      <ImageUpload 
        v-model="photoUrl"
        folder="7kaih/attendance"
        label="Dokumentasi Foto Pertemuan (Lampiran E)"
        hint="Unggah foto kegiatan pembinaan karakter untuk arsip laporan dinas"
      />
    </div>
  </div>
</template>
