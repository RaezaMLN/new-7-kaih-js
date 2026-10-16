import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initialUsers } from '../data/initialData'
import { db } from '../services/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  // Load saved session if exists
  const savedUser = localStorage.getItem('7kaih_current_user')
  const currentUser = ref(savedUser ? JSON.parse(savedUser) : null)
  const usersList = ref(
    JSON.parse(localStorage.getItem('7kaih_users_db') || 'null') || initialUsers
  )

  const isAuthenticated = computed(() => !!currentUser.value)
  const userRole = computed(() => currentUser.value?.role || null)
  const isStudent = computed(() => currentUser.value?.role === 'siswa')
  const isTeacher = computed(() => currentUser.value?.role === 'guru_wali')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  // Save users list to localStorage for persistence
  function persistUsers() {
    localStorage.setItem('7kaih_users_db', JSON.stringify(usersList.value))
  }

  // Fetch users from Firestore
  async function fetchUsersFromFirestore() {
    if (!db) return
    try {
      const snap = await getDocs(collection(db, 'users'))
      if (!snap.empty) {
        const remote = []
        snap.forEach(d => remote.push({ uid: d.id, ...d.data() }))
        if (remote.length > 0) {
          usersList.value = remote
          persistUsers()
        }
      }
    } catch (e) {
      console.warn('Firestore users fetch fallback to local:', e)
    }
  }

  // Multi-identifier login: match either identifier, username, NISN, NIP, or NIK
  async function login(identifier, password) {
    const cleanId = String(identifier).trim().toLowerCase()
    const cleanPass = String(password).trim()

    const found = usersList.value.find(u => {
      const matchId = (
        (u.identifier && String(u.identifier).toLowerCase() === cleanId) ||
        (u.username && String(u.username).toLowerCase() === cleanId) ||
        (u.nisn && String(u.nisn).toLowerCase() === cleanId) ||
        (u.nip && String(u.nip).toLowerCase() === cleanId) ||
        (u.nik && String(u.nik).toLowerCase() === cleanId)
      )
      return matchId
    })

    if (!found) {
      throw new Error('Identitas (NISN/NIP/Username) tidak ditemukan dalam sistem.')
    }

    // In demo/production, check password
    if (found.password && found.password !== cleanPass) {
      throw new Error('Kata sandi yang Anda masukkan salah.')
    }

    currentUser.value = { ...found }
    delete currentUser.value.password // Don't keep raw password in session
    localStorage.setItem('7kaih_current_user', JSON.stringify(currentUser.value))
    return currentUser.value
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('7kaih_current_user')
  }

  async function updateProfile(updatedData) {
    if (!currentUser.value) return
    currentUser.value = { ...currentUser.value, ...updatedData }
    localStorage.setItem('7kaih_current_user', JSON.stringify(currentUser.value))

    // Update in usersList
    const idx = usersList.value.findIndex(u => u.uid === currentUser.value.uid)
    if (idx !== -1) {
      usersList.value[idx] = { ...usersList.value[idx], ...updatedData }
      persistUsers()
    }

    // Sync to Firestore
    if (db && currentUser.value.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.value.uid), updatedData, { merge: true })
      } catch (e) {
        console.warn('Firestore update user error:', e)
      }
    }
  }

  async function addUser(user) {
    usersList.value.push(user)
    persistUsers()

    if (db && user.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), user, { merge: true })
      } catch (e) {
        console.warn('Firestore add user error:', e)
      }
    }
  }

  async function deleteUser(uid) {
    usersList.value = usersList.value.filter(u => u.uid !== uid)
    persistUsers()

    if (db && uid) {
      try {
        await deleteDoc(doc(db, 'users', uid))
      } catch (e) {
        console.warn('Firestore delete user error:', e)
      }
    }
  }

  // Initialize
  fetchUsersFromFirestore()

  return {
    currentUser,
    usersList,
    isAuthenticated,
    userRole,
    isStudent,
    isTeacher,
    isAdmin,
    login,
    logout,
    updateProfile,
    addUser,
    deleteUser,
    persistUsers,
    fetchUsersFromFirestore
  }
})
