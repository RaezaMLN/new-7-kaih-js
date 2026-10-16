<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useHabitStore } from '../../stores/habitStore'
import StreakCard from '../../components/student/StreakCard.vue'
import { BookOpenCheck, History, ArrowRight, MessageSquareQuote, CheckCircle, Clock } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()

const todayStr = habitStore.getTodayString()
const todayJournal = computed(() => habitStore.getJournal(authStore.currentUser?.uid, todayStr))
const completionRate = computed(() => habitStore.getCompletionRate(authStore.currentUser?.uid, todayStr))
const streak = computed(() => authStore.currentUser?.streak || 1)

// Indonesian formatted date
const dateDisplay = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('id-ID', options)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Greeting & Header -->
    <div class="flex items-center justify-between">
      <div>
        <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">
          {{ dateDisplay }}
        </span>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          Semangat Pagi, {{ authStore.currentUser?.displayName }}! 👋
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium">
          Kelas: <span class="font-bold text-slate-700">XII RPL 2</span> • SMK Negeri 5 Telkom Banda Aceh
        </p>
      </div>

      <router-link
        to="/siswa/profil"
        class="flex-shrink-0"
      >
        <img 
          :src="authStore.currentUser?.photoURL" 
          alt="Avatar" 
          class="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500 shadow-sm"
        />
      </router-link>
    </div>

    <!-- Streak & Progress Hero Card -->
    <StreakCard 
      :streak="streak" 
      :completion-rate="completionRate"
      :student-name="authStore.currentUser?.displayName" 
    />

    <!-- Teacher Feedback Alert (If any) -->
    <div 
      v-if="todayJournal?.teacherFeedback"
      class="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex items-start gap-3 text-amber-900"
    >
      <span class="text-2xl">{{ todayJournal.teacherSticker || '⭐' }}</span>
      <div class="flex-1">
        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-800">
          Catatan & Apresiasi Guru Wali
        </h4>
        <p class="text-sm font-medium mt-0.5 leading-snug">
          "{{ todayJournal.teacherFeedback }}"
        </p>
        <span class="text-[10px] text-amber-600/80 mt-1 block">Wali Kelas: RAEZA MAULANA</span>
      </div>
    </div>

    <!-- Today's Action Card -->
    <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900">
            Jurnal 7 KAIH Hari Ini
          </h2>
          <p class="text-xs text-slate-500">
            Catat 7 kebiasaan baikmu untuk melatih kedisiplinan dan budi pekerti.
          </p>
        </div>

        <span 
          class="px-3 py-1 rounded-full text-xs font-bold border"
          :class="completionRate === 100 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'"
        >
          {{ completionRate === 100 ? 'Selesai 100% ✓' : 'Belum Lengkap' }}
        </span>
      </div>

      <!-- Quick Checklist Preview -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <div 
          v-for="habit in habitStore.habitsDefinition"
          :key="habit.id"
          class="flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition"
          :class="todayJournal?.habits?.[habit.id]?.checked 
            ? 'bg-brand-50/70 border-brand-200 text-brand-900' 
            : 'bg-slate-50 border-slate-200 text-slate-500'"
        >
          <CheckCircle 
            v-if="todayJournal?.habits?.[habit.id]?.checked" 
            class="w-4 h-4 text-brand-600 flex-shrink-0" 
          />
          <Clock v-else class="w-4 h-4 text-slate-300 flex-shrink-0" />
          <span class="truncate">{{ habit.number }}. {{ habit.title }}</span>
        </div>
      </div>

      <!-- CTA Button to Journal -->
      <router-link
        to="/siswa/jurnal"
        class="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition group"
      >
        <BookOpenCheck class="w-5 h-5" />
        <span>{{ completionRate > 0 ? 'Buka & Perbarui Isian Jurnal' : 'Mulai Isi Jurnal Hari Ini' }}</span>
        <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </router-link>
    </div>

    <!-- Daily Reflection Quote -->
    <div class="p-5 rounded-3xl bg-slate-100/80 border border-slate-200 flex items-start gap-3 text-slate-600">
      <MessageSquareQuote class="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
      <div class="text-xs sm:text-sm leading-relaxed">
        <p class="italic">
          "Karakter hebat tidak terbentuk dalam semalam, melainkan dari kebiasaan-kebiasaan kecil yang kamu lakukan setiap hari dengan istiqamah."
        </p>
        <span class="text-[11px] font-bold text-slate-500 block mt-1">
          — Pedoman 7 Kebiasaan Anak Indonesia Hebat
        </span>
      </div>
    </div>
  </div>
</template>
