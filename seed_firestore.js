import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { 
  initialSchoolProfile, 
  initialAcademicYears, 
  initialClasses, 
  initialUsers, 
  initialHabitsDefinition 
} from './src/data/initialData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('serviceAccountKey.json not found!')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

const app = initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore(app)

async function seed() {
  console.log('🚀 Memulai seeding data ke Cloud Firestore proyek: kaih-6ab8c ...')

  // 1. School Profile
  console.log('📝 Menyimpan profil sekolah...')
  await db.collection('schools').doc('default').set(initialSchoolProfile, { merge: true })

  // 2. Academic Years
  console.log('📅 Menyimpan tahun pelajaran...')
  for (const year of initialAcademicYears) {
    await db.collection('academic_years').doc(year.id).set(year, { merge: true })
  }

  // 3. Classes
  console.log('🏫 Menyimpan data rombel / kelas...')
  for (const cls of initialClasses) {
    await db.collection('classes').doc(cls.id).set(cls, { merge: true })
  }

  // 4. Habits Definition
  console.log('🌟 Menyimpan indikator 7 KAIH...')
  for (const h of initialHabitsDefinition) {
    await db.collection('habits_definition').doc(h.id).set(h, { merge: true })
  }

  // 5. Users (Admin, Guru, Siswa)
  console.log('👥 Menyimpan data akun pengguna...')
  for (const u of initialUsers) {
    await db.collection('users').doc(u.uid).set(u, { merge: true })
  }

  // 6. Meetings
  console.log('📋 Menyimpan data presensi pertemuan...')
  const defaultMeetings = [
    {
      id: 'pertemuan_16',
      number: 16,
      date: '2026-08-01',
      title: 'Pertemuan 16 - Pembinaan Kedisiplinan & Literasi',
      isHoliday: false,
      photoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
      records: {}
    },
    {
      id: 'pertemuan_17',
      number: 17,
      date: '2026-08-15',
      title: 'Pertemuan 17 - Diskusi Pembiasaan Ibadah & Gaya Hidup Sehat',
      isHoliday: false,
      photoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
      records: {}
    },
    {
      id: 'pertemuan_18',
      number: 18,
      date: '2026-08-29',
      title: 'Pertemuan 18 - Refleksi Kegiatan Sosial & Berbagi',
      isHoliday: false,
      photoUrl: '',
      records: {}
    },
    {
      id: 'pertemuan_19',
      number: 19,
      date: '2026-09-12',
      title: 'Pertemuan 19 - Evaluasi Progres 7 KAIH Pekan Ini',
      isHoliday: false,
      photoUrl: '',
      records: {}
    }
  ]

  for (const m of defaultMeetings) {
    await db.collection('meetings').doc(m.id).set(m, { merge: true })
  }

  console.log('✅ Seeding Firestore berhasil 100%! Seluruh koleksi siap digunakan.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error saat seeding Firestore:', err)
  process.exit(1)
})
