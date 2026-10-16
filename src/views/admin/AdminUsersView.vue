<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import * as XLSX from 'xlsx'
import { 
  Users, 
  Search, 
  UserPlus, 
  Upload, 
  Download, 
  Trash2, 
  KeyRound, 
  CheckCircle, 
  CheckCircle2,
  FileSpreadsheet,
  X,
  AlertCircle
} from 'lucide-vue-next'

const authStore = useAuthStore()

const searchQuery = ref('')
const selectedRole = ref('all')
const isAddModalOpen = ref(false)
const isImportModalOpen = ref(false)
const importFileRef = ref(null)
const importedRows = ref([])
const isImporting = ref(false)

const newUser = ref({
  displayName: '',
  identifier: '',
  nisn: '',
  role: 'siswa',
  classId: 'xii_rpl_2',
  password: '123'
})

const filteredUsers = computed(() => {
  return authStore.usersList.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          u.identifier?.includes(searchQuery.value) ||
                          u.nisn?.includes(searchQuery.value)
    if (!matchesSearch) return false
    if (selectedRole.value !== 'all' && u.role !== selectedRole.value) return false
    return true
  })
})

function handleAddUser() {
  if (!newUser.value.displayName || !newUser.value.identifier) {
    alert('Nama dan Nomor Identitas wajib diisi.')
    return
  }

  const user = {
    ...newUser.value,
    uid: 'usr_' + Date.now(),
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  }

  authStore.addUser(user)
  isAddModalOpen.value = false
  newUser.value = {
    displayName: '',
    identifier: '',
    nisn: '',
    role: 'siswa',
    classId: 'xii_rpl_2',
    password: '123'
  }
  alert('Pengguna berhasil ditambahkan!')
}

function handleDeleteUser(uid) {
  if (confirm('Yakin ingin menghapus pengguna ini?')) {
    authStore.deleteUser(uid)
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
    'Kelas': u.classId || '-',
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
  const templateData = [
    {
      'Nama Lengkap': 'Ahmad Fauzan Pratama',
      'Peran (siswa / guru_wali)': 'siswa',
      'ID Login (NISN/NIP)': '0091234567',
      'Password Default': '123',
      'Kelas (xii_rpl_2)': 'xii_rpl_2',
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
      'Kelas (xii_rpl_2)': 'xii_rpl_2',
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

      // Map rows to system format
      importedRows.value = rawRows.map((r, idx) => ({
        uid: 'import_' + Date.now() + '_' + idx,
        displayName: r['Nama Lengkap'] || r['Nama'] || 'Siswa Baru',
        role: (r['Peran (siswa / guru_wali)'] || r['Peran'] || 'siswa').toLowerCase().includes('guru') ? 'guru_wali' : 'siswa',
        identifier: String(r['ID Login (NISN/NIP)'] || r['NISN'] || r['ID Login'] || ('009' + Date.now().toString().slice(-7) + idx)),
        nisn: String(r['ID Login (NISN/NIP)'] || r['NISN'] || ''),
        password: String(r['Password Default'] || '123'),
        classId: r['Kelas (xii_rpl_2)'] || r['Kelas'] || 'xii_rpl_2',
        gender: r['Jenis Kelamin (L/P)'] || r['Jenis Kelamin'] || 'L',
        phone: String(r['No HP Siswa'] || r['No HP'] || ''),
        parentPhone: String(r['No HP Orang Tua'] || ''),
        address: r['Alamat'] || '',
        dreams: r['Cita-Cita'] || '',
        hobbies: r['Hobi'] || '',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      }))

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
    }
    alert(`Berhasil mengimpor ${importedRows.value.length} data pengguna ke sistem!`)
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Pengguna (Siswa & Guru)
        </h1>
        <p class="text-xs sm:text-sm text-slate-500">
          Kelola data akun peserta didik, guru wali, dan impor/ekspor data Excel secara massal.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Hidden file input for Excel upload -->
        <input 
          type="file" 
          ref="importFileRef" 
          accept=".xlsx, .xls, .csv" 
          class="hidden" 
          @change="handleFileUpload" 
        />

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
          @click="isAddModalOpen = true"
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
          placeholder="Cari nama, username, atau NISN..."
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
              <th class="py-3.5 px-4">Nomor Identitas (Login)</th>
              <th class="py-3.5 px-4">Rombel / Kelas</th>
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
              <td class="py-3 px-4 font-bold text-slate-700">{{ u.classId || '-' }}</td>
              <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">{{ u.phone || '-' }}</td>
              <td class="py-3 px-4 text-right">
                <button 
                  v-if="u.role !== 'admin'"
                  type="button" 
                  @click="handleDeleteUser(u.uid)"
                  class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Hapus Pengguna"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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
              Ditemukan {{ importedRows.length }} baris data siap ditambahkan ke database.
            </p>
          </div>
          <button @click="isImportModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Preview Table -->
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
                <td class="p-2.5">{{ row.classId }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <span class="text-xs text-slate-500 font-medium">
            Password awal akun otomatis diatur: <code class="bg-slate-100 px-1 py-0.5 rounded font-mono">123</code>
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
              <span>{{ isImporting ? 'Menyimpan...' : 'Simpan ke Database' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Manual -->
    <div 
      v-if="isAddModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isAddModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Tambah Akun Pengguna</h3>
          <button @click="isAddModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="font-bold text-slate-700 block mb-1">Peran Akun:</label>
            <select v-model="newUser.role" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
              <option value="siswa">Peserta Didik (Siswa)</option>
              <option value="guru_wali">Guru Wali Kelas</option>
            </select>
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Nama Lengkap:</label>
            <input v-model="newUser.displayName" type="text" placeholder="Contoh: Siti Aisyah" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">NISN / NIP / Username (ID Login):</label>
            <input v-model="newUser.identifier" type="text" placeholder="Nomor unik untuk login" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl" />
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Kelas / Rombel:</label>
            <select v-model="newUser.classId" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl">
              <option value="xii_rpl_2">XII RPL 2</option>
              <option value="xii_rpl_1">XII RPL 1</option>
              <option value="xi_tjkt_1">XI TJKT 1</option>
            </select>
          </div>

          <div>
            <label class="font-bold text-slate-700 block mb-1">Password Default:</label>
            <input v-model="newUser.password" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button @click="isAddModalOpen = false" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Batal
          </button>
          <button @click="handleAddUser" class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow">
            Simpan Pengguna
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
