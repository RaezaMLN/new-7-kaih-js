import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialMeetings } from '../data/initialData'
import { db } from '../services/firebase'
import { ensureFirestoreReady } from '../services/firestoreBootstrap'
import { doc, getDocs, setDoc, collection, onSnapshot } from 'firebase/firestore'

export const useAttendanceStore = defineStore('attendance', () => {
  const meetings = ref(db ? [] : [...initialMeetings])

  let fetchMeetingsPromise = null
  let unsubscribeMeetings = null

  function getMeeting(meetingId) {
    return meetings.value.find(m => m.id === meetingId) || null
  }

  async function saveMeetingAttendance(meetingId, { records, photoUrl, isHoliday, title }) {
    const idx = meetings.value.findIndex(m => m.id === meetingId)
    if (idx !== -1) {
      const updated = {
        ...meetings.value[idx],
        records: { ...(meetings.value[idx].records || {}), ...records },
        photoUrl: photoUrl !== undefined ? photoUrl : meetings.value[idx].photoUrl,
        isHoliday: isHoliday !== undefined ? isHoliday : meetings.value[idx].isHoliday,
        title: title || meetings.value[idx].title,
        updatedAt: new Date().toISOString()
      }
      meetings.value[idx] = updated

      if (db) {
        await setDoc(doc(db, 'meetings', meetingId), updated, { merge: true })
      }

      return meetings.value[idx]
    }
  }

  function getMeetingsForClass(classId) {
    if (!classId) return meetings.value
    return meetings.value.filter(m => m.classId === classId || (!m.classId && classId === 'xii_rpl_2'))
  }

  async function addMeeting(meetingData) {
    const classMeetings = meetingData.classId ? getMeetingsForClass(meetingData.classId) : meetings.value
    const nextNumber = meetingData.number || classMeetings.length + 1
    const newMeeting = {
      id: 'pertemuan_' + Date.now(),
      classId: meetingData.classId || '',
      number: nextNumber,
      date: meetingData.date || new Date().toISOString().split('T')[0],
      title: meetingData.title || `Pertemuan ${nextNumber}`,
      isHoliday: Boolean(meetingData.isHoliday),
      photoUrl: meetingData.photoUrl || '',
      records: meetingData.records || {}
    }
    meetings.value.push(newMeeting)

    if (db) {
      await setDoc(doc(db, 'meetings', newMeeting.id), newMeeting, { merge: true })
    }

    return newMeeting
  }

  function getStudentAttendanceSummary(studentUid, classId = '') {
    let hadir = 0
    let sakit = 0
    let izin = 0
    let alpa = 0

    const targetMeetings = classId ? getMeetingsForClass(classId) : meetings.value
    targetMeetings.forEach(m => {
      if (m.isHoliday) return
      const status = m.records?.[studentUid] || 'H'
      if (status === 'H') hadir++
      else if (status === 'S') sakit++
      else if (status === 'I') izin++
      else if (status === 'A') alpa++
    })

    const total = hadir + sakit + izin + alpa
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100

    return {
      hadir,
      sakit,
      izin,
      alpa,
      total,
      percentage
    }
  }

  function startMeetingsListener() {
    if (!db || unsubscribeMeetings) return
    unsubscribeMeetings = onSnapshot(
      collection(db, 'meetings'),
      (snap) => {
        const remote = []
        snap.forEach(d => remote.push({ id: d.id, ...d.data() }))
        remote.sort((a, b) => (a.number || 0) - (b.number || 0))
        meetings.value = remote
      },
      (error) => console.warn('Firestore meetings listener error:', error)
    )
  }

  async function fetchMeetingsFromFirestore(force = false) {
    if (!db) return
    if (fetchMeetingsPromise && !force) return fetchMeetingsPromise

    fetchMeetingsPromise = (async () => {
      try {
        await ensureFirestoreReady()
        const snap = await getDocs(collection(db, 'meetings'))
        const remote = []
        snap.forEach(d => remote.push({ id: d.id, ...d.data() }))
        remote.sort((a, b) => (a.number || 0) - (b.number || 0))
        if (remote.length > 0) {
          meetings.value = remote
        }
        startMeetingsListener()
      } catch (e) {
        console.warn('Firestore meetings fetch error:', e)
        if (meetings.value.length === 0) {
          meetings.value = [...initialMeetings]
        }
      } finally {
        fetchMeetingsPromise = null
      }
    })()

    return fetchMeetingsPromise
  }

  fetchMeetingsFromFirestore()

  return {
    meetings,
    getMeeting,
    getMeetingsForClass,
    saveMeetingAttendance,
    addMeeting,
    getStudentAttendanceSummary,
    fetchMeetingsFromFirestore
  }
})
