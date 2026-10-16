<script setup>
import { ref } from 'vue'
import { useSchoolStore } from '../../stores/schoolStore'
import OfficialLetterhead from '../../components/report/OfficialLetterhead.vue'
import ImageUpload from '../../components/common/ImageUpload.vue'
import { School, Save, CheckCircle2, RefreshCw } from 'lucide-vue-next'

const schoolStore = useSchoolStore()
const form = ref({ ...schoolStore.profile })
const isSaved = ref(false)

function handleSave() {
  schoolStore.updateProfile(form.value)
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <School class="w-6 h-6 text-purple-600" />
          Pengaturan Profil Sekolah & KOP Surat Resmi
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Ubah identitas satuan pendidikan, logo resmi, dan tata naskah dinas KOP surat.
        </p>
      </div>

      <button 
        type="button" 
        @click="handleSave"
        class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
      >
        <CheckCircle2 v-if="isSaved" class="w-4 h-4 text-emerald-300 animate-bounce" />
        <Save v-else class="w-4 h-4" />
        <span>{{ isSaved ? 'Perubahan Disimpan! ✓' : 'Simpan Pengaturan KOP' }}</span>
      </button>
    </div>

    <!-- Split Screen: Left Input Form, Right Live Preview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Left Column: Form -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Formulir Tata Naskah KOP
        </h2>

        <!-- Logos Upload -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ImageUpload 
            v-model="form.logoLeftUrl"
            folder="7kaih/school_assets"
            label="Logo Kiri (Dinas/Pemda)"
            hint="Upload logo Pemda / Tut Wuri"
          />
          <ImageUpload 
            v-model="form.logoRightUrl"
            folder="7kaih/school_assets"
            label="Logo Kanan (Sekolah)"
            hint="Upload lambang sekolah"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Baris 1 (Pemerintah Provinsi / Daerah):</label>
          <input 
            v-model="form.province" 
            type="text" 
            class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Baris 2 (Dinas Pendidikan):</label>
          <input 
            v-model="form.department" 
            type="text" 
            class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Baris 3 (Nama Satuan Pendidikan):</label>
          <input 
            v-model="form.name" 
            type="text" 
            class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap:</label>
          <textarea 
            v-model="form.address" 
            rows="2" 
            class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">No. Telepon:</label>
            <input 
              v-model="form.phone" 
              type="text" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">Email Sekolah:</label>
            <input 
              v-model="form.email" 
              type="email" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
            />
          </div>
        </div>

        <!-- Headmaster Info -->
        <div class="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">Nama Kepala Sekolah:</label>
            <input 
              v-model="form.headmasterName" 
              type="text" 
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block mb-1">NIP Kepala Sekolah:</label>
            <input 
              v-model="form.headmasterNip" 
              type="text" 
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
            />
          </div>
        </div>
      </div>

      <!-- Right Column: Live Preview -->
      <div class="space-y-3 sticky top-20">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Pratinjau Langsung (Live Preview KOP Dokumen A4):
        </span>

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-xl text-slate-900">
          <!-- Dynamic KOP -->
          <div class="w-full text-center pb-2 mb-4">
            <div class="flex items-center justify-between gap-4">
              <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <img 
                  v-if="form.logoLeftUrl" 
                  :src="form.logoLeftUrl" 
                  class="max-w-full max-h-full object-contain" 
                  @error="(e) => e.target.style.display = 'none'"
                />
              </div>

              <div class="flex-1 px-2">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider leading-tight">
                  {{ form.province }}
                </h3>
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider leading-tight">
                  {{ form.department }}
                </h4>
                <h2 class="text-sm sm:text-base font-extrabold text-slate-900 uppercase mt-0.5 leading-tight">
                  {{ form.name }}
                </h2>
                <p class="text-[10px] text-slate-600 mt-1">
                  {{ form.address }}
                </p>
                <p class="text-[10px] text-slate-500 font-medium">
                  Telp: {{ form.phone }} | Email: {{ form.email }}
                </p>
              </div>

              <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <img 
                  v-if="form.logoRightUrl" 
                  :src="form.logoRightUrl" 
                  class="max-w-full max-h-full object-contain" 
                  @error="(e) => e.target.style.display = 'none'"
                />
              </div>
            </div>

            <!-- Double border line -->
            <div class="mt-3 border-b-2 border-slate-900"></div>
            <div class="mt-0.5 border-b border-slate-900"></div>
          </div>

          <!-- Dummy Document Body in Preview -->
          <div class="py-4 text-center text-xs text-slate-400 italic border-b border-dashed border-slate-200">
            [ Tampilan Isi Lembar Laporan Rapor / Lampiran A, B, C, E ]
          </div>

          <!-- Signature preview -->
          <div class="mt-6 text-center text-xs">
            <p>Mengesahkan,</p>
            <p class="font-semibold text-slate-700">Kepala Sekolah {{ form.name }},</p>
            <div class="h-14"></div>
            <p class="font-bold border-b border-slate-900 inline-block px-4">{{ form.headmasterName }}</p>
            <p class="text-[10px] text-slate-500 font-mono">NIP. {{ form.headmasterNip }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
