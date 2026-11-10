import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initialUsers } from '../data/initialData'
import { db } from '../services/firebase'
import {
  ensureFirestoreReady,
  createFirestoreSession,
  resolveFirestoreSessionUid,
  clearFirestoreSession
} from '../services/firestoreBootstrap'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc
} from 'firebase/firestore'

function sanitizeUser(user) {
  if (!user) return null
  const sanitized = { ...user }
  delete sanitized.password
  return sanitized
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const usersList = ref(db ? [] : [...initialUsers])
  const isAuthReady = ref(!db)

  const isAuthenticated = computed(() => !!currentUser.value)
  const userRole = computed(() => currentUser.value?.role || null)
  const isStudent = computed(() => currentUser.value?.role === 'siswa')
  const isTeacher = computed(() => currentUser.value?.role === 'guru_wali')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  let fetchUsersPromise = null
  let initAuthPromise = null
  let unsubscribeUsers = null

  function syncCurrentUserFromList() {
    if (!currentUser.value?.uid) return
    const latestMe = usersList.value.find(u => u.uid === currentUser.value.uid)
    if (latestMe) {
      currentUser.value = sanitizeUser(latestMe)
    }
  }

  function startUsersListener() {
    if (!db || unsubscribeUsers) return
    unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const remote = []
        snap.forEach(d => remote.push({ uid: d.id, ...d.data() }))
        usersList.value = remote
        syncCurrentUserFromList()
      },
      (error) => {
        console.warn('Firestore users listener error:', error)
      }
    )
  }

  async function fetchUsersFromFirestore(force = false) {
    if (!db) return
    if (fetchUsersPromise && !force) return fetchUsersPromise

    fetchUsersPromise = (async () => {
      try {
        await ensureFirestoreReady()
        const snap = await getDocs(collection(db, 'users'))
        const remote = []
        snap.forEach(d => remote.push({ uid: d.id, ...d.data() }))
        if (remote.length > 0) {
          usersList.value = remote
          syncCurrentUserFromList()
        }
        startUsersListener()
      } catch (e) {
        console.warn('Firestore users fetch error:', e)
        if (usersList.value.length === 0) {
          usersList.value = [...initialUsers]
        }
      } finally {
        fetchUsersPromise = null
      }
    })()

    return fetchUsersPromise
  }

  async function initAuth() {
    if (isAuthReady.value) return
    if (initAuthPromise) return initAuthPromise

    initAuthPromise = (async () => {
      try {
        await fetchUsersFromFirestore()
        const sessionUid = await resolveFirestoreSessionUid()
        if (sessionUid) {
          let matched = usersList.value.find(u => u.uid === sessionUid)
          if (!matched && db) {
            const userSnap = await getDoc(doc(db, 'users', sessionUid))
            if (userSnap.exists()) {
              matched = { uid: userSnap.id, ...userSnap.data() }
            }
          }
          if (matched) {
            currentUser.value = sanitizeUser(matched)
          }
        }
      } catch (e) {
        console.warn('Auth initialization error:', e)
      } finally {
        isAuthReady.value = true
      }
    })()

    return initAuthPromise
  }

  // Multi-identifier login: match either identifier, username, NISN, NIP, or NIK
  async function login(identifier, password) {
    if (db) {
      await fetchUsersFromFirestore()
    }

    const cleanId = String(identifier).trim().toLowerCase()
    const cleanPass = String(password).trim()

    const found = usersList.value.find(u => {
      return (
        (u.identifier && String(u.identifier).toLowerCase() === cleanId) ||
        (u.username && String(u.username).toLowerCase() === cleanId) ||
        (u.nisn && String(u.nisn).toLowerCase() === cleanId) ||
        (u.nip && String(u.nip).toLowerCase() === cleanId) ||
        (u.nik && String(u.nik).toLowerCase() === cleanId)
      )
    })

    if (!found) {
      throw new Error('Identitas (NISN/NIP/Username) tidak ditemukan dalam sistem.')
    }

    if (found.password && found.password !== cleanPass) {
      throw new Error('Kata sandi yang Anda masukkan salah.')
    }

    currentUser.value = sanitizeUser(found)
    await createFirestoreSession(currentUser.value)
    return currentUser.value
  }

  async function logout() {
    currentUser.value = null
    await clearFirestoreSession()
  }

  function ensureUniqueIdentity(excludeUid, data) {
    const checkValues = [data.identifier, data.username]
      .filter(Boolean)
      .map(v => String(v).trim().toLowerCase())

    if (checkValues.length === 0) return

    const conflict = usersList.value.find(u => {
      if (excludeUid && u.uid === excludeUid) return false
      const existing = [u.identifier, u.username]
        .filter(Boolean)
        .map(v => String(v).trim().toLowerCase())
      return checkValues.some(val => existing.includes(val))
    })

    if (conflict) {
      throw new Error(`ID Login / Username sudah digunakan oleh akun ${conflict.displayName}.`)
    }
  }

  async function updateProfile(updatedData) {
    if (!currentUser.value) return
    const targetUid = currentUser.value.uid
    const sanitizedUpdate = sanitizeUser(updatedData)
    ensureUniqueIdentity(targetUid, sanitizedUpdate)

    currentUser.value = { ...currentUser.value, ...sanitizedUpdate }

    const idx = usersList.value.findIndex(u => u.uid === targetUid)
    if (idx !== -1) {
      usersList.value[idx] = { ...usersList.value[idx], ...sanitizedUpdate }
    }

    if (db && targetUid) {
      await setDoc(doc(db, 'users', targetUid), sanitizedUpdate, { merge: true })
    }
  }

  async function changePassword(currentPassword, newPassword) {
    if (!currentUser.value?.uid) {
      throw new Error('Sesi pengguna tidak ditemukan.')
    }
    const targetUid = currentUser.value.uid
    let storedUser = usersList.value.find(u => u.uid === targetUid)

    if (!storedUser && db) {
      const snap = await getDoc(doc(db, 'users', targetUid))
      if (snap.exists()) {
        storedUser = { uid: snap.id, ...snap.data() }
      }
    }

    const cleanCurrent = String(currentPassword || '').trim()
    const cleanNext = String(newPassword || '').trim()

    if (!cleanNext || cleanNext.length < 3) {
      throw new Error('Kata sandi baru minimal 3 karakter.')
    }

    if (storedUser?.password && storedUser.password !== cleanCurrent) {
      throw new Error('Kata sandi saat ini tidak sesuai.')
    }

    await updateUser(targetUid, { password: cleanNext })
  }

  async function addUser(user) {
    ensureUniqueIdentity(user.uid, user)
    if (!usersList.value.some(u => u.uid === user.uid)) {
      usersList.value.push(user)
    }

    if (db && user.uid) {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true })
    }
  }

  async function updateUser(uid, updatedData) {
    if (!uid) return
    ensureUniqueIdentity(uid, updatedData)
    const idx = usersList.value.findIndex(u => u.uid === uid)
    if (idx !== -1) {
      usersList.value[idx] = { ...usersList.value[idx], ...updatedData }
    }

    if (currentUser.value?.uid === uid) {
      currentUser.value = sanitizeUser({ ...currentUser.value, ...updatedData })
    }

    if (db) {
      await setDoc(doc(db, 'users', uid), updatedData, { merge: true })
    }
  }

  async function deleteUser(uid) {
    usersList.value = usersList.value.filter(u => u.uid !== uid)

    if (db && uid) {
      await deleteDoc(doc(db, 'users', uid))
    }
  }

  function matchesTeacherRef(teacher, refId) {
    if (!teacher || !refId) return false
    return refId === teacher.uid || (teacher.identifier && refId === teacher.identifier)
  }

  function getTeacherClasses(teacher, classesList = []) {
    if (!teacher) return []
    return classesList.filter(
      c => matchesTeacherRef(teacher, c.teacherId) || (teacher.assignedClassId && c.id === teacher.assignedClassId)
    )
  }

  function getTeacherForClass(classObj) {
    if (!classObj) return null
    return (
      usersList.value.find(
        u =>
          u.role === 'guru_wali' &&
          (matchesTeacherRef(u, classObj.teacherId) || u.assignedClassId === classObj.id)
      ) || null
    )
  }

  function getTeacherForStudent(student, classesList = []) {
    if (!student) return null
    if (student.guruWaliId === 'none') return null
    if (student.guruWaliId) {
      return (
        usersList.value.find(
          u => u.role === 'guru_wali' && matchesTeacherRef(u, student.guruWaliId)
        ) || null
      )
    }
    const cls = classesList.find(c => c.id === student.classId)
    return getTeacherForClass(cls)
  }

  function getStudentsForTeacher(teacher, classesList = []) {
    if (!teacher) return []
    const teacherClassIds = new Set(getTeacherClasses(teacher, classesList).map(c => c.id))
    if (teacher.assignedClassId) teacherClassIds.add(teacher.assignedClassId)

    return usersList.value.filter(u => {
      if (u.role !== 'siswa') return false
      if (u.guruWaliId === 'none') return false
      if (u.guruWaliId) {
        return matchesTeacherRef(teacher, u.guruWaliId)
      }
      return Boolean(u.classId && teacherClassIds.has(u.classId))
    })
  }

  async function assignTeacherToClass(teacherUid, classId, schoolStore) {
    const teacher = usersList.value.find(u => u.uid === teacherUid)

    // Clear previous teacher from target class if replacing
    if (classId) {
      const otherTeachers = usersList.value.filter(
        u => u.role === 'guru_wali' && u.uid !== teacherUid && u.assignedClassId === classId
      )
      for (const other of otherTeachers) {
        await updateUser(other.uid, { assignedClassId: '' })
      }
    }

    // Clear previous classes pointing to this teacher
    if (teacher) {
      const oldClasses = schoolStore.classes.filter(
        c => c.id !== classId && matchesTeacherRef(teacher, c.teacherId)
      )
      for (const oldCls of oldClasses) {
        await schoolStore.updateClass(oldCls.id, { teacherId: '' })
      }
      await updateUser(teacher.uid, { assignedClassId: classId || '' })
    }

    if (classId) {
      await schoolStore.updateClass(classId, { teacherId: teacherUid || '' })
    }
  }

  async function assignTeacherMentorship({ teacherUid, assignedClassId, selectedStudentIds, schoolStore }) {
    const teacher = usersList.value.find(u => u.uid === teacherUid)
    if (!teacher) return

    await assignTeacherToClass(teacherUid, assignedClassId, schoolStore)

    const selectedSet = new Set(selectedStudentIds)
    const students = usersList.value.filter(u => u.role === 'siswa')

    for (const s of students) {
      const isSelected = selectedSet.has(s.uid)
      const isExplicitlyMine = Boolean(s.guruWaliId && s.guruWaliId !== 'none' && matchesTeacherRef(teacher, s.guruWaliId))
      const isClassDefaultMine = Boolean(!s.guruWaliId && assignedClassId && s.classId === assignedClassId)

      if (isSelected) {
        if (!isExplicitlyMine) {
          await updateUser(s.uid, { guruWaliId: teacherUid })
        }
      } else if (isExplicitlyMine || isClassDefaultMine) {
        await updateUser(s.uid, { guruWaliId: 'none' })
      }
    }
  }

  // Initialize from Firestore
  initAuth()

  return {
    currentUser,
    usersList,
    isAuthReady,
    isAuthenticated,
    userRole,
    isStudent,
    isTeacher,
    isAdmin,
    initAuth,
    login,
    logout,
    updateProfile,
    changePassword,
    addUser,
    updateUser,
    deleteUser,
    getTeacherClasses,
    getTeacherForClass,
    getTeacherForStudent,
    getStudentsForTeacher,
    assignTeacherToClass,
    assignTeacherMentorship,
    fetchUsersFromFirestore
  }
})
