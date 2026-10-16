<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useHabitStore } from '../../stores/habitStore'
import HabitCard from '../../components/student/HabitCard.vue'
import MoodSelector from '../../components/student/MoodSelector.vue'
import ImageUpload from '../../components/common/ImageUpload.vue'
import confetti from 'canvas-confetti'
import { Save, CheckCircle2, ArrowLeft, Heart, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()

const todayStr = habitStore.getTodayString()
const selectedDate = ref(todayStr)

// Form state
const currentMood = ref('senang')
const habitEntries = ref({})
const photoEvidenceUrl = ref('')
const gratitudeNote = ref('')
const isSaved = ref(false)

onMounted(() => {
  loadJournalForDate(selectedDate.value)
})

function loadJournalForDate(date) {
  const existing = habitStore.getJournal(authStore.currentUser?.uid, date)
  if (existing) {
    currentMood.value = existing.mood || 'senang'
    photoEvidenceUrl.value = existing.photoEvidenceUrl || ''
    gratitudeNote.value = existing.gratitudeNote || ''
    
    // Fill habits
    const map = {}
    habitStore.habitsDefinition.forEach(h => {
      map[h.id] = existing.habits?.[h.id] || { checked: false, notes: '', details: {} }
    })
    habitEntries.value = map
  } else {
    // Fresh default
    const map = {}
    habitStore.habitsDefinition.forEach(h => {
      map[h.id] = { checked: false, notes: '', details: {} }
    })
    habitEntries.value = map
    photoEvidenceUrl.value = ''
    gratitudeNote.value = ''
  }
}

function handleSave() {
  const studentUid = authStore.currentUser?.uid
  if (!studentUid) return

  habitStore.saveJournal(studentUid, selectedDate.value, {
    mood: currentMood.value,
    habits: habitEntries.value,
    photoEvidenceUrl: photoEvidenceUrl.value,
    gratitudeNote: gratitudeNote.value,
    status: 'submitted'
  })

  // Trigger celebration confetti
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 }
  })

  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
    router.push('/siswa/dashboard')
  }, 1200)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 md:pb-14">
    <!-- Back to Dashboard -->
    <div class="flex items-center justify-between">
      <router-link 
        to="/siswa/dashboard" 
        class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-700 transition"
      >
        <ArrowLeft class="w-4 h-4" /> Kembali ke Beranda
      </router-link>

      <span class="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
        📅 {{ selectedDate }}
      </span>
    </div>

    <!-- Header Section -->
    <div>
      <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        Jurnal Pembiasaan 7 KAIH
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
        Centang kebiasaan yang kamu laksanakan hari ini dan isi rincian singkatnya.
      </p>
    </div>

    <!-- Daily Mood Selector -->
    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <MoodSelector v-model="currentMood" />
    </div>

    <!-- 7 Habits Interactive Accordion Cards -->
    <div class="space-y-3">
      <HabitCard 
        v-for="habit in habitStore.habitsDefinition"
        :key="habit.id"
        :habit="habit"
        v-model="habitEntries[habit.id]"
      />
    </div>

    <!-- Gratitude & Reflection Box -->
    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
      <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Heart class="w-4 h-4 text-rose-500 fill-rose-500" />
        Refleksi Diri: Satu Hal yang Kamu Syukuri Hari Ini?
      </label>
      <textarea 
        v-model="gratitudeNote"
        rows="2"
        placeholder="Contoh: Bersyukur bisa belajar bersama teman dengan sehat dan ceria..."
        class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition"
      ></textarea>
    </div>

    <!-- Photo Evidence (Cloudinary) -->
    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <ImageUpload 
        v-model="photoEvidenceUrl"
        folder="7kaih/journals"
        label="Foto Dokumentasi / Bukti Kegiatan Hari Ini (Opsional)"
        hint="Unggah 1 foto kegiatan (misal: saat membaca, olahraga, ibadah, dll)"
      />
    </div>

    <!-- Submit Floating Bar -->
    <div class="sticky bottom-16 md:bottom-6 z-30 pt-2">
      <button 
        type="button"
        @click="handleSave"
        class="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95"
      >
        <CheckCircle2 v-if="isSaved" class="w-5 h-5 text-emerald-300 animate-bounce" />
        <Save v-else class="w-5 h-5" />
        <span class="text-base tracking-wide">
          {{ isSaved ? 'Alhamdulillah, Jurnal Tersimpan! 🎉' : 'Simpan & Kirim Jurnal Hari Ini ✨' }}
        </span>
      </button>
    </div>
  </div>
</template>
