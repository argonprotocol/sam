<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog class="VideoOverlay Component relative z-[2000]">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div @click="close" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            
            <DialogPanel class="relative transform rounded-lg bg-white px-3 pb-3 pt-3 text-left shadow-xl transition-all w-full max-w-5xl">
              <div v-if="!completedWelcome" class="pb-3 border-b border-slate-300">
                <div @click="close()" class="inline-block cursor-pointer text-gray-400 hover:text-fuchsia-600">
                  <ArrowLeftIcon class="inline-block w-4 h-4 relative top-[-1.5px]" /> Back to Welcome
                </div>
              </div>
              <div v-if="completedWelcome" @click="close()" CloseIcon class="absolute -top-2 -right-2 cursor-pointer flex flex-row items-center space-x-1 border border-slate-400/70 rounded-full p-2 bg-white hover:bg-slate-300 z-1">
                <XMarkIcon class="inline-block w-4 h-4" />
              </div>

              <div class="grow relative">
                <div class="LoadingPulse absolute inset-0 flex items-center justify-center text-slate-500/60 text-3xl uppercase">Loading Video...</div>
                <wistia-player media-id="1k1jdinjxd"></wistia-player>
              </div>
            </DialogPanel>

          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>


<script setup lang="ts">
import * as Vue from 'vue'
import { storeToRefs } from 'pinia';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline';
import emitter from '../emitters/basic';
import { useBasicStore } from '../store';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const basicStore = useBasicStore();
const { completedWelcome } = storeToRefs(basicStore);

const isOpen = Vue.ref(false);

function close() {
  isOpen.value = false;
  if (!completedWelcome.value) {
    emitter.emit('openWelcomeOverlay');
  }
}

emitter.on('openVideoOverlay', () => {
  isOpen.value = true;
});

// Load Wistia script dynamically
Vue.onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://fast.wistia.com/player.js';
  script.async = true;
  document.head.appendChild(script);
});

</script>

<style lang="scss">
.VideoOverlay.Component {
  a {
    @apply text-fuchsia-600 hover:text-fuchsia-500 underline decoration-dashed;
    cursor: pointer;
  }

  [CloseIcon]:hover {
    opacity: 1;
    svg path {
      opacity: 1;
      fill: white;
      stroke: white;
    }
  }

  .LoadingPulse {
    opacity: 1;
    animation: fadeInOut 1s linear infinite;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }
}
</style>