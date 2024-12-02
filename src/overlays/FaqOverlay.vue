<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog class="relative z-[2000]">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div @click="close" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div @click="close" class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            
            <DialogPanel class="relative transform rounded-lg bg-white px-5 pb-3 pt-3 text-left shadow-xl transition-all w-full max-w-5xl min-h-[50rem]">
              
              <div v-if="completedWelcome" @click="close()" CloseIcon class="absolute -top-2 -right-2 cursor-pointer flex flex-row items-center space-x-1 border border-slate-400/70 rounded-full p-2 bg-white hover:bg-slate-300 z-1">
                <XMarkIcon class="inline-block w-4 h-4" />
              </div>
              <div v-if="!completedWelcome" class="pb-3 border-b border-slate-300">
                <div @click="close()" class="inline-block cursor-pointer text-gray-400 hover:text-fuchsia-600">
                  <ArrowLeftIcon class="inline-block w-4 h-4 relative top-[-1.5px]" /> Back to Welcome
                </div>
              </div>

              <DialogTitle class="text-3xl font-bold text-center py-3 border-b border-slate-300">Frequently Asked Questions</DialogTitle>

              <div class="flex flex-col divide-y px-6 pt-6 py-4 space-y-4 overflow-y-scroll overflow-x-auto max-h-[72vh]">

                <section class="space-y-3">
                  <h3>What is the purpose of this tool?</h3>
                  <p> </p>
                </section>

                <section class="space-y-3 pt-4">
                  <h3>What is the collapse</h3>
                  <p>In order to fully test Argon's ability to recover from a death spiral, we are (re)creating the largest stablecoin collapse in history.</p>
                  <p>We will disable all Argon stabilization mechanisms and force it to mimic Terra's $18.7 billion implosion. This will cause Argon to lose 99.999% of its value over the next 30 days, ultimately dropping to a rock-bottom low of $0.001 per token. No stablecoin has ever recovered from this level of loss.</p>

                  <p>Argon's Terra-like collapse is finished. Nearly $18,700,000,000 (that's billions) in capital has been erased from the markets, and the asset is sitting at $0.001 per argon.</p>

                  <p>Less than {{ props.daysToRecover < 7 ? 'a' : props.daysToRecover }} {{ props.daysToRecover < 7 ? 'week has' : 'days have' }} elapsed since Argon's stabilization mechanisms were reactivated. Its price has now recovered to its original value, plus any additional value required to match the rise of inflation.</p>

                </section>
              </div>
              
            </DialogPanel>

          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>


<script setup lang="ts">
import * as Vue from 'vue';
import { storeToRefs } from 'pinia';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import emitter from '../emitters/basic';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { useBasicStore } from '../store';

const basicStore = useBasicStore();
const { completedWelcome } = storeToRefs(basicStore);

const isOpen = Vue.ref(false);

function close() {
  isOpen.value = false;
  if (!completedWelcome.value) {
    emitter.emit('openWelcomeOverlay');
  }
}

emitter.on('openFaqOverlay', () => {
  isOpen.value = true;
});

</script>

<style lang="scss" scoped>
section h3 {
  @apply text-lg font-semibold;
}

a {
  @apply text-slate-600 hover:text-fuchsia-500;
  cursor: pointer;
  &[disabled] {
    @apply pointer-events-none;
    div {
      @apply opacity-30;  
    }
  }
}

[CloseIcon]:hover {
    opacity: 1;
    svg path {
      opacity: 1;
      fill: white;
      stroke: white;
    }
  }
</style>