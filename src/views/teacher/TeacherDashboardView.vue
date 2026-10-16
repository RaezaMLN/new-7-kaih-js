<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useHabitStore } from '../../stores/habitStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  ClipboardCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()
const schoolStore = useSchoolStore()

const teacher = computed(() => authStore.currentUser)
const todayStr = habitStore.getTodayString()

// Filter students for Pak Raeza's class (XII RPL 2)
const students = computed(() => {
  return authStore.usersList.filter(u => u.role === 'siswa' && u.classId === 'xii_rpl_2')
})

// Submission calculations
const studentsStatus = computed(() => {
  return students.value.map(s => {
    const journal = habitStore.getJournal(s.uid, todayStr)
    const rate = habitStore.getCompletionRate(s.uid, todayStr)
    return {
      ...s,
      isCompleted: rate >= 100,
      completionRate: rate,
      journal
    }
  })
})

const completedCount = computed(() => studentsStatus.value.filter(s => s.isCompleted).length)
const pendingCount = computed(() => students.value.length - completedCount.value)
const completionPercentage = computed(() => {
  if (students.value.length === 0) return 0
  return Math.round((completedCount.value / students.value.length) * 100)
})

// One-Click WhatsApp Reminder function
function sendWhatsAppReminder() {
  const pendingStudents = studentsStatus.value.filter(s => !s.isCompleted)
  if (pendingStudents.length === 0) {
    alert('Alhamdulillah! Semua siswa asuh sudah mengisi jurnal hari ini.')
    return
  }

  const namesList = pendingStudents.map((s, idx) => `${idx + 1}. ${s.displayName}`).join('%0A')
  const message = `Assalamu'alaikum wr. wb.%0APengingat untuk ananda siswa asuh XII RPL 2 yang belum melengkapi Jurnal 7 KAIH hari ini (${todayStr}):%0A%0A${namesList}%0A%0AMohon segera melengkapi di link: https://${schoolStore.profile.website || '7kaih.smkn5telkom.sch.id'}%0ATerima kasih.%0A- Guru Wali: ${teacher.value?.displayName}`
  
  const waUrl = `https://wa.me/?text=${message}`
  window.open(waUrl, '_blank')
}

// Teacher quick feedback modal
const selectedStudent = ref(null)
const feedbackText = ref('')
const selectedSticker = ref('⭐')

function openFeedbackModal(student) {
  selectedStudent.value = student
  feedbackText.value = student.journal?.teacherFeedback || ''
  selectedSticker.value = student.journal?.teacherSticker || '⭐'
}

