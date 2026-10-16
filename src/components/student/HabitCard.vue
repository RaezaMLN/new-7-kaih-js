<script setup>
import { computed } from 'vue'
import { 
  Sun, 
  HeartHandshake, 
  Activity, 
  Salad, 
  BookOpen, 
  Moon, 
  Smile, 
  Check, 
  Clock, 
  FileText 
} from 'lucide-vue-next'

const props = defineProps({
  habit: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({ checked: false, notes: '', details: {} })
  }
})

const emit = defineEmits(['update:modelValue'])

const iconsMap = {
  Sun,
  HeartHandshake,
  Activity,
  Salad,
  BookOpen,
  Moon,
  Smile
}

const currentIcon = computed(() => iconsMap[props.habit.icon] || Sun)

function toggleCheck() {
  const current = { ...props.modelValue }
  current.checked = !current.checked
  
  // Set smart defaults on check
  if (current.checked) {
    if (props.habit.id === 'bangun_pagi' && !current.details?.time) {
      current.details = { ...(current.details || {}), time: '04:45', bedMade: true }
    }
    if (props.habit.id === 'berolahraga' && !current.details?.duration) {
      current.details = { ...(current.details || {}), activity: 'Senam Pagi / Jalan Sehat', duration: 30 }
    }
    if (props.habit.id === 'istirahat_cukup' && !current.details?.sleepTime) {
      current.details = { ...(current.details || {}), sleepTime: '21:30', freshAwake: true }
    }
    if (props.habit.id === 'makan_sehat' && !current.details?.water) {
      current.details = { ...(current.details || {}), water: true, balancedDiet: true }
    }
  }
  
  emit('update:modelValue', current)
}

function updateDetail(key, val) {
  const current = { ...props.modelValue }
  current.details = { ...(current.details || {}), [key]: val }
  emit('update:modelValue', current)
}

function updateNotes(text) {
  const current = { ...props.modelValue, notes: text }
  emit('update:modelValue', current)
}
</script>

