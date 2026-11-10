<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import ImageUpload from '../../components/common/ImageUpload.vue'
import * as XLSX from 'xlsx'
import {
  Search,
  UserPlus,
  Upload,
  Download,
  Trash2,
  Pencil,
  Link2,
  CheckCircle2,
  FileSpreadsheet,
  X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const schoolStore = useSchoolStore()

const searchQuery = ref('')
const selectedRole = ref('all')
const isUserModalOpen = ref(false)
const editingUserUid = ref('')
const isSavingUser = ref(false)

const isImportModalOpen = ref(false)
const importFileRef = ref(null)
const importedRows = ref([])
const isImporting = ref(false)

// Link Teacher <-> Students Modal State
const isLinkModalOpen = ref(false)
const isSavingLink = ref(false)
const linkTeacherUid = ref('')
const linkAssignedClassId = ref('')
const linkSelectedStudentIds = ref([])
const linkStudentSearch = ref('')
const linkClassFilter = ref('all')

const classesList = computed(() => schoolStore.classes)
const teachersList = computed(() => authStore.usersList.filter(u => u.role === 'guru_wali'))
const allStudentsList = computed(() => authStore.usersList.filter(u => u.role === 'siswa'))

const defaultClassId = computed(() => classesList.value[0]?.id || '')

const userForm = ref({
  displayName: '',
  identifier: '',
  username: '',
  email: '',
  photoURL: '',
  nisn: '',
  nis: '',
  nip: '',
  nik: '',
  role: 'siswa',
  classId: '',
  assignedClassId: '',
  guruWaliId: '',
  unitKerja: '',
  statusKepegawaian: '',
  gender: 'L',
  phone: '',
  parentPhone: '',
  hobbies: '',
  dreams: '',
  address: '',
  password: '123'
})

const filteredUsers = computed(() => {
  return authStore.usersList.filter(u => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch =
      u.displayName?.toLowerCase().includes(q) ||
      u.identifier?.toLowerCase().includes(q) ||
      u.nisn?.toLowerCase().includes(q) ||
      u.nip?.toLowerCase().includes(q)
    if (!matchesSearch) return false
    if (selectedRole.value !== 'all' && u.role !== selectedRole.value) return false
    return true
  })
})

function resolveUserClassLabel(user) {
  if (user.role === 'guru_wali') {
    const classes = authStore.getTeacherClasses(user, classesList.value)
    if (classes.length > 0) return classes.map(c => c.name).join(', ')
    return user.assignedClassId ? schoolStore.getClassName(user.assignedClassId) : 'Belum ditugaskan'
  }
  if (user.role === 'siswa') {
    return user.classId ? schoolStore.getClassName(user.classId) : '-'
  }
  return '-'
}

function getStudentMentorLabel(student) {
  const teacher = authStore.getTeacherForStudent(student, classesList.value)
  return teacher ? teacher.displayName : 'Belum terhubung'
}

function getTeacherMenteeCount(teacher) {
  return authStore.getStudentsForTeacher(teacher, classesList.value).length
}

function openAddUserModal() {
  editingUserUid.value = ''
  userForm.value = {
    displayName: '',
    identifier: '',
    username: '',
    email: '',
    photoURL: '',
    nisn: '',
    nis: '',
    nip: '',
    nik: '',
    role: 'siswa',
    classId: defaultClassId.value,
    assignedClassId: '',
    guruWaliId: '',
    unitKerja: '',
    statusKepegawaian: '',
    gender: 'L',
    phone: '',
    parentPhone: '',
    hobbies: '',
    dreams: '',
    address: '',
    password: '123'
  }
  isUserModalOpen.value = true
}

function openEditUserModal(user) {
  editingUserUid.value = user.uid
  userForm.value = {
    displayName: user.displayName || '',
    identifier: user.identifier || user.username || '',
    username: user.username || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    nisn: user.nisn || '',
    nis: user.nis || '',
    nip: user.nip || '',
    nik: user.nik || '',
    role: user.role || 'siswa',
    classId: user.classId || defaultClassId.value,
    assignedClassId: user.assignedClassId || '',
    guruWaliId: user.guruWaliId || '',
    unitKerja: user.unitKerja || '',
    statusKepegawaian: user.statusKepegawaian || '',
    gender: user.gender || 'L',
    phone: user.phone || '',
    parentPhone: user.parentPhone || '',
    hobbies: user.hobbies || '',
    dreams: user.dreams || '',
    address: user.address || '',
    password: user.password || ''
  }
  isUserModalOpen.value = true
}

