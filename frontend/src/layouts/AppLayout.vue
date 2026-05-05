<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopbar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
