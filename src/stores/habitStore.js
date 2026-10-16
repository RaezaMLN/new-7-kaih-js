import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialHabitsDefinition } from '../data/initialData'
import { db } from '../services/firebase'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'

export const useHabitStore = defineStore('habit', () => {
  const habitsDefinition = ref(initialHabitsDefinition)

  // Map of daily journal records keyed by: `${studentUid}_${dateStr}`
  const journals = ref(
    JSON.parse(localStorage.getItem('7kaih_journals_db') || '{}')
  )

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
    localStorage.setItem('7kaih_journals_db', JSON.stringify(journals.value))

    // Sync to Firestore collection 'daily_journals'
    if (db) {
      try {
        await setDoc(doc(db, 'daily_journals', key), payload, { merge: true })
      } catch (e) {
        console.warn('Firestore save journal error:', e)
      }
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
    localStorage.setItem('7kaih_journals_db', JSON.stringify(journals.value))

    if (db) {
      try {
        await setDoc(doc(db, 'daily_journals', key), journals.value[key], { merge: true })
      } catch (e) {
        console.warn('Firestore save feedback error:', e)
      }
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

  // Fetch journals from Firestore
  async function fetchJournalsFromFirestore() {
    if (!db) return
    try {
      const snap = await getDocs(collection(db, 'daily_journals'))
      if (!snap.empty) {
        const map = { ...journals.value }
        snap.forEach(d => {
          map[d.id] = d.data()
        })
        journals.value = map
        localStorage.setItem('7kaih_journals_db', JSON.stringify(journals.value))
      }
    } catch (e) {
      console.warn('Firestore journals fetch fallback to local:', e)
    }
  }

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
    fetchJournalsFromFirestore
  }
})
