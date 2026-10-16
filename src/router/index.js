import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { public: true }
  },

  // Student Routes (Lazy Loaded)
  {
    path: '/siswa/dashboard',
    name: 'student-dashboard',
    component: () => import('../views/student/StudentDashboardView.vue'),
    meta: { role: 'siswa' }
  },
  {
    path: '/siswa/jurnal',
    name: 'student-journal',
    component: () => import('../views/student/StudentJournalView.vue'),
    meta: { role: 'siswa' }
  },
  {
    path: '/siswa/riwayat',
    name: 'student-history',
    component: () => import('../views/student/StudentHistoryView.vue'),
    meta: { role: 'siswa' }
  },
  {
    path: '/siswa/profil',
    name: 'student-profile',
    component: () => import('../views/student/StudentProfileView.vue'),
    meta: { role: 'siswa' }
  },

  // Teacher Routes (Lazy Loaded)
  {
    path: '/guru/dashboard',
    name: 'teacher-dashboard',
    component: () => import('../views/teacher/TeacherDashboardView.vue'),
    meta: { role: 'guru_wali' }
  },
  {
    path: '/guru/absensi-murid',
    name: 'teacher-attendance',
    component: () => import('../views/teacher/TeacherAttendanceView.vue'),
    meta: { role: 'guru_wali' }
  },
  {
    path: '/guru/list-murid',
    name: 'teacher-students',
    component: () => import('../views/teacher/TeacherStudentListView.vue'),
    meta: { role: 'guru_wali' }
  },
  {
    path: '/guru/pelaporan',
    name: 'teacher-report',
    component: () => import('../views/teacher/TeacherReportView.vue'),
    meta: { role: 'guru_wali' }
  },

  // Admin Routes (Lazy Loaded)
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('../views/admin/AdminDashboardView.vue'),
    meta: { role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin/AdminUsersView.vue'),
    meta: { role: 'admin' }
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('../views/admin/AdminSettingsView.vue'),
    meta: { role: 'admin' }
  },

  // Catch-all and root redirect
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return '/login'
      if (authStore.isStudent) return '/siswa/dashboard'
      if (authStore.isTeacher) return '/guru/dashboard'
      if (authStore.isAdmin) return '/admin/dashboard'
      return '/login'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    if (authStore.isAuthenticated) {
      if (authStore.isStudent) return next('/siswa/dashboard')
      if (authStore.isTeacher) return next('/guru/dashboard')
      if (authStore.isAdmin) return next('/admin/dashboard')
    }
    return next()
  }

  if (!authStore.isAuthenticated) {
    return next('/login')
  }

  // Check role permission
  if (to.meta.role && authStore.userRole !== to.meta.role) {
    if (authStore.isStudent) return next('/siswa/dashboard')
    if (authStore.isTeacher) return next('/guru/dashboard')
    if (authStore.isAdmin) return next('/admin/dashboard')
    return next('/login')
  }

  next()
})

export default router
