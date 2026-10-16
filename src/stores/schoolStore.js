import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialSchoolProfile, initialAcademicYears, initialClasses } from '../data/initialData'
import { db } from '../services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const useSchoolStore = defineStore('school', () => {
  const profile = ref(
    JSON.parse(localStorage.getItem('7kaih_school_profile') || 'null') || initialSchoolProfile
  )

  const academicYears = ref(
    JSON.parse(localStorage.getItem('7kaih_academic_years') || 'null') || initialAcademicYears
  )

  const classes = ref(
    JSON.parse(localStorage.getItem('7kaih_classes') || 'null') || initialClasses
  )

  // Fetch live school profile from Firestore
  async function fetchFromFirestore() {
    if (!db) return
    try {
      const docRef = doc(db, 'schools', 'default')
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        profile.value = { ...profile.value, ...docSnap.data() }
        localStorage.setItem('7kaih_school_profile', JSON.stringify(profile.value))
      }
    } catch (e) {
      console.warn('Firestore school fetch fallback to local:', e)
    }
  }

  async function updateProfile(newProfile) {
    profile.value = { ...profile.value, ...newProfile }
    localStorage.setItem('7kaih_school_profile', JSON.stringify(profile.value))

    // Sync to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'schools', 'default'), profile.value, { merge: true })
      } catch (e) {
        console.warn('Firestore update school error:', e)
      }
    }
  }

  function addClass(newClass) {
    classes.value.push(newClass)
    localStorage.setItem('7kaih_classes', JSON.stringify(classes.value))
  }

  function deleteClass(classId) {
    classes.value = classes.value.filter(c => c.id !== classId)
    localStorage.setItem('7kaih_classes', JSON.stringify(classes.value))
  }

  // Initialize
  fetchFromFirestore()

  return {
    profile,
    academicYears,
    classes,
    fetchFromFirestore,
    updateProfile,
    addClass,
    deleteClass
  }
})
