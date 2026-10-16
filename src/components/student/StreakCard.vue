<script setup>
import { computed } from 'vue'
import { Flame, Trophy, Award, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  streak: {
    type: Number,
    default: 1
  },
  completionRate: {
    type: Number,
    default: 0
  },
  studentName: {
    type: String,
    default: ''
  }
})

const motivationQuote = computed(() => {
  if (props.completionRate === 100) return 'Luar biasa! Semua kebiasaan hebat hari ini tuntas! 🎉'
  if (props.completionRate >= 50) return 'Hebat! Lebih dari separuh kebiasaan sudah kamu selesaikan.'
  return 'Setiap langkah kecil membiasakan kebaikan adalah investasi masa depanmu.'
})
</script>

<template>
  <div class="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-emerald-900 text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
    <!-- Background glowing accents -->
    <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
    <div class="absolute -left-8 -top-8 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none"></div>

    <div class="relative z-10">
      <!-- Top Row -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
            <Flame class="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <span class="text-xs font-semibold text-emerald-200 tracking-wide uppercase">Konsistensi</span>
            <h4 class="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              {{ streak }} Hari Berturut-turut!
            </h4>
          </div>
        </div>

        <div class="text-right">
          <span class="text-xs text-emerald-200 block">Capaian Hari Ini</span>
          <span class="text-xl font-extrabold text-amber-300">{{ completionRate }}%</span>
        </div>
      </div>

      <!-- Motivational message -->
      <p class="text-xs sm:text-sm text-emerald-100/90 mt-3 font-medium leading-relaxed">
        {{ motivationQuote }}
      </p>

      <!-- Progress Bar -->
      <div class="mt-4">
        <div class="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5 backdrop-blur">
          <div 
            class="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
            :style="{ width: `${completionRate}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-[11px] text-emerald-200/75 mt-1 font-medium">
          <span>0/7 Selesai</span>
          <span>Target: 7 Kebiasaan Tuntas</span>
        </div>
      </div>
    </div>
  </div>
</template>
