<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50">
      
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="IconWrapper bg-[#F9FAFD] absolute top-2 right-12 mr-[3px] inline-block rounded-full p-2 opacity-50">
          <div IconWrapper>
            <SettingsOutlined OutlineIcon class="h-[24px]" />
          </div>
        </div>
        
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
          <DialogPanel class="absolute top-14 right-5 flex flex-col rounded-lg bg-white px-6 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-md">
            <div class="absolute -top-3 right-7 transform -translate-x-1/2">
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L24 12H0L12 0Z" fill="white"/>
              </svg>
            </div>
            <div class="grow">
              <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900 whitespace-nowrap flex flow-row">
                <div>You Can Customize the Model</div>
                <div class="grow text-right text-slate-400 opacity-70">(Step 1 of 2)</div>
              </DialogTitle>

              <div class="mt-2 py-3 text-left border-y border-gray-200">
                <p class="text-sm text-gray-500">SAM's underlying properties are fully configurable, allowing you to test Argon against an almost infinite number of real-world possibiltiies.</p>
              </div>
            </div>
            <div class="flex justify-end px-3">
              <button type="button" class="rounded-md bg-[#E6EAF3] border border-[#969AA5] px-8 py-1 mt-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-fuchsia-600 hover:border-fuchsia-800 hover:text-white focus:outline-none focus:ring-0" @click="nextStep">Next Step</button>
            </div>
            
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { storeToRefs } from 'pinia';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { useBasicStore } from '../store';
import SettingsOutlined from '@/assets/settings-outlined.svg';

const basicStore = useBasicStore();
const { tourStep } = storeToRefs(basicStore);

const open = Vue.ref(true);

function nextStep() {
  tourStep.value += 1;
  open.value = false;
}
</script>