<template>
  <div 
    class="rounded-2xl border transition-all duration-300 overflow-hidden"
    :class="modelValue?.checked 
      ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500/30' 
      : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-sm'"
  >
    <!-- Card Header / Summary Row -->
    <div 
      @click="toggleCheck"
      class="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none gap-3"
    >
      <div class="flex items-center gap-3.5">
        <!-- Icon Container -->
        <div 
          class="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 flex-shrink-0"
          :class="modelValue?.checked 
            ? 'bg-brand-600 text-white scale-105 shadow-sm' 
            : 'bg-slate-100 text-slate-500'"
        >
          <component :is="currentIcon" class="w-6 h-6" />
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400">#{{ habit.number }}</span>
            <h3 class="text-base font-bold text-slate-900 leading-snug">
              {{ habit.title }}
            </h3>
          </div>
          <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {{ habit.subtitle }}
          </p>
        </div>
      </div>

      <!-- Toggle Checkbox Button -->
      <button 
        type="button" 
        @click.stop="toggleCheck"
        class="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
        :class="modelValue?.checked 
          ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-300' 
          : 'bg-slate-100 text-slate-300 hover:text-slate-400 border border-slate-200'"
      >
        <Check v-if="modelValue?.checked" class="w-5 h-5 stroke-[3]" />
        <span v-else class="text-xs font-semibold text-slate-400">Pilih</span>
      </button>
    </div>

    <!-- Accordion Specific Form (Expands only when checked) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div v-if="modelValue?.checked" class="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4">
        <!-- 1. BANGUN PAGI -->
        <div v-if="habit.id === 'bangun_pagi'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-brand-600" /> Pukul Berapa Bangun?
            </label>
            <input 
              type="time" 
              :value="modelValue?.details?.time || '04:45'" 
              @input="updateDetail('time', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div class="flex items-center pt-2 sm:pt-6">
            <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
              <input 
                type="checkbox" 
                :checked="modelValue?.details?.bedMade ?? true"
                @change="updateDetail('bedMade', $event.target.checked)"
                class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              Merapikan tempat tidur sendiri
            </label>
          </div>
        </div>

        <!-- 2. BERIBADAH -->
        <div v-else-if="habit.id === 'beribadah'" class="space-y-2.5 pt-2">
          <label class="text-xs font-semibold text-slate-600 block">
            Jenis Ibadah yang Dikerjakan:
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button 
              v-for="ibadah in ['Shalat Subuh', 'Shalat 5 Waktu', 'Dhuha', 'Tadarus Al-Qur\'an', 'Doa Pagi / Saat Teduh', 'Kebaktian']" 
              :key="ibadah"
              type="button"
              @click="updateDetail('type', ibadah)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              :class="modelValue?.details?.type === ibadah 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'"
            >
              {{ ibadah }}
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Catatan ibadah (contoh: Berjamaah di masjid / tadarus 2 lembar)"
            :value="modelValue?.notes || ''"
            @input="updateNotes($event.target.value)"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <!-- 3. BEROLAHRAGA -->
        <div v-else-if="habit.id === 'berolahraga'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Jenis Olahraga / Gerak Fisik:
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Senam pagi, lari, bersepeda, jalan kaki"
              :value="modelValue?.details?.activity || ''"
              @input="updateDetail('activity', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Durasi Aktivitas (Menit):
            </label>
            <input 
              type="number" 
              min="5" 
              max="180" 
              :value="modelValue?.details?.duration || 30"
              @input="updateDetail('duration', Number($event.target.value))"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <!-- 4. MAKAN SEHAT & BERGIZI -->
        <div v-else-if="habit.id === 'makan_sehat'" class="space-y-2.5 pt-2">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Menu Makanan Sehat Hari Ini:
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Nasi, sayur bayam, telur dadar, buah pisang"
              :value="modelValue?.details?.menu || ''"
              @input="updateDetail('menu', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
            <input 
              type="checkbox" 
              :checked="modelValue?.details?.water ?? true"
              @change="updateDetail('water', $event.target.checked)"
              class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            Cukup minum air putih (minimal 6-8 gelas)
          </label>
        </div>

        <!-- 5. GEMAR MEMBACA & BELAJAR -->
        <div v-else-if="habit.id === 'gemar_belajar'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Judul Buku / Materi Pelajaran:
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Buku Pemrograman Web / Sejarah Indonesia"
              :value="modelValue?.details?.topic || ''"
              @input="updateDetail('topic', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">
              Lama Membaca / Halaman:
            </label>
            <input 
              type="text" 
              placeholder="Contoh: 30 menit / 15 halaman"
              :value="modelValue?.details?.duration || ''"
              @input="updateDetail('duration', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <!-- 6. ISTIRAHAT TEPAT WAKTU -->
        <div v-else-if="habit.id === 'istirahat_cukup'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-brand-600" /> Jam Tidur Malam Sebelumnya:
            </label>
            <input 
              type="time" 
              :value="modelValue?.details?.sleepTime || '21:30'" 
              @input="updateDetail('sleepTime', $event.target.value)"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div class="flex items-center pt-2 sm:pt-6">
            <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
              <input 
                type="checkbox" 
                :checked="modelValue?.details?.freshAwake ?? true"
                @change="updateDetail('freshAwake', $event.target.checked)"
                class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              Bangun tidur dengan tubuh segar & bugar
            </label>
          </div>
        </div>

        <!-- 7. BERBUAT BAIK & TOLONG MENOLONG -->
        <div v-else-if="habit.id === 'berbuat_baik'" class="pt-2">
          <label class="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 text-brand-600" /> Cerita Kebaikan Hari Ini:
          </label>
          <textarea 
            rows="2"
            placeholder="Contoh: Membantu ibu membersihkan piring, menyapa tetangga, atau berbagi bekal dengan teman"
            :value="modelValue?.notes || ''"
            @input="updateNotes($event.target.value)"
            class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 resize-none"
          ></textarea>
        </div>
      </div>
    </transition>
  </div>
</template>
