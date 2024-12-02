<template>
    <div v-if="isTooNarrow" class="flex flex-col h-screen w-screen select-none justify-center px-20">
    <div class="text-center text-slate-400/80 text-xl pt-4 font-bold" style="text-shadow: 1px 1px 0 rgba(255,255,255,0.8);">
      This tool is best viewed on a larger screen. Please use a desktop or laptop.
    </div>
  </div>
  <div v-else class="flex flex-row min-h-screen w-screen">
    <div class="flex flex-col h-screen grow min-w-[60rem] min-h-[55rem]">
      <Header />
      <Main v-if="isReady" class="grow" />
      <Loading v-else-if="isLoading" class="grow" />
      <Running v-else-if="isRunning" class="grow" />
    </div>
    <WelcomeOverlay />
    <InsightOverlay />
    <TooltipOverlay />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import InsightOverlay from './overlays/InsightOverlay.vue';
import WelcomeOverlay from './overlays/WelcomeOverlay.vue';
import TooltipOverlay from './overlays/TooltipOverlay.vue';
import { storeToRefs } from 'pinia'
import Header from './components/Header.vue';
// import Tour from './panels/Tour.vue';
import Running from './panels/Running.vue';
import Main from './panels/Main.vue';
import Loading from './panels/Loading.vue';
import { useBasicStore } from './store';
import emitter from './emitters/basic';

const basicStore = useBasicStore();
const { isReady, isLoading, isRunning, completedWelcome, tourStep } = storeToRefs(basicStore);

const windowWidth = Vue.ref(window.innerWidth);

Vue.onMounted(() => {
  if (!completedWelcome.value && tourStep.value === 0) {
    emitter.emit('openWelcomeOverlay');
  }

  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
  });
});

const isTooNarrow = Vue.computed(() => windowWidth.value < 1224);

basicStore.loadData();
</script>
