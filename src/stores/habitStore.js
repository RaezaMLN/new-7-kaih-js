import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialHabitsDefinition } from '../data/initialData'
import { db } from '../services/firebase'
import { ensureFirestoreReady } from '../services/firestoreBootstrap'
import { doc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore'

export const useHabitStore = defineStore('habit', () => {
  const habitsDefinition = ref([...initialHabitsDefinition])
  const journals = ref({})

  let fetchJournalsPromise = null
  let fetchHabitsPromise = null
  let unsubscribeHabits = null
  let unsubscribeJournals = null

  function getTodayString() {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function getJournal(studentUid, date = getTodayString()) {
    const key = `${studentUid}_${date}`
    return journals.value[key] || null
  }

  async function saveJournal(studentUid, date, journalData) {
    const key = `${studentUid}_${date}`
    const existing = journals.value[key] || {}

    const payload = {
      ...existing,
      ...journalData,
      studentUid,
      date,
      updatedAt: new Date().toISOString()
    }

    journals.value[key] = payload

    if (db) {
      await setDoc(doc(db, 'daily_journals', key), payload, { merge: true })
    }

    return journals.value[key]
  }

  async function addTeacherFeedback(studentUid, date, feedbackText, sticker = '⭐') {
    const key = `${studentUid}_${date}`
    if (!journals.value[key]) {
      journals.value[key] = {
        studentUid,
        date,
        habits: {},
        updatedAt: new Date().toISOString()
      }
    }
    journals.value[key].teacherFeedback = feedbackText
    journals.value[key].teacherSticker = sticker
    journals.value[key].feedbackTime = new Date().toISOString()
    journals.value[key].updatedAt = new Date().toISOString()

    if (db) {
      await setDoc(doc(db, 'daily_journals', key), journals.value[key], { merge: true })
    }
  }

  function getCompletionRate(studentUid, date = getTodayString()) {
    const journal = getJournal(studentUid, date)
    if (!journal || !journal.habits) return 0
    let completed = 0
    habitsDefinition.value.forEach(h => {
      if (journal.habits[h.id]?.checked) {
        completed++
      }
    })
    return Math.round((completed / 7) * 100)
  }

  function getStudentMonthlyStats(studentUid, yearMonth = '2026-09') {
    const daysInMonth = 30
    const habitStats = {}

    habitsDefinition.value.forEach(h => {
      habitStats[h.id] = {
        title: h.title,
        completedDays: 0,
        totalDays: daysInMonth,
        percentage: 0,
        predicate: 'Cukup'
      }
    })

    Object.keys(journals.value).forEach(key => {
      if (key.startsWith(`${studentUid}_${yearMonth}`)) {
        const j = journals.value[key]
        if (j.habits) {
          habitsDefinition.value.forEach(h => {
            if (j.habits[h.id]?.checked) {
              habitStats[h.id].completedDays++
            }
          })
        }
      }
    })

    habitsDefinition.value.forEach(h => {
      const item = habitStats[h.id]
      item.percentage = Math.round((item.completedDays / daysInMonth) * 100)
      if (item.percentage >= 85) {
        item.predicate = 'Sangat Baik'
      } else if (item.percentage >= 70) {
        item.predicate = 'Baik'
      } else if (item.percentage >= 50) {
        item.predicate = 'Cukup'
      } else {
        item.predicate = 'Perlu Bimbingan'
      }
    })

    return habitStats
  }

  function startHabitsListener() {
    if (!db || unsubscribeHabits) return
    unsubscribeHabits = onSnapshot(
      collection(db, 'habits_definition'),
      (snap) => {
        if (snap.empty) return
        const remote = []
        snap.forEach(d => remote.push({ id: d.id, ...d.data() }))
        remote.sort((a, b) => (a.number || 0) - (b.number || 0))
        habitsDefinition.value = remote
      },
      (error) => console.warn('Firestore habits_definition listener error:', error)
    )
  }

  function startJournalsListener() {
    if (!db || unsubscribeJournals) return
    unsubscribeJournals = onSnapshot(
      collection(db, 'daily_journals'),
      (snap) => {
        const map = {}
        snap.forEach(d => {
          map[d.id] = d.data()
        })
        journals.value = map
      },
      (error) => console.warn('Firestore daily_journals listener error:', error)
    )
  }

  async function fetchHabitsDefinitionFromFirestore(force = false) {
    if (!db) return
    if (fetchHabitsPromise && !force) return fetchHabitsPromise

    fetchHabitsPromise = (async () => {
      try {
        await ensureFirestoreReady()
        const snap = await getDocs(collection(db, 'habits_definition'))
        if (!snap.empty) {
          const remote = []
          snap.forEach(d => remote.push({ id: d.id, ...d.data() }))
          remote.sort((a, b) => (a.number || 0) - (b.number || 0))
          habitsDefinition.value = remote
        }
        startHabitsListener()
      } catch (e) {
        console.warn('Firestore habits definition fetch error:', e)
      } finally {
        fetchHabitsPromise = null
      }
    })()

    return fetchHabitsPromise
  }

  async function fetchJournalsFromFirestore(force = false) {
    if (!db) return
    if (fetchJournalsPromise && !force) return fetchJournalsPromise

    fetchJournalsPromise = (async () => {
      try {
        await ensureFirestoreReady()
        const snap = await getDocs(collection(db, 'daily_journals'))
        const map = {}
        snap.forEach(d => {
          map[d.id] = d.data()
        })
        journals.value = map
        startJournalsListener()
      } catch (e) {
        console.warn('Firestore journals fetch error:', e)
      } finally {
        fetchJournalsPromise = null
      }
    })()

    return fetchJournalsPromise
  }

  fetchHabitsDefinitionFromFirestore()
  fetchJournalsFromFirestore()

  return {
    habitsDefinition,
    journals,
    getTodayString,
    getJournal,
    saveJournal,
    addTeacherFeedback,
    getCompletionRate,
    getStudentMonthlyStats,
    fetchHabitsDefinitionFromFirestore,
    fetchJournalsFromFirestore
  }
})