async function handleSaveUser() {
  if (!userForm.value.displayName.trim() || !userForm.value.identifier.trim()) {
    alert('Nama Lengkap dan Nomor Identitas (Login) wajib diisi.')
    return
  }

  try {
    isSavingUser.value = true
    const cleanId = userForm.value.identifier.trim()
    const cleanUsername =
      userForm.value.username.trim() || cleanId.toLowerCase().replace(/\s+/g, '')
    const payload = {
      displayName: userForm.value.displayName.trim(),
      identifier: cleanId,
      username: cleanUsername,
      email: userForm.value.email.trim(),
      role: userForm.value.role,
      phone: userForm.value.phone.trim()
    }

    if (userForm.value.photoURL) {
      payload.photoURL = userForm.value.photoURL
    }

    if (userForm.value.password.trim()) {
      payload.password = userForm.value.password.trim()
    }

    if (userForm.value.role === 'siswa') {
      payload.nisn = userForm.value.nisn.trim() || cleanId
      payload.nis = userForm.value.nis.trim()
      payload.classId = userForm.value.classId
      payload.guruWaliId = userForm.value.guruWaliId
      payload.gender = userForm.value.gender
      payload.parentPhone = userForm.value.parentPhone.trim()
      payload.hobbies = userForm.value.hobbies.trim()
      payload.dreams = userForm.value.dreams.trim()
      payload.address = userForm.value.address.trim()
    } else if (userForm.value.role === 'guru_wali') {
      payload.nip = userForm.value.nip.trim()
      payload.nik = userForm.value.nik.trim() || cleanId
      payload.assignedClassId = userForm.value.assignedClassId
      payload.unitKerja = userForm.value.unitKerja.trim()
      payload.statusKepegawaian = userForm.value.statusKepegawaian.trim()
    }

    if (editingUserUid.value) {
      await authStore.updateUser(editingUserUid.value, payload)
      if (payload.role === 'guru_wali') {
        await authStore.assignTeacherToClass(editingUserUid.value, payload.assignedClassId, schoolStore)
      }
      isUserModalOpen.value = false
      alert('Data pengguna berhasil diperbarui!')
    } else {
      const uid = 'usr_' + Date.now()
      const newUser = {
        uid,
        password: payload.password || (payload.role === 'guru_wali' ? 'guru' : payload.role === 'admin' ? 'admin' : '123'),
        photoURL:
          payload.photoURL ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        ...payload
      }
      await authStore.addUser(newUser)
      if (newUser.role === 'guru_wali' && newUser.assignedClassId) {
        await authStore.assignTeacherToClass(uid, newUser.assignedClassId, schoolStore)
      }
      isUserModalOpen.value = false
      alert('Pengguna berhasil ditambahkan!')
    }
  } catch (err) {
    alert('Gagal menyimpan pengguna ke Firestore: ' + err.message)
  } finally {
    isSavingUser.value = false
  }
}

async function handleDeleteUser(uid) {
  if (confirm('Yakin ingin menghapus pengguna ini?')) {
    try {
      await authStore.deleteUser(uid)
    } catch (err) {
      alert('Gagal menghapus pengguna dari Firestore: ' + err.message)
    }
  }
}

// Mentorship Linking Modal Logic
function loadLinkModalForTeacher(teacherUid) {
  linkTeacherUid.value = teacherUid
  const teacher = teachersList.value.find(t => t.uid === teacherUid)
  if (!teacher) return

  const linkedClasses = authStore.getTeacherClasses(teacher, classesList.value)
  linkAssignedClassId.value = teacher.assignedClassId || linkedClasses[0]?.id || ''
  linkSelectedStudentIds.value = authStore
    .getStudentsForTeacher(teacher, classesList.value)
    .map(s => s.uid)
}

