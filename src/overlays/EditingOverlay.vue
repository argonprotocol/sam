<template>
  <TransitionRoot as="template" :show="open">
    <Dialog ref="dialogRef" class="Player Component relative z-[2000]">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="flex min-h-full p-3">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="flex flex-col border border-slate-500 rounded bg-[#f8f9fc] px-2 pb-4 pt-3 text-left shadow-xl shadow-slate-900/30 transition-all w-full select-none overflow-scroll">
              
              <div ref="scoreboardRef" class="flex flex-row mx-1 items-stretch space-x-2 text-slate-500 font-light">
                <div @click="closePlayer()" CloseIcon class="absolute top-2 right-2 cursor-pointer flex flex-row items-center space-x-1 border border-slate-400/70 rounded-full p-2 bg-white hover:bg-slate-300">
                  <CloseIcon class="inline-block w-3 h-3" />
                </div>
              </div>

              <div HorizontalLine Light class="relative left-[6.7%] w-[86.9%] mt-8 -top-1"></div>
              <DialogTitle class="whitespace-nowrap text-xl font-light text-center pt-12 px-3 relative text-slate-600">
                Edit Configuration Properties
              </DialogTitle>

              
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import emitter from '../emitters/basic';
import CloseIcon from '../assets/close.svg';

dayjs.extend(dayjsUtc);

const open = Vue.ref(false);
const dialogRef = Vue.ref<HTMLDialogElement | null>(null);
const scoreboardRef = Vue.ref<HTMLDivElement | null>(null);

function hideInsight() {
  emitter.emit('hideInsight');
}

function closePlayer() {
  open.value = false;
  hideInsight();
}

function handleKeyPress(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === 'Escape') {
    closePlayer();
  }
}

emitter.on('openEditing', () => {
  open.value = true;
});

Vue.onBeforeMount(() => {
  document.addEventListener('keydown', handleKeyPress);
});

Vue.onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});
</script>

<style lang="scss">
.Player.Component {
  [CloseIcon]:hover {
    opacity: 1;
    svg path {
      opacity: 1;
      fill: white;
      stroke: white;
    }
  }
}
</style>
