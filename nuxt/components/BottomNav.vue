<template>
  <nav class="bottom-nav">
    <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
      <div class="icon-wrap">
        <Home :size="20" :stroke-width="route.path === '/' ? 2.5 : 2" />
      </div>
      <span class="nav-label">Home</span>
    </NuxtLink>

    <NuxtLink to="/schedule" class="nav-item" :class="{ active: route.path === '/schedule' }">
      <div class="icon-wrap">
        <Calendar :size="20" :stroke-width="route.path === '/schedule' ? 2.5 : 2" />
      </div>
      <span class="nav-label">Schedule</span>
    </NuxtLink>

    <button type="button" class="nav-item" @click="emit('openPlaceholder', 'Logbook')">
      <div class="icon-wrap">
        <BookOpen :size="20" :stroke-width="2" />
      </div>
      <span class="nav-label">Logbook</span>
    </button>

    <button type="button" class="nav-item" @click="emit('openPlaceholder', 'More Menu')">
      <div class="icon-wrap">
        <MoreHorizontal :size="20" :stroke-width="2" />
      </div>
      <span class="nav-label">More</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { Home, Calendar, BookOpen, MoreHorizontal } from 'lucide-vue-next';

const route = useRoute();
const emit = defineEmits<{
  (e: 'openPlaceholder', title: string): void;
}>();
</script>

<style scoped lang="scss">
$susi-navy: #0E2138;
$susi-red: #E63757;
$susi-gray-500: #6B7280;
$susi-white: #FFFFFF;

.bottom-nav {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: $susi-white;
  border-top: 1px solid rgba(229, 231, 235, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 12px;
  z-index: 50;
  box-shadow: 0 -4px 12px rgba(14, 33, 56, 0.05);

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: none;
    border: none;
    color: $susi-gray-500;
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    .icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 22px;
    }

    &:hover {
      color: $susi-navy;
    }

    &.active {
      color: $susi-red;
      font-weight: 700;

      .icon-wrap {
        transform: translateY(-1px);
      }
    }
  }
}
</style>
