<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { 
  Home, 
  BookOpenCheck, 
  History, 
  User, 
  Users, 
  ClipboardCheck, 
  FileSpreadsheet, 
  Settings,
  LayoutDashboard
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = computed(() => {
  if (authStore.isStudent) {
    return [
      { name: 'Beranda', path: '/siswa/dashboard', icon: Home },
      { name: 'Isi Jurnal', path: '/siswa/jurnal', icon: BookOpenCheck },
      { name: 'Riwayat', path: '/siswa/riwayat', icon: History },
      { name: 'Profil', path: '/siswa/profil', icon: User }
    ]
  }

  if (authStore.isTeacher) {
    return [
      { name: 'Dashboard', path: '/guru/dashboard', icon: LayoutDashboard },
      { name: 'Siswa Asuh', path: '/guru/list-murid', icon: Users },
      { name: 'Presensi', path: '/guru/absensi-murid', icon: ClipboardCheck },
      { name: 'Pelaporan', path: '/guru/pelaporan', icon: FileSpreadsheet }
    ]
  }

  if (authStore.isAdmin) {
    return [
      { name: 'Sekolah', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Pengguna', path: '/admin/users', icon: Users },
      { name: 'KOP & Profil', path: '/admin/settings', icon: Settings }
    ]
  }

  return []
})
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1.5 shadow-lg bottom-nav no-print">
    <div class="flex items-center justify-around">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all"
        :class="route.path === item.path ? 'text-brand-600 font-semibold scale-105' : 'text-slate-500 hover:text-slate-800'"
      >
        <component :is="item.icon" class="w-5 h-5 mb-0.5" :stroke-width="route.path === item.path ? 2.4 : 1.8" />
        <span class="text-[11px] tracking-tight">{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>
