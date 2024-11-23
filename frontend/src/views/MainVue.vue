<template>
  <div class="flex flex-col h-screen grow min-w-[60rem]">
    <Header />
    <Tour v-if="selectedPanel === 'tour'" class="grow" />
    <Runner v-if="selectedPanel === 'runner'" class="grow" />
    <Main v-if="selectedPanel === 'base'" class="grow" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Header from '../components/Header.vue';
import Tour from '../view-panels/Tour.vue';
import Runner from '../view-panels/Runner.vue';
import Main from '../view-panels/Main.vue';
import { useBasicStore } from '../stores/basic';

const basicStore = useBasicStore();
const { selectedPanel } = storeToRefs(basicStore);
</script>
