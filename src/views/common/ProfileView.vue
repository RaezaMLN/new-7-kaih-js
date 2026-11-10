<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import ImageUpload from '../../components/common/ImageUpload.vue'
import {
  User,
  Phone,
  Sparkles,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  ShieldCheck
} from 'lucide-vue-next'

const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const user = ref({ ...(authStore.currentUser || {}) })
const isSaved = ref(false)
const isSaving = ref(false)

// Password change state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPasswords = ref(false)
const isChangingPassword = ref(false)
const isPasswordSaved = ref(false)
const passwordError = ref('')

const isStudent = computed(() => authStore.isStudent)
const isTeacher = computed(() => authStore.isTeacher)
const isAdmin = computed(() => authStore.isAdmin)

const headerMeta = computed(() => {
  if (isStudent.value) {
    return {
      title: 'Profil Peserta Didik (Lampiran A)',
      subtitle: 'Data identitas diri, kontak, dan keamanan akun untuk pendampingan wali kelas.'
    }
  }
  if (isTeacher.value) {
    return {
      title: 'Profil Guru Wali',
      subtitle: 'Kelola biodata pendidik, informasi kepegawaian, kontak, dan kata sandi akun.'
    }
  }
  return {
    title: 'Profil Administrator',
    subtitle: 'Kelola identitas operator sistem, kontak, dan kata sandi akun.'
  }
})

const studentClassName = computed(() => schoolStore.getClassName(user.value?.classId))
const assignedTeacherName = computed(
  () => authStore.getTeacherForStudent(user.value, schoolStore.classes)?.displayName || 'Belum Ditugaskan'
)

const teacherClassesLabel = computed(() => {
  const classes = authStore.getTeacherClasses(user.value, schoolStore.classes)
  if (classes.length > 0) return classes.map(c => c.name).join(', ')
  return user.value?.assignedClassId
    ? schoolStore.getClassName(user.value.assignedClassId)
    : 'Belum Ditugaskan'
})

onMounted(async () => {
  await Promise.all([
    authStore.fetchUsersFromFirestore(),
    schoolStore.fetchFromFirestore()
  ])
  if (authStore.currentUser) {
    user.value = { ...authStore.currentUser }
  }
})

