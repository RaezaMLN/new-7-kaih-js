<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'senang'
  }
})

const emit = defineEmits(['update:modelValue'])

const moods = [
  { id: 'senang', label: 'Senang', emoji: '😊', color: 'hover:border-emerald-400' },
  { id: 'semangat', label: 'Semangat', emoji: '🤩', color: 'hover:border-amber-400' },
  { id: 'biasa', label: 'Biasa', emoji: '😐', color: 'hover:border-blue-400' },
  { id: 'lelah', label: 'Lelah/Ngantuk', emoji: '🥱', color: 'hover:border-purple-400' }
]
</script>

<template>
  <div class="space-y-2">
    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">
      Bagaimana suasana hatimu hari ini?
    </label>
    <div class="grid grid-cols-4 gap-2 sm:gap-3">
      <button
        v-for="m in moods"
        :key="m.id"
        type="button"
        @click="emit('update:modelValue', m.id)"
        class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 select-none"
        :class="modelValue === m.id 
          ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-400/20 scale-105' 
          : 'bg-white/70 border-slate-200 hover:bg-white ' + m.color"
      >
        <span class="text-2xl sm:text-3xl mb-1 transform transition-transform hover:scale-125">{{ m.emoji }}</span>
        <span class="text-[11px] font-semibold" :class="modelValue === m.id ? 'text-brand-700' : 'text-slate-600'">
          {{ m.label }}
        </span>
      </button>
    </div>
  </div>
</template>
