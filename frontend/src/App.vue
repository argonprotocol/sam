<template>
  <div class="flex flex-row min-h-screen w-screen">
    <div class="flex flex-col gap-1.5 h-screen grow">
      <Header />
      <div class="flex flex-row gap-0 grow">
        <Formula class="grow min-w-[60rem]" />
      </div>
    </div>
    <HelpBar class="min-w-72 mr-3 my-3" v-if="isHelpOpen" />
  </div>
  <TableData class="w-full" />
  <Editor />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Header from './components/Header.vue';
import Formula from './components/Formula.vue';
import HelpBar from './components/HelpBar.vue';
import { useBasicStore } from './stores/basic';
import Editor from './components/Editor.vue';
import TableData from './components/TableData.vue';

const basicStore = useBasicStore();
const { isHelpOpen } = storeToRefs(basicStore);

</script>
