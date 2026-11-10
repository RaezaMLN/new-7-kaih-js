import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim()
}

const FIREBASE_PLACEHOLDERS = new Set([
  'your_firebase_api_key',
  'your_project_id.firebaseapp.com',
  'your_project_id',
  'your_project_id.firebasestorage.app',
  'your_messaging_sender_id',
  'your_app_id'
])

// Check if valid Firebase configuration is present in .env
export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => Boolean(value) && !FIREBASE_PLACEHOLDERS.has(value)
)

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    console.info('Firebase successfully initialized.')
  } catch (error) {
    console.warn('Firebase initialization error, switching to offline demo mode:', error)
  }
} else {
  console.info('Firebase keys not configured yet in .env. Running with local reactive mock mode.')
}

export { app, auth, db }
