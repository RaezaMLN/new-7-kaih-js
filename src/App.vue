<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import Navbar from './components/common/Navbar.vue'
import BottomNav from './components/common/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Main Top Navbar (Hidden on Login) -->
    <Navbar v-if="!isLoginPage && authStore.isAuthenticated" />

    <!-- Router View for Page Content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition 
          name="page" 
          mode="out-in"
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Navigation (Hidden on Login) -->
    <BottomNav v-if="!isLoginPage && authStore.isAuthenticated" />
  </div>
</template>

<style>
/* Smooth page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
