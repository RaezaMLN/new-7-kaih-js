<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useHabitStore } from '../../stores/habitStore'
import * as XLSX from 'xlsx'
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  FileText, 
  Eye, 
  ExternalLink, 
  MessageCircle, 
  X, 
  Sparkles,
  Flame,
  Download
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()

const searchQuery = ref('')
const selectedFilter = ref('semua')
const activeStudent = ref(null)

const todayStr = habitStore.getTodayString()

// Filter students for XII RPL 2
const classStudents = computed(() => {
  return authStore.usersList.filter(u => u.role === 'siswa' && u.classId === 'xii_rpl_2')
})

const filteredStudents = computed(() => {
  return classStudents.value.filter(s => {
    const matchesSearch = s.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          s.nisn?.includes(searchQuery.value)
    
    if (!matchesSearch) return false

    const completionRate = habitStore.getCompletionRate(s.uid, todayStr)
    if (selectedFilter.value === 'selesai') return completionRate >= 100
    if (selectedFilter.value === 'pending') return completionRate < 100
    return true
  })
})

function viewStudentDetail(student) {
  activeStudent.value = student
}

function openWhatsApp(phone, studentName) {
  if (!phone) {
    alert('Nomor telepon belum diinputkan oleh siswa.')
    return
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
  const message = `Halo ananda ${studentName}, ini Pak Raeza Maulana wali kelas XII RPL 2.`
  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank')
}

function openMaps(address) {
  const query = encodeURIComponent(address + ', Banda Aceh')
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
}

function exportStudentsExcel() {
  const exportData = classStudents.value.map((s, idx) => ({
    'No': idx + 1,
    'Nama Lengkap': s.displayName,
    'NISN': s.nisn,
    'Kelas': 'XII RPL 2',
    'Streak (Hari)': s.streak || 1,
    'Capaian Hari Ini (%)': habitStore.getCompletionRate(s.uid, todayStr),
    'No HP Siswa': s.phone || '-',
    'No HP Ortu': s.parentPhone || '-',
    'Alamat': s.address || '-',
    'Cita-Cita': s.dreams || '-',
    'Hobi': s.hobbies || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa_Asuh_XII_RPL_2')
  XLSX.writeFile(workbook, `Rekap_Siswa_Asuh_XII_RPL_2_${todayStr}.xlsx`)
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          List Murid Dampingan 👥
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Pantau perkembangan, biodata Lampiran A, dan kebiasaan siswa asuh kelas XII RPL 2.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          @click="exportStudentsExcel"
          class="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-sm transition"
        >
          <Download class="w-4 h-4 text-emerald-700" />
          <span>Download Rekap Excel</span>
        </button>

        <router-link
          to="/guru/pelaporan"
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition"
        >
          <FileText class="w-4 h-4" />
          <span>Buka Pelaporan Resmi</span>
        </router-link>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Search -->
      <div class="relative flex-1 max-w-sm">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama atau NISN siswa..."
          class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <!-- Filter Buttons -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto">
        <button 
          v-for="flt in [{ id: 'semua', label: 'Semua Siswa' }, { id: 'selesai', label: 'Sudah Selesai' }, { id: 'pending', label: 'Belum Selesai' }]"
          :key="flt.id"
          type="button"
          @click="selectedFilter = flt.id"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="selectedFilter === flt.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          {{ flt.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3.5 px-4 w-12">No</th>
              <th class="py-3.5 px-4">Nama Murid</th>
              <th class="py-3.5 px-4">NISN</th>
              <th class="py-3.5 px-4">Streak</th>
              <th class="py-3.5 px-4">Penyelesaian Hari Ini</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            <tr 
              v-for="(s, idx) in filteredStudents" 
              :key="s.uid"
              class="hover:bg-slate-50/60 transition"
            >
              <td class="py-3 px-4 font-bold text-slate-400">{{ idx + 1 }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img :src="s.photoURL" class="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200" />
                  <div>
                    <span class="font-bold text-slate-900 block">{{ s.displayName }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ s.hobbies || 'Peserta Didik' }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ s.nisn }}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1 font-bold text-amber-600">
                  <Flame class="w-3.5 h-3.5 fill-amber-500" /> {{ s.streak || 1 }} hari
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      class="h-full rounded-full"
                      :class="habitStore.getCompletionRate(s.uid, todayStr) >= 100 ? 'bg-emerald-500' : 'bg-amber-500'"
                      :style="{ width: `${habitStore.getCompletionRate(s.uid, todayStr)}%` }"
                    ></div>
                  </div>
                  <span class="text-[11px] font-bold">
                    {{ habitStore.getCompletionRate(s.uid, todayStr) }}%
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    type="button"
                    @click="viewStudentDetail(s)"
                    class="p-2 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-lg transition"
                    title="Lihat Detail Profil (Lampiran A)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    @click="openWhatsApp(s.phone, s.displayName)"
                    class="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg transition"
                    title="Kirim Pesan WhatsApp"
                  >
                    <MessageCircle class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student Detail Modal (Lampiran A & Karakter) -->
    <div 
      v-if="activeStudent"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="activeStudent = null"
    >
      <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900">
              Profil Siswa Asuh (Lampiran A)
            </h3>
            <span class="text-xs text-slate-500">SMK Negeri 5 Telkom Banda Aceh</span>
          </div>
          <button @click="activeStudent = null" class="p-1 text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Student Card -->
        <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <img :src="activeStudent.photoURL" class="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500 shadow" />
          <div>
            <h4 class="font-extrabold text-slate-900 text-base">{{ activeStudent.displayName }}</h4>
            <p class="text-xs text-slate-500">NISN: <span class="font-mono font-bold">{{ activeStudent.nisn }}</span></p>
            <p class="text-xs text-slate-500">Kelas: <span class="font-bold text-slate-700">XII RPL 2</span></p>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl">
            <div>
              <span class="text-slate-400 block font-semibold">Cita-Cita:</span>
              <span class="font-bold text-slate-800">{{ activeStudent.dreams || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Hobi:</span>
              <span class="font-bold text-slate-800">{{ activeStudent.hobbies || '-' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl">
            <div>
              <span class="text-slate-400 block font-semibold">No. HP Siswa:</span>
              <span class="font-bold text-slate-800">{{ activeStudent.phone || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">No. HP Orang Tua:</span>
              <span class="font-bold text-slate-800">{{ activeStudent.parentPhone || '-' }}</span>
            </div>
          </div>

          <div class="bg-slate-50/50 p-3 rounded-xl">
            <span class="text-slate-400 block font-semibold mb-0.5">Alamat Tempat Tinggal:</span>
            <span class="font-medium text-slate-800">{{ activeStudent.address || '-' }}</span>
            <button 
              v-if="activeStudent.address"
              type="button"
              @click="openMaps(activeStudent.address)"
              class="mt-2 text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
            >
              <MapPin class="w-3.5 h-3.5" />
              <span>Buka Titik Rumah di Google Maps →</span>
            </button>
          </div>
        </div>

        <button 
          type="button" 
          @click="activeStudent = null"
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
        >
          Tutup Rincian
        </button>
      </div>
    </div>
  </div>
</template>
