<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Silakan masukkan identitas dan kata sandi Anda.'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    const user = await authStore.login(identifier.value, password.value)

    if (user.role === 'siswa') {
      router.push('/siswa/dashboard')
    } else if (user.role === 'guru_wali') {
      router.push('/guru/dashboard')
    } else if (user.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
  } catch (err) {
    errorMessage.value = err.message || 'Gagal masuk. Silakan periksa kembali akun Anda.'
  } finally {
    isLoading.value = false
  }
}

// Quick demo login helpers
function setCredentials(id, pass) {
  identifier.value = id
  password.value = pass
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 flex items-center justify-center p-4 sm:p-6 select-none">
    <div class="w-full max-w-md">
      <!-- App Card -->
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 p-7 sm:p-9 transition-all">
        <!-- Logo Header -->
        <div class="flex justify-center mb-5">
          <div class="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-brand-100 p-2">
            <img 
              v-if="schoolStore.profile.logoRightUrl"
              :src="schoolStore.profile.logoRightUrl" 
              alt="Logo Sekolah" 
              class="max-w-full max-h-full object-contain"
              @error="(e) => e.target.style.display = 'none'"
            />
            <Sparkles v-else class="w-10 h-10 text-amber-300" />
          </div>
        </div>

        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center tracking-tight">
          Selamat Datang
        </h1>
        <p class="text-xs sm:text-sm text-slate-600 text-center mt-1 leading-relaxed">
          Sistem Pelaporan 7 Kebiasaan Anak Indonesia Hebat<br>
          <span class="font-semibold text-brand-700">{{ schoolStore.profile.name }}</span>
        </p>

        <!-- Error Message Alert -->
        <div 
          v-if="errorMessage" 
          class="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2"
        >
          <span class="text-base leading-none">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="mt-6 space-y-4" autocomplete="off">
          <!-- Identifier Input -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-brand-600" />
              NISN / NIP / NIK / Username
            </label>
            <input 
              v-model="identifier"
              type="text" 
              placeholder="Masukkan nomor identitas Anda"
              autocomplete="username"
              required
              class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
            />
          </div>

          <!-- Password Input -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock class="w-3.5 h-3.5 text-brand-600" />
                Kata Sandi
              </label>
            </div>
            <div class="relative">
              <input 
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Masukkan kata sandi Anda"
                autocomplete="current-password"
                required
                class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium pr-11"
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full mt-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <span v-if="isLoading">Memeriksa Akun...</span>
            <template v-else>
              <span>Masuk ke Sistem</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </template>
          </button>
        </form>

        <!-- Quick Demo Accounts (For testing convenience) -->
        <div class="mt-7 pt-5 border-t border-slate-200">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Pintasan Masuk Demo (1-Klik)
          </p>
          <div class="grid grid-cols-3 gap-1.5 text-center">
            <button 
              type="button"
              @click="setCredentials('1106232307990001', 'guru')"
              class="px-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition flex flex-col items-center"
            >
              <span>👨‍🏫 Guru Wali</span>
              <span class="text-[10px] text-emerald-600 font-normal">Pak Raeza</span>
            </button>

            <button 
              type="button"
              @click="setCredentials('0092757198', '123')"
              class="px-2 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold transition flex flex-col items-center"
            >
              <span>🎒 Siswa Asuh</span>
              <span class="text-[10px] text-sky-600 font-normal">Hanif Akbar</span>
            </button>

            <button 
              type="button"
              @click="setCredentials('admin', 'admin')"
              class="px-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-semibold transition flex flex-col items-center"
            >
              <span>🛡️ Admin</span>
              <span class="text-[10px] text-purple-600 font-normal">Operator</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center">
          <p class="text-[11px] text-slate-400 font-medium">
            2026 &copy; {{ schoolStore.profile.name }}<br>
            Sistem Karakter 7 KAIH • Zero-Cost Cloud Edition
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
