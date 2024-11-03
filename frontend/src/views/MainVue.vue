<template>
  <div class="flex flex-col h-screen grow min-w-[60rem]">
    <Header />
    <Tour v-if="selectedPanel === 'tour'" class="grow" />
    <Runner v-if="selectedPanel === 'runner'" class="grow" />
    <Base v-if="selectedPanel === 'base'" class="grow" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Header from '../components/Header.vue';
import Tour from '../panels/Tour.vue';
import Runner from '../panels/Runner.vue';
import Base from '../panels/Base.vue';
import { useBasicStore } from '../stores/basic';

const basicStore = useBasicStore();
const { selectedPanel } = storeToRefs(basicStore);
</script>
