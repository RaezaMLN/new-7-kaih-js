<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { 
  LogOut, 
  User, 
  Sparkles,
  Home, 
  BookOpenCheck, 
  History, 
  Users, 
  ClipboardCheck, 
  FileSpreadsheet, 
  Settings,
  LayoutDashboard
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const roleBadge = computed(() => {
  if (authStore.isAdmin) return { text: 'Administrator', class: 'bg-purple-100 text-purple-800 border-purple-200' }
  if (authStore.isTeacher) return { text: 'Guru Wali', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  return { text: 'Peserta Didik', class: 'bg-sky-100 text-sky-800 border-sky-200' }
})

const desktopNavItems = computed(() => {
  if (authStore.isStudent) {
    return [
      { name: 'Beranda', path: '/siswa/dashboard', icon: Home },
      { name: 'Isi Jurnal', path: '/siswa/jurnal', icon: BookOpenCheck },
      { name: 'Riwayat Karakter', path: '/siswa/riwayat', icon: History },
      { name: 'Profil Saya', path: '/siswa/profil', icon: User }
    ]
  }

  if (authStore.isTeacher) {
    return [
      { name: 'Dashboard Kelas', path: '/guru/dashboard', icon: LayoutDashboard },
      { name: 'Siswa Asuh', path: '/guru/list-murid', icon: Users },
      { name: 'Presensi Pertemuan', path: '/guru/absensi-murid', icon: ClipboardCheck },
      { name: 'Pelaporan Resmi', path: '/guru/pelaporan', icon: FileSpreadsheet }
    ]
  }

  if (authStore.isAdmin) {
    return [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Kelola Pengguna', path: '/admin/users', icon: Users },
      { name: 'KOP & Profil Sekolah', path: '/admin/settings', icon: Settings }
    ]
  }

  return []
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 no-print transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <!-- Brand / School Info -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-sm p-1">
          <img 
            v-if="schoolStore.profile.logoRightUrl" 
            :src="schoolStore.profile.logoRightUrl" 
            alt="Logo" 
            class="w-full h-full object-contain"
            @error="(e) => e.target.style.display = 'none'"
          />
          <Sparkles v-else class="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-base tracking-tight leading-tight">7 KAIH</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold border" :class="roleBadge.class">
              {{ roleBadge.text }}
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium truncate max-w-[140px] sm:max-w-xs">
            {{ schoolStore.profile.name }}
          </p>
        </div>
      </div>

      <!-- Center Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-1 lg:gap-2">
        <router-link
          v-for="item in desktopNavItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          :class="route.path === item.path 
            ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Right User Menu -->
      <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div class="hidden xl:flex flex-col text-right">
          <span class="text-sm font-semibold text-slate-800 leading-tight">
            {{ authStore.currentUser?.displayName }}
          </span>
          <span class="text-xs text-slate-500">
            {{ authStore.currentUser?.identifier || authStore.currentUser?.username }}
          </span>
        </div>

        <img 
          v-if="authStore.currentUser?.photoURL"
          :src="authStore.currentUser.photoURL" 
          alt="Avatar" 
          class="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/20"
        />
        <div v-else class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <User class="w-5 h-5" />
        </div>

        <button 
          @click="handleLogout"
          class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
          title="Keluar dari Akun"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>
