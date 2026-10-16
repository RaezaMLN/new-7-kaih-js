<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useHabitStore } from '../../stores/habitStore'
import { Calendar, Check, Clock, MessageSquare, Star, ArrowLeft } from 'lucide-vue-next'

const authStore = useAuthStore()
const habitStore = useHabitStore()

const studentUid = authStore.currentUser?.uid

// Get student's monthly stats
const stats = computed(() => habitStore.getStudentMonthlyStats(studentUid, '2026-09'))

// Get list of submitted journals
const studentJournals = computed(() => {
  const list = []
  Object.keys(habitStore.journals).forEach(k => {
    if (k.startsWith(studentUid + '_')) {
      list.push(habitStore.journals[k])
    }
  })
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <router-link 
          to="/siswa/dashboard" 
          class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-700 transition mb-1"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali
        </router-link>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Riwayat & Pencapaian Karakter
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Perkembangan keterlaksanaan 7 KAIH Ananda selama periode ini.
        </p>
      </div>

      <span class="text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-xl">
        September 2026
      </span>
    </div>

    <!-- Monthly Summary Grid (Radar-Like Stats) -->
    <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
        Ringkasan Ketercapaian Bulan Ini (30 Hari)
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          v-for="(item, key) in stats" 
          :key="key"
          class="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
        >
          <div>
            <h4 class="text-xs font-bold text-slate-800">{{ item.title }}</h4>
            <span class="text-[11px] text-slate-500">{{ item.completedDays }} / {{ item.totalDays }} Hari Terlaksana</span>
          </div>

          <div class="text-right">
            <span 
              class="px-2.5 py-0.5 rounded-lg text-xs font-extrabold"
              :class="item.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ item.percentage }}%
            </span>
            <span class="block text-[10px] text-slate-400 font-semibold mt-0.5">{{ item.predicate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline of Journals -->
    <div class="space-y-3">
      <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
        Log Jurnal Harian yang Terkirim
      </h2>

      <div v-if="studentJournals.length === 0" class="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
        Belum ada jurnal yang tersimpan. Ayo mulai isi jurnal hari ini!
      </div>

      <div 
        v-for="j in studentJournals" 
        :key="j.date"
        class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-brand-600" />
            <span class="font-bold text-slate-900 text-sm">{{ j.date }}</span>
            <span class="text-base">{{ j.mood === 'senang' ? '😊' : j.mood === 'semangat' ? '🤩' : '😐' }}</span>
          </div>

          <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            Terkirim ✓
          </span>
        </div>

        <!-- Gratitude if any -->
        <p v-if="j.gratitudeNote" class="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          "{{ j.gratitudeNote }}"
        </p>

        <!-- Teacher Feedback if any -->
        <div v-if="j.teacherFeedback" class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <span>{{ j.teacherSticker || '⭐' }}</span>
          <div>
            <span class="font-bold">Umpan Balik Guru Wali:</span>
            <p class="mt-0.5">"{{ j.teacherFeedback }}"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
