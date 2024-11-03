<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50" @close="open = false">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="absolute top-[32.5%] min-h-[50%] transform flex flex-col overflow-scroll rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div class="grow">
                <div class="flex flex-row">
                  <DialogTitle as="h3" class="text-xl font-semibold leading-6 text-gray-900 whitespace-nowrap">{{ title }}</DialogTitle>
                  <div class="grow"></div>
                </div>

                <div class="mt-3 text-left sm:mt-5">
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">People will acquire argons when there is guaranteed profit from taxation of between 5% and 10%.</p>
                  </div>
                </div>
              </div>
              <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2" @click="open = false">Save</button>
                <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0" @click="open = false" ref="cancelButtonRef">Cancel</button>
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import emitter from '../emitters/basic';

const open = Vue.ref(false);
const title = Vue.ref('');

type IEditorType = 'speculativeGreed' | 'certaintyGreed' | 'recoveryDuringFall' | 'reservePurchasingPower' | 'taxation' | 'bitcoinVaulting';


const titles: Vue.Ref<Record<IEditorType, string>> = Vue.ref({
  speculativeGreed: 'Edit Speculative Greed',
  certaintyGreed: 'Edit Certainty Greed',
  recoveryDuringFall: 'Edit Recovery During Fall',
  reservePurchasingPower: 'Edit Reserve Purchasing Power',
  taxation: 'Edit Taxation',
  bitcoinVaulting: 'Edit Bitcoin Vaulting',
});

emitter.on('openEditor', (editorType: IEditorType) => {
  open.value = true;
  title.value = titles.value[editorType];
});

</script>