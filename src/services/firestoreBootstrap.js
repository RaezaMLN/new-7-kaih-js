import { db } from './firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  writeBatch
} from 'firebase/firestore'
import {
  initialAcademicYears,
  initialClasses,
  initialHabitsDefinition,
  initialMeetings,
  initialSchoolProfile,
  initialUsers
} from '../data/initialData'

const SESSION_COOKIE_NAME = '7kaih_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

const LEGACY_KEYS = {
  schoolProfile: '7kaih_school_profile',
  academicYears: '7kaih_academic_years',
  classes: '7kaih_classes',
  users: '7kaih_users_db',
  journals: '7kaih_journals_db',
  meetings: '7kaih_meetings_db',
  currentUser: '7kaih_current_user'
}

let readyPromise = null

function getCookie(name) {
  if (typeof document === 'undefined') return ''
  const prefix = `${name}=`
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : ''
}

function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

function clearCookie(name) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

function readLegacyJson(key) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function seedCollectionIfEmpty(collectionName, items, getId) {
  const existing = await getDocs(query(collection(db, collectionName), limit(1)))
  if (!existing.empty) return

  const batch = writeBatch(db)
  items.forEach((item) => {
    const id = getId(item)
    if (id) {
      batch.set(doc(db, collectionName, id), item, { merge: true })
    }
  })
  await batch.commit()
}

async function migrateMissingCollectionItems(collectionName, items, getId, shouldOverwrite) {
  if (!Array.isArray(items) || items.length === 0) return

  const snap = await getDocs(collection(db, collectionName))
  const remoteMap = new Map()
  snap.forEach((d) => remoteMap.set(d.id, d.data()))

  const batch = writeBatch(db)
  let writes = 0

  items.forEach((item) => {
    const id = getId(item)
    if (!id) return
    const remote = remoteMap.get(id)
    if (!remote || (shouldOverwrite && shouldOverwrite(item, remote))) {
      batch.set(doc(db, collectionName, id), item, { merge: true })
      writes++
    }
  })

  if (writes > 0) {
    await batch.commit()
  }
}

/**
 * One-time migration from legacy browser localStorage keys to Firestore,
 * then clears those localStorage keys so app state lives solely in Firestore.
 */
async function migrateLegacyLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return

  const hasAnyLegacy = Object.values(LEGACY_KEYS).some(
    (key) => window.localStorage.getItem(key) !== null
  )
  if (!hasAnyLegacy) return

  const legacyProfile = readLegacyJson(LEGACY_KEYS.schoolProfile)
  if (legacyProfile && typeof legacyProfile === 'object') {
    const schoolRef = doc(db, 'schools', 'default')
    const schoolSnap = await getDoc(schoolRef)
    if (!schoolSnap.exists()) {
      await setDoc(schoolRef, legacyProfile, { merge: true })
    }
  }

  await migrateMissingCollectionItems(
    'academic_years',
    readLegacyJson(LEGACY_KEYS.academicYears),
    (y) => y?.id
  )

  await migrateMissingCollectionItems(
    'classes',
    readLegacyJson(LEGACY_KEYS.classes),
    (c) => c?.id
  )

  await migrateMissingCollectionItems(
    'users',
    readLegacyJson(LEGACY_KEYS.users),
    (u) => u?.uid
  )

  const legacyJournals = readLegacyJson(LEGACY_KEYS.journals)
  if (legacyJournals && typeof legacyJournals === 'object' && !Array.isArray(legacyJournals)) {
    const entries = Object.entries(legacyJournals).map(([id, data]) => ({ id, ...data }))
    await migrateMissingCollectionItems(
      'daily_journals',
      entries,
      (j) => j.id,
      (local, remote) => Boolean(local.updatedAt && (!remote.updatedAt || local.updatedAt > remote.updatedAt))
    )
  }

  await migrateMissingCollectionItems(
    'meetings',
    readLegacyJson(LEGACY_KEYS.meetings),
    (m) => m?.id,
    (local, remote) => Boolean(local.updatedAt && (!remote.updatedAt || local.updatedAt > remote.updatedAt))
  )

  const legacyCurrentUser = readLegacyJson(LEGACY_KEYS.currentUser)
  if (legacyCurrentUser?.uid && !getCookie(SESSION_COOKIE_NAME)) {
    await createFirestoreSession(legacyCurrentUser)
  }

  Object.values(LEGACY_KEYS).forEach((key) => {
    window.localStorage.removeItem(key)
  })
}

async function ensureInitialDataInFirestore() {
  const schoolRef = doc(db, 'schools', 'default')
  const schoolSnap = await getDoc(schoolRef)
  if (!schoolSnap.exists()) {
    await setDoc(schoolRef, initialSchoolProfile, { merge: true })
  }

  await Promise.all([
    seedCollectionIfEmpty('academic_years', initialAcademicYears, (y) => y.id),
    seedCollectionIfEmpty('classes', initialClasses, (c) => c.id),
    seedCollectionIfEmpty('habits_definition', initialHabitsDefinition, (h) => h.id),
    seedCollectionIfEmpty('users', initialUsers, (u) => u.uid),
    seedCollectionIfEmpty('meetings', initialMeetings, (m) => m.id)
  ])
}

/**
 * Ensures any legacy localStorage data is migrated and empty Firestore collections
 * are initialized once per application boot.
 */
export async function ensureFirestoreReady() {
  if (!db) return
  if (readyPromise) return readyPromise

  readyPromise = (async () => {
    try {
      await migrateLegacyLocalStorage()
      await ensureInitialDataInFirestore()
    } catch (error) {
      console.warn('Firestore bootstrap warning:', error)
    }
  })()

  return readyPromise
}

/**
 * Persists an active login session in Firestore (sessions collection)
 * with only an opaque session ID stored in a cookie (no localStorage).
 */
export async function createFirestoreSession(user) {
  if (!user?.uid) return
  if (!db) {
    setCookie(SESSION_COOKIE_NAME, `uid:${user.uid}`, SESSION_MAX_AGE_SECONDS)
    return
  }

  const sessionId = generateSessionId()
  try {
    await setDoc(doc(db, 'sessions', sessionId), {
      uid: user.uid,
      role: user.role || 'siswa',
      createdAt: new Date().toISOString()
    })
    setCookie(SESSION_COOKIE_NAME, sessionId, SESSION_MAX_AGE_SECONDS)
  } catch (error) {
    console.warn('Firestore session write fallback to uid cookie:', error)
    setCookie(SESSION_COOKIE_NAME, `uid:${user.uid}`, SESSION_MAX_AGE_SECONDS)
  }
}

export async function resolveFirestoreSessionUid() {
  const raw = getCookie(SESSION_COOKIE_NAME)
  if (!raw) return null
  if (raw.startsWith('uid:')) return raw.slice(4)
  if (!db) return null

  try {
    const snap = await getDoc(doc(db, 'sessions', raw))
    if (!snap.exists()) {
      clearCookie(SESSION_COOKIE_NAME)
      return null
    }
    return snap.data()?.uid || null
  } catch (error) {
    console.warn('Firestore session lookup error:', error)
    return null
  }
}

export async function clearFirestoreSession() {
  const raw = getCookie(SESSION_COOKIE_NAME)
  clearCookie(SESSION_COOKIE_NAME)

  if (!db || !raw || raw.startsWith('uid:')) return
  try {
    await deleteDoc(doc(db, 'sessions', raw))
  } catch (error) {
    console.warn('Firestore session delete error:', error)
  }
}
