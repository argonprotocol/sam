<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="absolute top-[32.5%] transform flex flex-col overflow-scroll rounded-lg bg-white px-5 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-2xl">
              <div class="grow">
                <DialogTitle as="h3" class="text-xl font-semibold leading-6 text-gray-900 whitespace-nowrap px-3">Welcome to SAM!</DialogTitle>

                <div class="mt-3 text-left sm:mt-5 border-y border-gray-200 py-4 text-sm text-gray-500 space-y-3 px-3">
                  <p>The Stabilization Analysis Model (SAM) is designed to test Argon against one of the largest crypto collapses in history: the Terra stablecoin. </p>
                    
                  <p>In May of 2022, Terra had a market capitalization of $18.7 billion. Days later it collapsed into a catastrophic death spiral, losing over 99.999% of its value. It never recovered. </p>
                  
                  <p>No stablecoin to-date has shown an ability to survive a Terra-level death-sprial, which makes this Terra collapse the ideal scenario to test Argon's real-world capabilities.</p>
                </div>
              </div>
              <div class="flex justify-end px-3">
                <button type="button" class="rounded-md bg-[#E6EAF3] border border-[#969AA5] px-8 py-2 mt-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-fuchsia-600 hover:border-fuchsia-800 hover:text-white focus:outline-none focus:ring-0" @click="nextStep">Let's Go</button>
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useBasicStore } from '../stores/basic';

const basicStore = useBasicStore();
const { tourStep } = storeToRefs(basicStore);

const open = Vue.ref(true);

function nextStep() {
  tourStep.value += 1;
  open.value = false;
}

</script>