<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import {
  Users,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const totalStudents = computed(() => authStore.usersList.filter(u => u.role === 'siswa').length)
const totalTeachers = computed(() => authStore.usersList.filter(u => u.role === 'guru_wali').length)
const totalClasses = computed(() => schoolStore.classes.length)
const teachersList = computed(() => authStore.usersList.filter(u => u.role === 'guru_wali'))

const activeAcademicYearLabel = computed(() => {
  const active = schoolStore.academicYears.find(y => y.isActive) || schoolStore.academicYears[0]
  return active ? `Tapel ${active.name} ${active.semester}` : 'Tapel 2025/2026 Ganjil'
})

function getClassStudentCount(classId) {
  return authStore.usersList.filter(u => u.role === 'siswa' && u.classId === classId).length
}

function getClassTeacherName(classObj) {
  return authStore.getTeacherForClass(classObj)?.displayName || 'Belum Ditugaskan'
}

// Add / Edit Class Modal State
const isClassModalOpen = ref(false)
const editingClassId = ref('')
const isSavingClass = ref(false)
const classForm = ref({
  name: '',
  grade: '12',
  major: 'Rekayasa Perangkat Lunak',
  teacherId: ''
})

function openAddClassModal() {
  editingClassId.value = ''
  classForm.value = {
    name: '',
    grade: '12',
    major: 'Rekayasa Perangkat Lunak',
    teacherId: ''
  }
  isClassModalOpen.value = true
}

function openEditClassModal(cls) {
  editingClassId.value = cls.id
  const linkedTeacher = authStore.getTeacherForClass(cls)
  classForm.value = {
    name: cls.name || '',
    grade: String(cls.grade || '12'),
    major: cls.major || '',
    teacherId: linkedTeacher?.uid || ''
  }
  isClassModalOpen.value = true
}

function buildClassSlug(name) {
  const base = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const slug = base || `kelas_${Date.now()}`
  if (!schoolStore.classes.some(c => c.id === slug)) return slug
  return `${slug}_${Date.now().toString().slice(-4)}`
}

async function handleSaveClass() {
  if (!classForm.value.name.trim()) {
    alert('Nama kelas wajib diisi.')
    return
  }

  try {
    isSavingClass.value = true
    const payload = {
      name: classForm.value.name.trim().toUpperCase(),
      grade: String(classForm.value.grade).trim(),
      major: classForm.value.major.trim() || 'Umum',
      teacherId: classForm.value.teacherId || ''
    }

    let targetClassId = editingClassId.value
    if (editingClassId.value) {
      await schoolStore.updateClass(editingClassId.value, payload)
    } else {
      targetClassId = buildClassSlug(payload.name)
      await schoolStore.addClass({ id: targetClassId, ...payload })
    }

    await authStore.assignTeacherToClass(payload.teacherId, targetClassId, schoolStore)
    isClassModalOpen.value = false
  } catch (err) {
    alert('Gagal menyimpan data kelas ke Firestore: ' + err.message)
  } finally {
    isSavingClass.value = false
  }
}

async function handleDeleteClass(cls) {
  const count = getClassStudentCount(cls.id)
  const confirmMsg =
    count > 0
      ? `Kelas ${cls.name} masih memiliki ${count} siswa. Yakin ingin menghapus kelas ini?`
      : `Yakin ingin menghapus kelas ${cls.name}?`
  if (!confirm(confirmMsg)) return

  try {
    const linkedTeachers = authStore.usersList.filter(
      u => u.role === 'guru_wali' && u.assignedClassId === cls.id
    )
    for (const t of linkedTeachers) {
      await authStore.updateUser(t.uid, { assignedClassId: '' })
    }
    await schoolStore.deleteClass(cls.id)
  } catch (err) {
    alert('Gagal menghapus kelas dari Firestore: ' + err.message)
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Administrator Sekolah
          </span>
          <span class="text-xs text-slate-400 font-semibold">• {{ activeAcademicYearLabel }}</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
          Dashboard Manajemen 7 KAIH
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium">
          {{ schoolStore.profile.name }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <router-link
          to="/admin/settings"
          class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <Settings class="w-4 h-4" />
          <span>Pengaturan KOP & Logo</span>
        </router-link>

        <router-link
          to="/admin/users"
          class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
        >
          <Users class="w-4 h-4" />
          <span>Kelola Pengguna & Penugasan</span>
        </router-link>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Peserta Didik</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-slate-900">{{ totalStudents }}</span>
          <span class="text-xs font-semibold text-slate-500">Siswa Aktif</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Terdaftar dalam rombel</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guru Wali</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-purple-700">{{ totalTeachers }}</span>
          <span class="text-xs font-semibold text-slate-500">Guru Pendamping</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Aktif membina karakter</span>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rombongan Belajar (Rombel)</span>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-700">{{ totalClasses }}</span>
          <span class="text-xs font-semibold text-slate-500">Kelas</span>
        </div>
        <span class="text-[11px] text-slate-400 mt-1 block">Tingkat X, XI, XII</span>
      </div>
    </div>

    <!-- Classes & Homeroom Teachers Management Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900">
            Manajemen Kelas & Guru Wali Pendamping
          </h2>
          <p class="text-xs text-slate-500">
            Tambah kelas baru serta tetapkan guru wali kelas pembina 7 Kebiasaan Anak Indonesia Hebat.
          </p>
        </div>

        <button
          type="button"
          @click="openAddClassModal"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th class="py-3 px-4">Nama Kelas</th>
              <th class="py-3 px-4">Tingkat</th>
              <th class="py-3 px-4">Kompetensi Keahlian</th>
              <th class="py-3 px-4">Guru Wali Kelas</th>
              <th class="py-3 px-4 text-center">Jumlah Murid</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-if="schoolStore.classes.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">
                Belum ada data kelas. Klik "Tambah Kelas" untuk menambahkan rombongan belajar.
              </td>
            </tr>
            <tr v-for="c in schoolStore.classes" :key="c.id" class="hover:bg-slate-50/50">
              <td class="py-3.5 px-4 font-bold text-slate-900">
                {{ c.name }}
                <span class="block text-[10px] text-slate-400 font-mono font-normal">{{ c.id }}</span>
              </td>
              <td class="py-3.5 px-4">Kelas {{ c.grade }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-600">{{ c.major }}</td>
              <td class="py-3.5 px-4">
                <span
                  class="font-bold"
                  :class="authStore.getTeacherForClass(c) ? 'text-brand-700' : 'text-amber-600'"
                >
                  {{ getClassTeacherName(c) }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  {{ getClassStudentCount(c.id) }} Siswa
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    @click="openEditClassModal(c)"
                    class="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                    title="Edit Kelas & Guru Wali"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    @click="handleDeleteClass(c)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Kelas"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Tambah / Edit Kelas -->
    <div
      v-if="isClassModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isClassModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">
            {{ editingClassId ? 'Edit Kelas & Guru Wali' : 'Tambah Kelas Baru' }}
          </h3>
          <button type="button" @click="isClassModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="font-bold text-slate-700 block mb-1">Nama Kelas / Rombel:</label>
            <input
              v-model="classForm.name"
              type="text"
              placeholder="Contoh: XII RPL 3"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Tingkat:</label>
            <select v-model="classForm.grade" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
              <option value="10">Kelas 10 (X)</option>
              <option value="11">Kelas 11 (XI)</option>
              <option value="12">Kelas 12 (XII)</option>
            </select>
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Kompetensi Keahlian / Jurusan:</label>
            <input
              v-model="classForm.major"
              type="text"
              placeholder="Contoh: Rekayasa Perangkat Lunak"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Tetapkan Guru Wali Kelas:</label>
            <select v-model="classForm.teacherId" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
              <option value="">-- Belum Ditugaskan --</option>
              <option v-for="t in teachersList" :key="t.uid" :value="t.uid">
                {{ t.displayName }} ({{ t.identifier }})
              </option>
            </select>
            <p class="text-[11px] text-slate-400 mt-1">
              Menetapkan guru wali akan otomatis menghubungkan seluruh siswa di kelas ini (kecuali yang diatur manual per siswa).
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="isClassModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleSaveClass"
            :disabled="isSavingClass"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow disabled:opacity-50"
          >
            {{ isSavingClass ? 'Menyimpan...' : 'Simpan Kelas' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