function openLinkModal(preferredTeacherUid = '') {
  if (teachersList.value.length === 0) {
    alert('Belum ada akun Guru Wali. Tambahkan akun Guru Wali terlebih dahulu.')
    return
  }
  linkStudentSearch.value = ''
  linkClassFilter.value = 'all'
  const targetUid = preferredTeacherUid || teachersList.value[0].uid
  loadLinkModalForTeacher(targetUid)
  isLinkModalOpen.value = true
}

function selectAllStudentsInAssignedClass() {
  if (!linkAssignedClassId.value) return
  const classStudentIds = allStudentsList.value
    .filter(s => s.classId === linkAssignedClassId.value)
    .map(s => s.uid)
  const merged = new Set([...linkSelectedStudentIds.value, ...classStudentIds])
  linkSelectedStudentIds.value = Array.from(merged)
}

function clearSelectedLinkStudents() {
  linkSelectedStudentIds.value = []
}

function toggleLinkStudent(studentUid) {
  const idx = linkSelectedStudentIds.value.indexOf(studentUid)
  if (idx === -1) {
    linkSelectedStudentIds.value.push(studentUid)
  } else {
    linkSelectedStudentIds.value.splice(idx, 1)
  }
}

const filteredLinkStudents = computed(() => {
  return allStudentsList.value.filter(s => {
    const q = linkStudentSearch.value.toLowerCase()
    const matchesSearch =
      s.displayName?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q)
    if (!matchesSearch) return false
    if (linkClassFilter.value !== 'all' && s.classId !== linkClassFilter.value) return false
    return true
  })
})

async function handleSaveLinking() {
  if (!linkTeacherUid.value) return
  try {
    isSavingLink.value = true
    await authStore.assignTeacherMentorship({
      teacherUid: linkTeacherUid.value,
      assignedClassId: linkAssignedClassId.value,
      selectedStudentIds: linkSelectedStudentIds.value,
      schoolStore
    })
    isLinkModalOpen.value = false
    alert('Penugasan Guru Wali dan murid binaannya berhasil disimpan ke Firestore!')
  } catch (err) {
    alert('Gagal menyimpan penugasan ke Firestore: ' + err.message)
  } finally {
    isSavingLink.value = false
  }
}

