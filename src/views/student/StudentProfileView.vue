<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import ImageUpload from '../../components/common/ImageUpload.vue'
import { User, Phone, MapPin, Heart, Sparkles, Save, CheckCircle } from 'lucide-vue-next'

const authStore = useAuthStore()
const user = ref({ ...authStore.currentUser })
const isSaved = ref(false)

function handleSave() {
  authStore.updateProfile(user.value)
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        Profil Peserta Didik (Lampiran A)
      </h1>
      <p class="text-xs sm:text-sm text-slate-500">
        Data identitas diri dan informasi kontak untuk pendampingan wali kelas.
      </p>
    </div>

    <!-- Profile Form -->
    <form @submit.prevent="handleSave" class="space-y-4">
      <!-- Card 1: Biodata Akademik -->
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User class="w-4 h-4 text-brand-600" />
          Biodata Utama
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Nama Lengkap</label>
            <input 
              v-model="user.displayName"
              type="text" 
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">NISN (10 Digit)</label>
            <input 
              v-model="user.nisn"
              type="text" 
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Kelas / Rombel</label>
            <input 
              v-model="user.classId"
              type="text" 
              class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
              disabled
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Jenis Kelamin</label>
            <select 
              v-model="user.gender"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand-500"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Card 2: Karakter & Minat Bakat -->
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-brand-600" />
          Minat & Karakter Pribadi
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Hobi / Kegemaran</label>
            <input 
              v-model="user.hobbies"
              type="text" 
              placeholder="Contoh: Membaca, bulu tangkis, coding"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Cita-Cita</label>
            <input 
              v-model="user.dreams"
              type="text" 
              placeholder="Contoh: Software Engineer, Dokter, Pengusaha"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <!-- Card 3: Kontak & Alamat -->
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Phone class="w-4 h-4 text-brand-600" />
          Informasi Kontak & Alamat Rumah
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">No. WhatsApp Siswa</label>
            <input 
              v-model="user.phone"
              type="tel" 
              placeholder="08xxxxxxxxxx"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">No. WhatsApp Orang Tua / Wali</label>
            <input 
              v-model="user.parentPhone"
              type="tel" 
              placeholder="08xxxxxxxxxx"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="text-xs font-semibold text-slate-600 block mb-1">Alamat Lengkap Rumah</label>
            <textarea 
              v-model="user.address"
              rows="2" 
              placeholder="Nama jalan, nomor rumah, kelurahan, kota/kabupaten..."
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit"
        class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
      >
        <CheckCircle v-if="isSaved" class="w-5 h-5 text-emerald-300" />
        <Save v-else class="w-5 h-5" />
        <span>{{ isSaved ? 'Perubahan Berhasil Disimpan! ✓' : 'Simpan Pembaruan Profil' }}</span>
      </button>
    </form>
  </div>
</template>
