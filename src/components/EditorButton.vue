<template>
<div class="EditorButton Component inline-block" ref="elementRef" >
  <Popover v-if="['number', 'percent'].includes(props.type)" v-slot="{ open: isOpen }" class="relative inline-block">
    <PopoverButton as="div" class="inline-block">
      <div v-if="props.type === 'number'" EditButton :class="{ 'showingOverlay': isOpen }" class="inline-block">
        {{ props.label || addCommas(props.modelValue) }}
      </div>
      <div v-else-if="props.type === 'percent'" EditButton :class="{ 'showingOverlay': isOpen }" class="inline-block">
        {{ props.label || `${props.modelValue}%` }}
      </div>
    </PopoverButton>
    <transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0 -translate-y-10" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-10">
      <PopoverPanel v-slot="{ close }" class="absolute right-0 z-[3000] mt-3 flex w-screen max-w-max">
        <div class="absolute top-0.5 right-4 -translate-x-1/2 -translate-y-full">
          <svg class="relative z-10" width="17" height="11" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L24 12H0L12 0Z" fill="white"/>
          </svg>
          <svg class="absolute z-0 -top-0.5 left-[-0.5px] opacity-[0.05]" width="16" height="10" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L24 12H0L12 0Z" fill="black"/>
          </svg>
        </div>
        <div class="w-screen max-w-[300px] flex-auto overflow-hidden shadow-lg rounded-md bg-white pl-5 pb-4 pt-5 pr-6 text-left ring-1 ring-gray-900/5">

          <div class="grow">
            
            <div v-if="props.id === 'btcVaultCapacityPct'">
              <label for="btcVaultCapacityPct" class="block text-sm/6 font-medium text-gray-900">Capacity of Argon Vaults</label>
              <div class="relative mt-2 rounded-md shadow-sm">
                <input type="text" @keydown="handleKeyPress" v-model="localModel" name="btcVaultCapacityPct" id="btcVaultCapacityPct" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6" />
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="text-gray-500 sm:text-sm" id="price-currency">%</span>
                </div>
              </div>
              <VueSlider v-model="localModel" :min="0" :max="100" :marks="marks" class="mt-3"></VueSlider>
            </div>

            <div v-else-if="props.id === 'btcMaxTxnsPerHour'">
              <label for="btcMaxTxnsPerHour" class="block text-sm/6 font-medium text-gray-900">Max Transactions Per Hour</label>
              <div class="relative mt-2 rounded-md shadow-sm">
                <input type="text" @keydown="handleKeyPress" v-model="localModel" name="btcMaxTxnsPerHour" id="btcMaxTxnsPerHour" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6" />
              </div>
            </div>
            
          </div>
          <div class="mt-10 flex flex-row">
            <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" @click="cancel(close)" ref="cancelButtonRef">Cancel</button>
            <button type="button" class="inline-flex w-full justify-center rounded-md border px-5 py-1.5 text-sm font-semibold shadow-sm text-white border-fuchsia-800 bg-fuchsia-600 hover:bg-fuchsia-500 sm:ml-3 sm:w-auto" @click="save(close)">Save</button>
          </div>

        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</div>
</template>

<script lang="ts" setup>
import * as Vue from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import emitter from '../emitters/basic';
import { addCommas } from '../lib/BasicUtils';
import VueSlider from 'vue-slider-component'

dayjs.extend(utc);

const marks = [0, 20, 40, 60, 80, 100];

const props = defineProps<{
  id: string;
  type: 'number' | 'percent';
  modelValue: string | number;
  label?: string;
}>();

const emit = defineEmits(['showing', 'hiding', 'updated', 'update:modelValue']);

const elementRef = Vue.ref<HTMLElement | null>(null);
const localModel = Vue.ref(props.modelValue);

Vue.watch(() => props.modelValue, (newValue) => {
  localModel.value = newValue;
});

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    localModel.value = Math.max(0, Number(localModel.value) + 1).toString();
  } else if (event.key === 'ArrowDown') {
    localModel.value = Math.max(0, Number(localModel.value) - 1).toString();
  } else if (event.key === 'Enter') {
    save();
  } else if (event.key === 'Escape') {
    // hideOverlay();
  }
}

function save(closeFn: () => void) {
  closeFn();
  hideOverlay({ isSaving: true, value: localModel.value });
}

function cancel(closeFn: () => void) {
  closeFn();
  localModel.value = props.modelValue;
  hideOverlay({});
}

Vue.watch(localModel, (val) => {
  if (['number', 'percent'].includes(props.type)) {
    if (typeof val === 'string') {
      localModel.value = val.replace(/[^0-9.]/g, '');
    }
  }
});

function hideOverlay(data: any) {
  if (data.isSaving) {
    updateModelValue(data.value);
  }
  finishClosing();
}

function showingEditor() {
  elementRef.value?.querySelector(`[type="${props.type}"]`)?.classList.add('showingOverlay');
  emit('showing')
}

function finishClosing() {
  elementRef.value?.querySelector(`[type="${props.type}"]`)?.classList.remove('showingOverlay');
  emit('hiding')
}

function updateModelValue(value: string | number | Dayjs) {
  if (props.type === 'number') {
    value = Number(value);
  }
  emit('update:modelValue', value);
  setTimeout(() => emit('updated', value), 0);
}

Vue.onMounted(() => {
  emitter.on('hideEditorOverlay', (data) => {
    if (data.id !== props.id) return;
    hideOverlay(data);
  });
});

Vue.onBeforeUnmount(() => {
  emitter.off('hideEditorOverlay', hideOverlay);
});

</script>

<style lang="scss">
.EditorButton.Component {
  [EditButton] {
    @apply px-2 mx-0.5 text-sm py-0.5 bg-slate-400/20 hover:bg-slate-200/100 rounded border border-slate-400 font-mono cursor-pointer;
    box-shadow: inset 1px 1px 0 0 rgba(255, 255, 255, 0.75);
    &.showingOverlay {
      @apply bg-slate-400/40 hover:bg-slate-400/40;
      box-shadow: inset 1px 1px 1px 0 rgba(0, 0, 0, 0.15);
    }
  }
}

</style>