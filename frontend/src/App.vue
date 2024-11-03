<template>
  <div class="flex flex-row min-h-screen w-screen">
    <RouterView />
    <Insight />
  </div>
</template>

<script setup lang="ts">
import Insight from './overlays/Insight.vue';
</script>
