<template>
  <div class="flex flex-row h-screen w-screen">
    <div class="flex flex-col px-3 py-2 gap-1.5 h-screen grow">
      <Header class="GLOBAL-BOX" />
      <div class="flex flex-row gap-0 grow overflow-hidden">
        <Rules class="w-3/12 overflow-auto" />
        <Chart class="grow min-w-[60rem] overflow-auto" />
      </div>
    </div>
    <HelpBar class="min-w-72 mr-3 my-3" v-if="isHelpOpen" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Header from './components/Header.vue';
import Chart from './components/Chart.vue';
import Rules from './components/Rules.vue';
import HelpBar from './components/HelpBar.vue';
import { useBasicStore } from './stores/basic';

const basicStore = useBasicStore();
const { isHelpOpen } = storeToRefs(basicStore);

</script>