async function handleSaveProfile() {
  if (isSaving.value) return
  if (!String(user.value.displayName || '').trim()) {
    alert('Nama lengkap wajib diisi.')
    return
  }

  try {
    isSaving.value = true
    const payload = {
      displayName: String(user.value.displayName || '').trim(),
      username: String(user.value.username || '').trim(),
      email: String(user.value.email || '').trim(),
      phone: String(user.value.phone || '').trim(),
      photoURL: user.value.photoURL || ''
    }

    if (isStudent.value) {
      payload.nisn = String(user.value.nisn || '').trim()
      payload.nis = String(user.value.nis || '').trim()
      payload.gender = user.value.gender || 'L'
      payload.hobbies = String(user.value.hobbies || '').trim()
      payload.dreams = String(user.value.dreams || '').trim()
      payload.parentPhone = String(user.value.parentPhone || '').trim()
      payload.address = String(user.value.address || '').trim()
    } else if (isTeacher.value) {
      payload.nip = String(user.value.nip || '').trim()
      payload.nik = String(user.value.nik || '').trim()
      payload.unitKerja = String(user.value.unitKerja || '').trim()
      payload.statusKepegawaian = String(user.value.statusKepegawaian || '').trim()
    }

    await authStore.updateProfile(payload)
    if (authStore.currentUser) {
      user.value = { ...authStore.currentUser }
    }
    isSaved.value = true
    setTimeout(() => {
      isSaved.value = false
    }, 2000)
  } catch (err) {
    alert('Gagal menyimpan pembaruan profil ke Firestore: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

async function handleChangePassword() {
  if (isChangingPassword.value) return
  passwordError.value = ''

  if (!currentPassword.value || !newPassword.value) {
    passwordError.value = 'Kata sandi saat ini dan kata sandi baru wajib diisi.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Konfirmasi kata sandi baru tidak cocok.'
    return
  }

  try {
    isChangingPassword.value = true
    await authStore.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    isPasswordSaved.value = true
    setTimeout(() => {
      isPasswordSaved.value = false
    }, 2500)
  } catch (err) {
    passwordError.value = err.message || 'Gagal memperbarui kata sandi.'
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        {{ headerMeta.title }}
      </h1>
      <p class="text-xs sm:text-sm text-slate-500">
        {{ headerMeta.subtitle }}
      </p>
    </div>

    <!-- Profile Form -->
    <form @submit.prevent="handleSaveProfile" class="space-y-4">
      <!-- Card 1: Foto & Identitas Dasar -->
      <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User class="w-4 h-4 text-brand-600" />
          Identitas Akun
        </h2>

        <ImageUpload
          v-model="user.photoURL"
          folder="7kaih/profiles"
          label="Foto Profil"
          hint="Unggah foto profil terbaru (otomatis dikompresi menjadi WebP)"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Nama Lengkap</label>
            <input
              v-model="user.displayName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">ID Login (NISN / NIP / Username)</label>
            <input
              :value="user.identifier"
              type="text"
              class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-600 cursor-not-allowed"
              disabled
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Username</label>
            <input
              v-model="user.username"
              type="text"
              placeholder="username login"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-600 block mb-1">Email</label>
            <input
              v-model="user.email"
              type="email"
              placeholder="nama@sekolah.sch.id"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="text-xs font-semibold text-slate-600 block mb-1">No. WhatsApp / HP</label>
            <input
              v-model="user.phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <!-- Card 2A: Data Khusus Peserta Didik -->
      <template v-if="isStudent">
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-brand-600" />
            Biodata Akademik & Minat (Lampiran A)
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">NISN (10 Digit)</label>
              <input
                v-model="user.nisn"
                type="text"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">NIS</label>
              <input
                v-model="user.nis"
                type="text"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">Kelas / Rombel</label>
              <input
                :value="studentClassName"
                type="text"
                class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">Guru Wali Pendamping</label>
              <input
                :value="assignedTeacherName"
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

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">No. WhatsApp Orang Tua / Wali</label>
              <input
                v-model="user.parentPhone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

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
      </template>

      <!-- Card 2B: Data Khusus Guru Wali -->
      <template v-else-if="isTeacher">
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase class="w-4 h-4 text-brand-600" />
            Informasi Kepegawaian & Dampingan
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">NIP</label>
              <input
                v-model="user.nip"
                type="text"
                placeholder="Nomor Induk Pegawai (jika ada)"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">NIK</label>
              <input
                v-model="user.nik"
                type="text"
                placeholder="Nomor Induk Kependudukan"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">Unit Kerja / Kompetensi Keahlian</label>
              <input
                v-model="user.unitKerja"
                type="text"
                placeholder="Contoh: REKAYASA PERANGKAT LUNAK"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-600 block mb-1">Status Kepegawaian</label>
              <input
                v-model="user.statusKepegawaian"
                type="text"
                placeholder="Contoh: PNS / PPPK / Guru Honor Sekolah"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-slate-600 block mb-1">Kelas Dampingan (diatur oleh Admin)</label>
              <input
                :value="teacherClassesLabel"
                type="text"
                class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Card 2C: Info Khusus Admin -->
      <template v-else-if="isAdmin">
        <div class="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 flex items-center gap-3 text-purple-900 text-xs">
          <ShieldCheck class="w-5 h-5 text-purple-600 flex-shrink-0" />
          <span>
            Akun ini memiliki hak akses <strong>Administrator Sekolah</strong> untuk mengelola kelas, pengguna, dan pengaturan KOP surat.
          </span>
        </div>
      </template>

      <!-- Submit Profile Button -->
      <button
        type="submit"
        :disabled="isSaving"
        class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60"
      >
        <CheckCircle v-if="isSaved" class="w-5 h-5 text-emerald-300" />
        <Save v-else class="w-5 h-5" />
        <span>{{ isSaving ? 'Menyimpan...' : isSaved ? 'Perubahan Profil Disimpan! ✓' : 'Simpan Pembaruan Profil' }}</span>
      </button>
    </form>

    <!-- Card 3: Keamanan Akun (Ganti Kata Sandi) -->
    <form @submit.prevent="handleChangePassword" class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <KeyRound class="w-4 h-4 text-brand-600" />
          Ubah Kata Sandi
        </h2>
        <button
          type="button"
          @click="showPasswords = !showPasswords"
          class="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
        >
          <EyeOff v-if="showPasswords" class="w-4 h-4" />
          <Eye v-else class="w-4 h-4" />
          <span>{{ showPasswords ? 'Sembunyikan' : 'Tampilkan' }}</span>
        </button>
      </div>

      <div
        v-if="passwordError"
        class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl"
      >
        {{ passwordError }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Kata Sandi Saat Ini</label>
          <input
            v-model="currentPassword"
            :type="showPasswords ? 'text' : 'password'"
            placeholder="Sandi lama"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Kata Sandi Baru</label>
          <input
            v-model="newPassword"
            :type="showPasswords ? 'text' : 'password'"
            placeholder="Minimal 3 karakter"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 block mb-1">Konfirmasi Sandi Baru</label>
          <input
            v-model="confirmPassword"
            :type="showPasswords ? 'text' : 'password'"
            placeholder="Ulangi sandi baru"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="isChangingPassword"
        class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition disabled:opacity-60"
      >
        <CheckCircle v-if="isPasswordSaved" class="w-4 h-4 text-emerald-300" />
        <KeyRound v-else class="w-4 h-4" />
        <span>{{ isChangingPassword ? 'Memperbarui...' : isPasswordSaved ? 'Kata Sandi Diperbarui! ✓' : 'Perbarui Kata Sandi' }}</span>
      </button>
    </form>
  </div>
</template>
