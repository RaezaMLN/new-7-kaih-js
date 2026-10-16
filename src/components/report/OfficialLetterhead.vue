<script setup>
import { useSchoolStore } from '../../stores/schoolStore'

const schoolStore = useSchoolStore()
const p = schoolStore.profile
</script>

<template>
  <div class="w-full text-center pb-2 mb-4">
    <!-- Header with Dual Logos -->
    <div class="flex items-center justify-between gap-4">
      <!-- Left Logo -->
      <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center">
        <img 
          v-if="p.logoLeftUrl" 
          :src="p.logoLeftUrl" 
          alt="Logo Dinas" 
          class="max-w-full max-h-full object-contain"
          @error="(e) => e.target.style.display = 'none'"
        />
      </div>

      <!-- Text Header -->
      <div class="flex-1 px-2">
        <h3 class="text-sm sm:text-base font-bold text-slate-800 tracking-wider uppercase leading-tight">
          {{ p.province || 'PEMERINTAH PROVINSI' }}
        </h3>
        <h4 class="text-sm sm:text-base font-bold text-slate-800 tracking-wider uppercase leading-tight">
          {{ p.department || 'DINAS PENDIDIKAN' }}
        </h4>
        <h2 class="text-base sm:text-xl font-extrabold text-slate-900 tracking-wide uppercase mt-0.5 leading-tight">
          {{ p.name }}
        </h2>
        <p class="text-xs text-slate-600 mt-1 leading-normal">
          {{ p.address }}
        </p>
        <p class="text-xs text-slate-500 font-medium">
          Telp: {{ p.phone }} | Email: {{ p.email }} | Website: {{ p.website }}
        </p>
      </div>

      <!-- Right Logo -->
      <div class="w-20 h-20 flex-shrink-0 flex items-center justify-center">
        <img 
          v-if="p.logoRightUrl" 
          :src="p.logoRightUrl" 
          alt="Logo Sekolah" 
          class="max-w-full max-h-full object-contain"
          @error="(e) => e.target.style.display = 'none'"
        />
      </div>
    </div>

    <!-- Official Double Border Line -->
    <div class="mt-3 border-b-2 border-slate-900"></div>
    <div class="mt-0.5 border-b border-slate-900"></div>
  </div>
</template>
