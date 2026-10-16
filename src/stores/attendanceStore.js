import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../services/firebase'
import { doc, getDocs, setDoc, collection } from 'firebase/firestore'

export const useAttendanceStore = defineStore('attendance', () => {
  const defaultMeetings = [
    {
      id: 'pertemuan_16',
      number: 16,
      date: '2026-08-01',
      title: 'Pertemuan 16 - Pembinaan Kedisiplinan & Literasi',
      isHoliday: false,
      photoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
      records: {}
    },
    {
      id: 'pertemuan_17',
      number: 17,
      date: '2026-08-15',
      title: 'Pertemuan 17 - Diskusi Pembiasaan Ibadah & Gaya Hidup Sehat',
      isHoliday: false,
      photoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
      records: {}
    },
    {
      id: 'pertemuan_18',
      number: 18,
      date: '2026-08-29',
      title: 'Pertemuan 18 - Refleksi Kegiatan Sosial & Berbagi',
      isHoliday: false,
      photoUrl: '',
      records: {}
    },
    {
      id: 'pertemuan_19',
      number: 19,
      date: '2026-09-12',
      title: 'Pertemuan 19 - Evaluasi Progres 7 KAIH Pekan Ini',
      isHoliday: false,
      photoUrl: '',
      records: {}
    }
  ]

  const meetings = ref(
    JSON.parse(localStorage.getItem('7kaih_meetings_db') || 'null') || defaultMeetings
  )

  function saveMeetings() {
    localStorage.setItem('7kaih_meetings_db', JSON.stringify(meetings.value))
  }

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
      saveMeetings()

      // Sync to Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'meetings', meetingId), updated, { merge: true })
        } catch (e) {
          console.warn('Firestore save meeting error:', e)
        }
      }

      return meetings.value[idx]
    }
  }

  async function addMeeting(meetingData) {
    const newMeeting = {
      id: 'pertemuan_' + Date.now(),
      number: meetings.value.length + 1,
      date: meetingData.date || new Date().toISOString().split('T')[0],
      title: meetingData.title || `Pertemuan ${meetings.value.length + 1}`,
      isHoliday: Boolean(meetingData.isHoliday),
      photoUrl: meetingData.photoUrl || '',
      records: meetingData.records || {}
    }
    meetings.value.push(newMeeting)
    saveMeetings()

    if (db) {
      try {
        await setDoc(doc(db, 'meetings', newMeeting.id), newMeeting, { merge: true })
      } catch (e) {
        console.warn('Firestore add meeting error:', e)
      }
    }

    return newMeeting
  }

  function getStudentAttendanceSummary(studentUid) {
    let hadir = 0
    let sakit = 0
    let izin = 0
    let alpa = 0

    meetings.value.forEach(m => {
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

  async function fetchMeetingsFromFirestore() {
    if (!db) return
    try {
      const snap = await getDocs(collection(db, 'meetings'))
      if (!snap.empty) {
        const remote = []
        snap.forEach(d => remote.push({ id: d.id, ...d.data() }))
        remote.sort((a, b) => (a.number || 0) - (b.number || 0))
        meetings.value = remote
        saveMeetings()
      }
    } catch (e) {
      console.warn('Firestore meetings fetch fallback to local:', e)
    }
  }

  fetchMeetingsFromFirestore()

  return {
    meetings,
    getMeeting,
    saveMeetingAttendance,
    addMeeting,
    getStudentAttendanceSummary,
    saveMeetings,
    fetchMeetingsFromFirestore
  }
})
