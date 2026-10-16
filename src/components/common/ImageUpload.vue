<script setup>
import { ref } from 'vue'
import { uploadToCloudinary } from '../../services/cloudinary'
import { Camera, UploadCloud, X, CheckCircle2, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  folder: {
    type: String,
    default: '7kaih/general'
  },
  label: {
    type: String,
    default: 'Unggah Foto Bukti / Dokumentasi'
  },
  hint: {
    type: String,
    default: 'Maks. 5MB, otomatis dikompresi menjadi WebP ringan'
  }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const fileInput = ref(null)
const isUploading = ref(false)
const uploadProgress = ref('')
const previewUrl = ref(props.modelValue)

function triggerSelect() {
  fileInput.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    isUploading.value = true
    uploadProgress.value = 'Mengompresi gambar...'
    
    const result = await uploadToCloudinary(file, props.folder)
    previewUrl.value = result.secureUrl || result.url
    emit('update:modelValue', previewUrl.value)
    emit('uploaded', result)
    uploadProgress.value = 'Berhasil diunggah!'
  } catch (error) {
    alert('Gagal mengunggah foto: ' + error.message)
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = ''
    }, 2000)
  }
}

function removeImage() {
  previewUrl.value = ''
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-semibold text-slate-700">
      {{ label }}
    </label>

    <input 
      type="file" 
      ref="fileInput" 
      accept="image/*" 
      class="hidden" 
      @change="handleFileChange" 
    />

    <!-- Upload Box or Preview -->
    <div 
      v-if="!previewUrl" 
      @click="triggerSelect"
      class="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
    >
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center group-hover:scale-110 transition-transform">
        <Loader2 v-if="isUploading" class="w-6 h-6 animate-spin text-brand-600" />
        <Camera v-else class="w-6 h-6" />
      </div>

      <p class="text-sm font-semibold text-slate-800">
        {{ isUploading ? uploadProgress : 'Ketuk untuk Ambil Foto atau Pilih Gambar' }}
      </p>
      <p class="text-xs text-slate-500 mt-1">
        {{ hint }}
      </p>
    </div>

    <!-- Image Preview Card -->
    <div v-else class="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group max-w-sm">
      <img 
        :src="previewUrl" 
        alt="Bukti Foto" 
        class="w-full h-48 object-cover group-hover:brightness-95 transition"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3 text-white">
        <div class="flex items-center gap-1.5 text-xs font-medium">
          <CheckCircle2 class="w-4 h-4 text-emerald-400" />
          <span>Foto Terpasang</span>
        </div>
        <button 
          type="button" 
          @click.stop="removeImage"
          class="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
          title="Hapus foto"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