function saveFeedback() {
  if (!selectedStudent.value) return
  habitStore.addTeacherFeedback(
    selectedStudent.value.uid, 
    todayStr, 
    feedbackText.value || 'Tetap semangat dan istiqamah dalam kebaikan!', 
    selectedSticker.value
  )
  selectedStudent.value = null
  alert('Apresiasi / Catatan Guru berhasil dikirim!')
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Teacher Header Profile -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img 
          :src="teacher?.photoURL" 
          alt="Guru" 
          class="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500 shadow-sm flex-shrink-0"
        />
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Guru Wali / Pendamping
            </span>
            <span class="text-xs text-slate-400 font-semibold">• {{ todayStr }}</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Selamat Datang, {{ teacher?.displayName }} 👋
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Unit Kerja: <span class="font-bold text-slate-700">REKAYASA PERANGKAT LUNAK</span> • 
            Kelas Dampingan: <span class="font-bold text-brand-700">XII RPL 2</span> (14 Siswa Asuh)
          </p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <button 
          type="button" 
          @click="sendWhatsAppReminder"
          class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 transition"
        >
          <Share2 class="w-4 h-4" />
          <span>Ingatkan via WA ({{ pendingCount }})</span>
        </button>

        <router-link 
          to="/guru/absensi-murid"
          class="px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <ClipboardCheck class="w-4 h-4 text-brand-700" />
          <span>Absensi Pertemuan</span>
        </router-link>
      </div>
    </div>

    <!-- 3 Metrics Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Card 1: Siswa Asuh -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Siswa Binaan</span>
          <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-slate-900">{{ students.length }}</span>
          <span class="text-xs font-semibold text-slate-500">Siswa Asuh</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Kelas XII RPL 2 • Semester Ganjil</span>
      </div>

      <!-- Card 2: Pengisian Hari Ini -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pengisian Hari Ini</span>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-emerald-700">{{ completionPercentage }}%</span>
          <span class="text-xs font-semibold text-slate-500">{{ completedCount }}/{{ students.length }} Mengisi</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full transition-all" :style="{ width: `${completionPercentage}%` }"></div>
        </div>
      </div>

      <!-- Card 3: Perlu Perhatian -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Belum Melengkapi</span>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-amber-600">{{ pendingCount }}</span>
          <span class="text-xs font-semibold text-slate-500">Siswa Pending</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Gunakan tombol WA untuk mengingatkan</span>
      </div>
    </div>

    <!-- Student Monitoring Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900">
            Daftar Siswa Asuh & Status 7 KAIH Hari Ini
          </h2>
          <p class="text-xs text-slate-500">
            Pantau keterlaksanaan kebiasaan dan berikan apresiasi langsung kepada siswa.
          </p>
        </div>

        <router-link 
          to="/guru/list-murid" 
          class="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
        >
          Lihat Detail Siswa →
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="py-3.5 px-4">#</th>
              <th class="py-3.5 px-4">Nama Peserta Didik</th>
              <th class="py-3.5 px-4">NISN</th>
              <th class="py-3.5 px-4">Capaian 7 KAIH</th>
              <th class="py-3.5 px-4">Status Hari Ini</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            <tr 
              v-for="(s, idx) in studentsStatus" 
              :key="s.uid"
              class="hover:bg-slate-50/80 transition"
            >
              <td class="py-3 px-4 font-bold text-slate-400">{{ idx + 1 }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img :src="s.photoURL" class="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <span class="font-bold text-slate-900 block">{{ s.displayName }}</span>
                    <span class="text-[10px] text-slate-400">Streak: 🔥 {{ s.streak }} hari</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-mono text-slate-500">{{ s.nisn }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      class="h-full rounded-full" 
                      :class="s.completionRate >= 100 ? 'bg-emerald-500' : s.completionRate > 0 ? 'bg-amber-500' : 'bg-slate-300'"
                      :style="{ width: `${s.completionRate}%` }"
                    ></div>
                  </div>
                  <span class="text-[11px] font-bold">{{ s.completionRate }}%</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span 
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                  :class="s.isCompleted 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'"
                >
                  {{ s.isCompleted ? 'Selesai ✓' : 'Belum Melengkapi' }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button 
                  type="button"
                  @click="openFeedbackModal(s)"
                  class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-semibold transition inline-flex items-center gap-1"
                >
                  <MessageSquare class="w-3.5 h-3.5" />
                  <span>Apresiasi</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quick Feedback Modal -->
    <div 
      v-if="selectedStudent"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="selectedStudent = null"
    >
      <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
        <h3 class="text-base font-bold text-slate-900">
          Beri Catatan / Apresiasi: {{ selectedStudent.displayName }}
        </h3>
        <p class="text-xs text-slate-500">
          Catatan ini akan langsung tampil di dashboard siswa asuh Anda sebagai dorongan motivasi.
        </p>

        <!-- Sticker Picker -->
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Pilih Stiker Apresiasi:</label>
          <div class="flex gap-2">
            <button 
              v-for="stk in ['⭐', '👍', '🔥', '🏆', '❤️', '👏']" 
              :key="stk"
              type="button"
              @click="selectedSticker = stk"
              class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition"
              :class="selectedSticker === stk ? 'bg-amber-100 border-amber-400 scale-110' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'"
            >
              {{ stk }}
            </button>
          </div>
        </div>

        <!-- Feedback Text -->
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Catatan Motivasi Guru Wali:</label>
          <textarea 
            v-model="feedbackText"
            rows="3"
            placeholder="Contoh: Sangat membanggakan! Pertahankan konsistensi ibadah dan belajarnya ya nak..."
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            @click="selectedStudent = null"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button 
            type="button" 
            @click="saveFeedback"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow"
          >
            Kirim Apresiasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
