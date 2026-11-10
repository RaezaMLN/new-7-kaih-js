import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialSchoolProfile, initialAcademicYears, initialClasses } from '../data/initialData'
import { db } from '../services/firebase'
import { ensureFirestoreReady } from '../services/firestoreBootstrap'
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore'

export const useSchoolStore = defineStore('school', () => {
  const profile = ref({ ...initialSchoolProfile })
  const academicYears = ref(db ? [] : [...initialAcademicYears])
  const classes = ref(db ? [] : [...initialClasses])

  let fetchPromise = null
  let listenersStarted = false

  function startListeners() {
    if (!db || listenersStarted) return
    listenersStarted = true

    onSnapshot(
      doc(db, 'schools', 'default'),
      (docSnap) => {
        if (docSnap.exists()) {
          profile.value = { ...profile.value, ...docSnap.data() }
        }
      },
      (error) => console.warn('Firestore school listener error:', error)
    )

    onSnapshot(
      collection(db, 'academic_years'),
      (snap) => {
        const remoteYears = []
        snap.forEach(d => remoteYears.push({ id: d.id, ...d.data() }))
        academicYears.value = remoteYears
      },
      (error) => console.warn('Firestore academic_years listener error:', error)
    )

    onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const remoteClasses = []
        snap.forEach(d => remoteClasses.push({ id: d.id, ...d.data() }))
        classes.value = remoteClasses
      },
      (error) => console.warn('Firestore classes listener error:', error)
    )
  }

  // Fetch live school profile, academic years, and classes from Firestore
  async function fetchFromFirestore(force = false) {
    if (!db) return
    if (fetchPromise && !force) return fetchPromise

    fetchPromise = (async () => {
      try {
        await ensureFirestoreReady()
        const [docSnap, yearsSnap, classesSnap] = await Promise.all([
          getDoc(doc(db, 'schools', 'default')),
          getDocs(collection(db, 'academic_years')),
          getDocs(collection(db, 'classes'))
        ])

        if (docSnap.exists()) {
          profile.value = { ...profile.value, ...docSnap.data() }
        }

        if (!yearsSnap.empty) {
          const remoteYears = []
          yearsSnap.forEach(d => remoteYears.push({ id: d.id, ...d.data() }))
          academicYears.value = remoteYears
        }

        if (!classesSnap.empty) {
          const remoteClasses = []
          classesSnap.forEach(d => remoteClasses.push({ id: d.id, ...d.data() }))
          classes.value = remoteClasses
        }

        startListeners()
      } catch (e) {
        console.warn('Firestore school fetch error:', e)
        if (academicYears.value.length === 0) academicYears.value = [...initialAcademicYears]
        if (classes.value.length === 0) classes.value = [...initialClasses]
      } finally {
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  async function updateProfile(newProfile) {
    profile.value = { ...profile.value, ...newProfile }

    if (db) {
      await setDoc(doc(db, 'schools', 'default'), profile.value, { merge: true })
    }
  }

  function getClassById(classId) {
    if (!classId) return null
    return classes.value.find(c => c.id === classId) || null
  }

  function getClassName(classId) {
    return getClassById(classId)?.name || classId || '-'
  }

  async function addClass(newClass) {
    if (!classes.value.some(c => c.id === newClass.id)) {
      classes.value.push(newClass)
    }

    if (db && newClass?.id) {
      await setDoc(doc(db, 'classes', newClass.id), newClass, { merge: true })
    }
  }

  async function updateClass(classId, updatedData) {
    const idx = classes.value.findIndex(c => c.id === classId)
    if (idx !== -1) {
      classes.value[idx] = { ...classes.value[idx], ...updatedData }
    }

    if (db && classId) {
      await setDoc(doc(db, 'classes', classId), updatedData, { merge: true })
    }
  }

  async function deleteClass(classId) {
    classes.value = classes.value.filter(c => c.id !== classId)

    if (db && classId) {
      await deleteDoc(doc(db, 'classes', classId))
    }
  }

  // Initialize from Firestore
  fetchFromFirestore()

  return {
    profile,
    academicYears,
    classes,
    fetchFromFirestore,
    updateProfile,
    getClassById,
    getClassName,
    addClass,
    updateClass,
    deleteClass
  }
})
