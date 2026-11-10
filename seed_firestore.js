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
  initialHabitsDefinition,
  initialMeetings
} from './src/data/initialData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    const val = line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
  return env
}

const envVars = loadEnv(path.join(__dirname, '.env'))
const envProjectId = envVars.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('serviceAccountKey.json not found!')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

if (envProjectId && serviceAccount.project_id && envProjectId !== serviceAccount.project_id) {
  console.error(
    `Mismatch project ID: .env VITE_FIREBASE_PROJECT_ID (${envProjectId}) != serviceAccountKey.json (${serviceAccount.project_id})`
  )
  process.exit(1)
}

const targetProjectId = serviceAccount.project_id || envProjectId || 'unknown'

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: targetProjectId
})

const db = getFirestore(app)

const forceOverwrite = process.argv.includes('--force')

async function seedDocIfNeeded(collectionName, id, data) {
  const ref = db.collection(collectionName).doc(id)
  if (!forceOverwrite) {
    const existing = await ref.get()
    if (existing.exists) return false
  }
  await ref.set(data, { merge: true })
  return true
}

async function seedCollection(collectionName, items, getId) {
  let createdCount = 0
  for (const item of items) {
    const written = await seedDocIfNeeded(collectionName, getId(item), item)
    if (written) createdCount++
  }
  return createdCount
}

async function seed() {
  console.log(
    `🚀 Memulai seeding data ke Cloud Firestore proyek: ${targetProjectId} (${forceOverwrite ? 'mode --force' : 'hanya dokumen yang belum ada'})...`
  )

  console.log('📝 Menyimpan profil sekolah...')
  await seedDocIfNeeded('schools', 'default', initialSchoolProfile)

  console.log('📅 Menyimpan tahun pelajaran...')
  await seedCollection('academic_years', initialAcademicYears, (year) => year.id)

  console.log('🏫 Menyimpan data rombel / kelas...')
  await seedCollection('classes', initialClasses, (cls) => cls.id)

  console.log('🌟 Menyimpan indikator 7 KAIH...')
  await seedCollection('habits_definition', initialHabitsDefinition, (h) => h.id)

  console.log('👥 Menyimpan data akun pengguna...')
  await seedCollection('users', initialUsers, (u) => u.uid)

  console.log('📋 Menyimpan data presensi pertemuan...')
  await seedCollection('meetings', initialMeetings, (m) => m.id)

  console.log('✅ Seeding Firestore berhasil 100%! Seluruh koleksi siap digunakan.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Error saat seeding Firestore:', err)
  process.exit(1)
})
