<template>
  <div class="flex flex-col h-screen w-full">
    <div class="flex flex-row items-center justify-center w-full h-full grow relative">
      <img src="../assets/formula.png" class="absolute left-[15%] top-[20%] w-[70%] z-1 opacity-70" />
      <div @click="runModel" class="relative -top-[4%] rounded-[100%] bg-[#cad0df] hover:bg-[#B4BBCB] z-1 border border-[#888FA1] w-40 h-40 flex items-center justify-center cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full text-[#E6EAF3]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <div class="absolute h-full left-0 right-0 bottom-0 z-0">
        <ChartBg />
      </div>
    </div>
    <WelcomeOverlay v-if="tourStep === 0" />
    <WelcomeStepOne v-else-if="tourStep === 1" />
    <WelcomeStepTwo v-else-if="tourStep === 2" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
  import WelcomeOverlay from '../overlays/WelcomeOverlay.vue';
  import WelcomeStepOne from '../overlays/WelcomeStepOne.vue';
  import WelcomeStepTwo from '../overlays/WelcomeStepTwo.vue';
  import { useBasicStore } from '../store';
  import ChartBg from '../components/ChartBg.vue';

  const basicStore = useBasicStore();
  const { tourStep } = storeToRefs(basicStore);

  function runModel() {
    // nothing yet
  }
</script>

<style lang="scss" scoped>

</style>