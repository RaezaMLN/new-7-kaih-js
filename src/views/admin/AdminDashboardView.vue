<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { 
  Users, 
  GraduationCap, 
  School, 
  FileText, 
  ShieldCheck, 
  Settings, 
  ArrowRight 
} from 'lucide-vue-next'

const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const totalStudents = computed(() => authStore.usersList.filter(u => u.role === 'siswa').length)
const totalTeachers = computed(() => authStore.usersList.filter(u => u.role === 'guru_wali').length)
const totalClasses = computed(() => schoolStore.classes.length)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Administrator Sekolah
          </span>
          <span class="text-xs text-slate-400 font-semibold">• Tapel 2025/2026 Ganjil</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
          Dashboard Manajemen 7 KAIH
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium">
          {{ schoolStore.profile.name }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          to="/admin/settings"
          class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <Settings class="w-4 h-4" />
          <span>Pengaturan KOP & Logo</span>
        </router-link>

        <router-link
          to="/admin/users"
          class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
        >
          <Users class="w-4 h-4" />
          <span>Kelola Pengguna</span>
        </router-link>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Peserta Didik</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-slate-900">{{ totalStudents }}</span>
          <span class="text-xs font-semibold text-slate-500">Siswa Aktif</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Terdaftar dalam rombel</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guru Wali</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-purple-700">{{ totalTeachers }}</span>
          <span class="text-xs font-semibold text-slate-500">Guru Pendamping</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Aktif membina karakter</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rombongan Belajar (Rombel)</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-700">{{ totalClasses }}</span>
          <span class="text-xs font-semibold text-slate-500">Kelas</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Tingkat X, XI, XII</span>
      </div>
    </div>

    <!-- Quick Classes Overview Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900">
            Daftar Kelas & Guru Wali Pendamping
          </h2>
          <p class="text-xs text-slate-500">
            Penugasan wali kelas pembina 7 Kebiasaan Anak Indonesia Hebat.
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Nama Kelas</th>
              <th class="py-3 px-4">Tingkat</th>
              <th class="py-3 px-4">Kompetensi Keahlian</th>
              <th class="py-3 px-4">Guru Wali Kelas</th>
              <th class="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="c in schoolStore.classes" :key="c.id" class="hover:bg-slate-50/50">
              <td class="py-3.5 px-4 font-bold text-slate-900">{{ c.name }}</td>
              <td class="py-3.5 px-4">Kelas {{ c.grade }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-600">{{ c.major }}</td>
              <td class="py-3.5 px-4 font-bold text-brand-700">
                {{ c.id === 'xii_rpl_2' ? 'RAEZA MAULANA' : 'Guru Pembina' }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif ✓
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