// 1. Export Data to Excel
function exportExcel() {
  const exportData = authStore.usersList.map((u, idx) => ({
    'No': idx + 1,
    'Nama Lengkap': u.displayName,
    'Peran': u.role === 'admin' ? 'admin' : u.role === 'guru_wali' ? 'guru_wali' : 'siswa',
    'ID Login / Username': u.identifier || u.username,
    'NISN / NIP': u.nisn || u.nip || '-',
    'Kelas / Dampingan': resolveUserClassLabel(u),
    'Guru Wali': u.role === 'siswa' ? getStudentMentorLabel(u) : '-',
    'Jenis Kelamin': u.gender || '-',
    'No HP Siswa': u.phone || '-',
    'No HP Orang Tua': u.parentPhone || '-',
    'Alamat Rumah': u.address || '-',
    'Cita-Cita': u.dreams || '-',
    'Hobi': u.hobbies || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Pengguna')
  XLSX.writeFile(workbook, 'Data_Pengguna_7KAIH.xlsx')
}

// 2. Download Official Excel Template
function downloadTemplateExcel() {
  const sampleClassId = classesList.value[0]?.id || 'xii_rpl_2'
  const templateData = [
    {
      'Nama Lengkap': 'Ahmad Fauzan Pratama',
      'Peran (siswa / guru_wali)': 'siswa',
      'ID Login (NISN/NIP)': '0091234567',
      'Password Default': '123',
      'Kelas (ID atau Nama)': sampleClassId,
      'Jenis Kelamin (L/P)': 'L',
      'No HP Siswa': '081234567891',
      'No HP Orang Tua': '081234567892',
      'Alamat': 'Jl. Tgk Daud Beureueh, Banda Aceh',
      'Cita-Cita': 'Software Engineer',
      'Hobi': 'Membaca'
    },
    {
      'Nama Lengkap': 'Siti Rahmawati',
      'Peran (siswa / guru_wali)': 'siswa',
      'ID Login (NISN/NIP)': '0091234568',
      'Password Default': '123',
      'Kelas (ID atau Nama)': sampleClassId,
      'Jenis Kelamin (L/P)': 'P',
      'No HP Siswa': '081234567893',
      'No HP Orang Tua': '081234567894',
      'Alamat': 'Lamprit, Banda Aceh',
      'Cita-Cita': 'Dokter',
      'Hobi': 'Bulu Tangkis'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Siswa')
  XLSX.writeFile(workbook, 'Template_Import_Siswa_7KAIH.xlsx')
}

function resolveImportedClassId(rawValue) {
  const clean = String(rawValue || '').trim()
  if (!clean) return defaultClassId.value
  const found = classesList.value.find(
    c => c.id.toLowerCase() === clean.toLowerCase() || c.name.toLowerCase() === clean.toLowerCase()
  )
  return found ? found.id : clean
}

// 3. Trigger File Upload
function triggerImport() {
  importFileRef.value?.click()
}

// 4. Parse Excel file
function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rawRows = XLSX.utils.sheet_to_json(worksheet)

      if (rawRows.length === 0) {
        alert('File Excel kosong atau format tidak sesuai.')
        return
      }

      importedRows.value = rawRows.map((r, idx) => {
        const roleRaw = String(r['Peran (siswa / guru_wali)'] || r['Peran'] || 'siswa').toLowerCase()
        const role = roleRaw.includes('guru') ? 'guru_wali' : 'siswa'
        const loginId = String(
          r['ID Login (NISN/NIP)'] || r['NISN'] || r['ID Login'] || ('009' + Date.now().toString().slice(-7) + idx)
        )
        const resolvedClassId = resolveImportedClassId(
          r['Kelas (ID atau Nama)'] || r['Kelas (xii_rpl_2)'] || r['Kelas']
        )

        const baseUser = {
          uid: 'import_' + Date.now() + '_' + idx,
          displayName: r['Nama Lengkap'] || r['Nama'] || 'Pengguna Baru',
          role,
          identifier: loginId,
          password: String(r['Password Default'] || (role === 'guru_wali' ? 'guru' : '123')),
          gender: r['Jenis Kelamin (L/P)'] || r['Jenis Kelamin'] || 'L',
          phone: String(r['No HP Siswa'] || r['No HP'] || ''),
          parentPhone: String(r['No HP Orang Tua'] || ''),
          address: r['Alamat'] || '',
          dreams: r['Cita-Cita'] || '',
          hobbies: r['Hobi'] || '',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        }

        if (role === 'guru_wali') {
          return { ...baseUser, nip: loginId, assignedClassId: resolvedClassId }
        }
        return { ...baseUser, nisn: loginId, classId: resolvedClassId }
      })

      isImportModalOpen.value = true
    } catch (err) {
      alert('Gagal membaca file Excel: ' + err.message)
    } finally {
      if (importFileRef.value) importFileRef.value.value = ''
    }
  }
  reader.readAsArrayBuffer(file)
}

// 5. Confirm Save Imported Rows
async function confirmImport() {
  if (importedRows.value.length === 0) return

  isImporting.value = true
  try {
    for (const user of importedRows.value) {
      await authStore.addUser(user)
      if (user.role === 'guru_wali' && user.assignedClassId) {
        const cls = schoolStore.getClassById(user.assignedClassId)
        if (cls && !cls.teacherId) {
          await authStore.assignTeacherToClass(user.uid, user.assignedClassId, schoolStore)
        }
      }
    }
    alert(`Berhasil mengimpor ${importedRows.value.length} data pengguna ke Firestore!`)
    isImportModalOpen.value = false
    importedRows.value = []
  } catch (err) {
    alert('Sebagian data gagal disimpan: ' + err.message)
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Pengguna (Siswa & Guru Wali)
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Kelola akun siswa, guru wali, penempatan kelas, serta hubungkan guru wali dengan murid binaannya.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <input
          type="file"
          ref="importFileRef"
          accept=".xlsx, .xls, .csv"
          class="hidden"
          @change="handleFileUpload"
        />

        <button
          type="button"
          @click="openLinkModal()"
          class="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          title="Tetapkan kelas dan murid binaan untuk Guru Wali"
        >
          <Link2 class="w-4 h-4" />
          <span>Hubungkan Guru & Murid</span>
        </button>

        <button
          type="button"
          @click="downloadTemplateExcel"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          title="Download format kosong untuk diisi data siswa/guru"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
          <span>Template Excel</span>
        </button>

        <button
          type="button"
          @click="triggerImport"
          class="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          title="Upload file Excel yang sudah diisi"
        >
          <Upload class="w-4 h-4 text-emerald-700" />
          <span>Import Excel</span>
        </button>

        <button
          type="button"
          @click="exportExcel"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          title="Download semua data pengguna saat ini ke Excel"
        >
          <Download class="w-4 h-4 text-brand-700" />
          <span>Export Data</span>
        </button>

        <button
          type="button"
          @click="openAddUserModal"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
        >
          <UserPlus class="w-4 h-4" />
          <span>Tambah Manual</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Toolbar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama, username, NISN, atau NIP..."
          class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-for="r in [{ id: 'all', label: 'Semua' }, { id: 'siswa', label: 'Siswa' }, { id: 'guru_wali', label: 'Guru Wali' }, { id: 'admin', label: 'Admin' }]"
          :key="r.id"
          type="button"
          @click="selectedRole = r.id"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="selectedRole === r.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th class="py-3.5 px-4 w-12">#</th>
              <th class="py-3.5 px-4">Nama Lengkap</th>
              <th class="py-3.5 px-4">Peran (Role)</th>
              <th class="py-3.5 px-4">ID Login</th>
              <th class="py-3.5 px-4">Kelas & Relasi Wali</th>
              <th class="py-3.5 px-4">Kontak</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="(u, idx) in filteredUsers" :key="u.uid" class="hover:bg-slate-50/60 transition">
              <td class="py-3 px-4 font-bold text-slate-400">{{ idx + 1 }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <img :src="u.photoURL" class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                  <div>
                    <span class="font-bold text-slate-900 block">{{ u.displayName }}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{{ u.email || '-' }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border"
                  :class="u.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : u.role === 'guru_wali'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'"
                >
                  {{ u.role === 'admin' ? 'Admin' : u.role === 'guru_wali' ? 'Guru Wali' : 'Peserta Didik' }}
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 font-bold">{{ u.identifier }}</td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800 block">{{ resolveUserClassLabel(u) }}</span>
                <span v-if="u.role === 'siswa'" class="text-[10px] text-slate-500">
                  Wali: {{ getStudentMentorLabel(u) }}
                </span>
                <span v-else-if="u.role === 'guru_wali'" class="text-[10px] text-brand-700 font-semibold">
                  {{ getTeacherMenteeCount(u) }} Siswa Binaan
                </span>
              </td>
              <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">{{ u.phone || '-' }}</td>
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    v-if="u.role === 'guru_wali'"
                    type="button"
                    @click="openLinkModal(u.uid)"
                    class="p-1.5 text-brand-600 hover:text-brand-800 rounded-lg hover:bg-brand-50 transition"
                    title="Atur Murid Binaan"
                  >
                    <Link2 class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    @click="openEditUserModal(u)"
                    class="p-1.5 text-slate-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition"
                    title="Edit Pengguna"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    v-if="u.role !== 'admin'"
                    type="button"
                    @click="handleDeleteUser(u.uid)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus Pengguna"
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

    <!-- Modal Preview Import Excel -->
    <div
      v-if="isImportModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isImportModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet class="w-5 h-5 text-emerald-600" />
              Konfirmasi Impor Data Excel
            </h3>
            <p class="text-xs text-slate-500">
              Ditemukan {{ importedRows.length }} baris data siap ditambahkan ke Firestore.
            </p>
          </div>
          <button type="button" @click="isImportModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th class="p-2.5">#</th>
                <th class="p-2.5">Nama</th>
                <th class="p-2.5">Peran</th>
                <th class="p-2.5">ID Login</th>
                <th class="p-2.5">Kelas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              <tr v-for="(row, idx) in importedRows" :key="idx" class="hover:bg-slate-50/50">
                <td class="p-2.5 text-slate-400 font-bold">{{ idx + 1 }}</td>
                <td class="p-2.5 font-bold text-slate-900">{{ row.displayName }}</td>
                <td class="p-2.5 font-semibold text-brand-700">{{ row.role }}</td>
                <td class="p-2.5 font-mono">{{ row.identifier }}</td>
                <td class="p-2.5">{{ schoolStore.getClassName(row.classId || row.assignedClassId) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="text-xs text-slate-500 font-medium">
            Password awal sesuai kolom Excel (default: <code class="bg-slate-100 px-1 py-0.5 rounded font-mono">123</code>)
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              @click="isImportModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmImport"
              :disabled="isImporting"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ isImporting ? 'Menyimpan...' : 'Simpan ke Firestore' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah / Edit Pengguna -->
    <div
      v-if="isUserModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isUserModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">
            {{ editingUserUid ? 'Edit Data Pengguna' : 'Tambah Akun Pengguna' }}
          </h3>
          <button type="button" @click="isUserModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <ImageUpload
            v-model="userForm.photoURL"
            folder="7kaih/profiles"
            label="Foto Profil Pengguna"
            hint="Opsional, otomatis dikompresi & diunggah ke Cloudinary"
          />

          <div>
            <label class="font-bold text-slate-700 block mb-1">Peran Akun:</label>
            <select
              v-model="userForm.role"
              :disabled="editingUserUid && userForm.role === 'admin'"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl disabled:opacity-60"
            >
              <option value="siswa">Peserta Didik (Siswa)</option>
              <option value="guru_wali">Guru Wali Kelas</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-slate-700 block mb-1">Nama Lengkap:</label>
              <input v-model="userForm.displayName" type="text" placeholder="Contoh: Siti Aisyah" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
            </div>

            <div>
              <label class="font-bold text-slate-700 block mb-1">ID Login (NISN/NIP/Username):</label>
              <input v-model="userForm.identifier" type="text" placeholder="Nomor unik untuk login" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-slate-700 block mb-1">Username:</label>
              <input v-model="userForm.username" type="text" placeholder="Otomatis dari ID Login jika kosong" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
            </div>

            <div>
              <label class="font-bold text-slate-700 block mb-1">Email:</label>
              <input v-model="userForm.email" type="email" placeholder="nama@sekolah.sch.id" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
            </div>
          </div>

          <!-- Fields for Siswa -->
          <template v-if="userForm.role === 'siswa'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Kelas / Rombel:</label>
                <select v-model="userForm.classId" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="">-- Pilih Kelas --</option>
                  <option v-for="c in classesList" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">Guru Wali Pembina:</label>
                <select v-model="userForm.guruWaliId" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="">Otomatis sesuai wali kelas</option>
                  <option value="none">Belum dihubungkan (lepas)</option>
                  <option v-for="t in teachersList" :key="t.uid" :value="t.uid">
                    {{ t.displayName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">NISN:</label>
                <input v-model="userForm.nisn" type="text" placeholder="Sama ID Login jika kosong" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">NIS:</label>
                <input v-model="userForm.nis" type="text" placeholder="Nomor induk siswa" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">Jenis Kelamin:</label>
                <select v-model="userForm.gender" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">No. HP / WA Siswa:</label>
                <input v-model="userForm.phone" type="text" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">No. HP / WA Orang Tua:</label>
                <input v-model="userForm.parentPhone" type="text" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Hobi:</label>
                <input v-model="userForm.hobbies" type="text" placeholder="Contoh: Coding, Futsal" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">Cita-Cita:</label>
                <input v-model="userForm.dreams" type="text" placeholder="Contoh: Software Engineer" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
            </div>

            <div>
              <label class="font-bold text-slate-700 block mb-1">Alamat Rumah:</label>
              <textarea v-model="userForm.address" rows="2" placeholder="Alamat lengkap tempat tinggal" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl resize-none"></textarea>
            </div>
          </template>

          <!-- Fields for Guru Wali -->
          <template v-else-if="userForm.role === 'guru_wali'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Kelas Dampingan (Wali Kelas):</label>
                <select v-model="userForm.assignedClassId" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
                  <option value="">-- Tidak terikat 1 kelas --</option>
                  <option v-for="c in classesList" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">Unit Kerja / Jurusan:</label>
                <input v-model="userForm.unitKerja" type="text" placeholder="Contoh: REKAYASA PERANGKAT LUNAK" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">NIP:</label>
                <input v-model="userForm.nip" type="text" placeholder="Nomor induk pegawai" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">NIK:</label>
                <input v-model="userForm.nik" type="text" placeholder="Nomor induk kependudukan" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Status Kepegawaian:</label>
                <input v-model="userForm.statusKepegawaian" type="text" placeholder="Contoh: PNS / PPPK / Guru Honor" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">No. HP / WA:</label>
                <input v-model="userForm.phone" type="text" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
              </div>
            </div>
          </template>

          <!-- Fields for Admin -->
          <template v-else-if="userForm.role === 'admin'">
            <div>
              <label class="font-bold text-slate-700 block mb-1">No. HP / WA:</label>
              <input v-model="userForm.phone" type="text" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
            </div>
          </template>

          <div>
            <label class="font-bold text-slate-700 block mb-1">
              {{ editingUserUid ? 'Kata Sandi (kosongkan jika tidak diubah):' : 'Password Awal:' }}
            </label>
            <input v-model="userForm.password" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="isUserModalOpen = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Batal
          </button>
          <button
            type="button"
            @click="handleSaveUser"
            :disabled="isSavingUser"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow disabled:opacity-50"
          >
            {{ isSavingUser ? 'Menyimpan...' : editingUserUid ? 'Simpan Perubahan' : 'Simpan Pengguna' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Hubungkan Guru Wali & Murid -->
    <div
      v-if="isLinkModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isLinkModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <Link2 class="w-5 h-5 text-brand-600" />
              Hubungkan Guru Wali & Murid Binaan
            </h3>
            <p class="text-xs text-slate-500">
              Tetapkan kelas dampingan dan pilih daftar siswa asuh yang terhubung ke Guru Wali.
            </p>
          </div>
          <button type="button" @click="isLinkModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="font-bold text-slate-700 block mb-1">1. Pilih Guru Wali:</label>
            <select
              :value="linkTeacherUid"
              @change="loadLinkModalForTeacher($event.target.value)"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option v-for="t in teachersList" :key="t.uid" :value="t.uid">
                {{ t.displayName }} ({{ t.identifier }})
              </option>
            </select>
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">2. Kelas Dampingan Utama:</label>
            <select
              v-model="linkAssignedClassId"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="">-- Tidak terikat kelas (perwalian bebas) --</option>
              <option v-for="c in classesList" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Student Filter & Quick Selection -->
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div class="flex flex-wrap items-center gap-2 flex-1">
            <input
              v-model="linkStudentSearch"
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs flex-1 min-w-[160px]"
            />
            <select v-model="linkClassFilter" class="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
              <option value="all">Semua Kelas</option>
              <option v-for="c in classesList" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              v-if="linkAssignedClassId"
              type="button"
              @click="selectAllStudentsInAssignedClass"
              class="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold transition"
            >
              + Pilih Semua di {{ schoolStore.getClassName(linkAssignedClassId) }}
            </button>
            <button
              type="button"
              @click="clearSelectedLinkStudents"
              class="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
            >
              Kosongkan
            </button>
          </div>
        </div>

        <!-- Students Checklist -->
        <div class="flex-1 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
          <div v-if="filteredLinkStudents.length === 0" class="p-6 text-center text-slate-400">
            Tidak ada siswa yang sesuai filter.
          </div>
          <label
            v-for="s in filteredLinkStudents"
            :key="s.uid"
            class="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer gap-3"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="linkSelectedStudentIds.includes(s.uid)"
                @change="toggleLinkStudent(s.uid)"
                class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span class="font-bold text-slate-900 block">{{ s.displayName }}</span>
                <span class="text-[10px] text-slate-500 font-mono">
                  NISN: {{ s.nisn || s.identifier }} • {{ schoolStore.getClassName(s.classId) }}
                </span>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              Wali saat ini: {{ getStudentMentorLabel(s) }}
            </span>
          </label>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span class="font-bold text-brand-700">
            {{ linkSelectedStudentIds.length }} murid dipilih untuk dibina
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              @click="isLinkModalOpen = false"
              class="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleSaveLinking"
              :disabled="isSavingLink"
              class="px-5 py-2 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow transition disabled:opacity-50"
            >
              {{ isSavingLink ? 'Menyimpan...' : 'Simpan Penugasan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
