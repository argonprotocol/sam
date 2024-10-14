<template>
  <div HeaderBar class="HEADER COMPONENT fixed z-40 top-0 left-0 right-0 flex flex-row pl-4 items-center">
    <div Logo class="w-8"><Logo /></div>
    <h1 class="text-2xl font-extralight text-left pl-2 py-3 whitespace-nowrap">Stabilization Analysis Model</h1>
    <div class="grow"></div>
    <div class="relative">
    </div>
    <div class="grow"></div>
    <div class="flex flex-row space-x-1 items-center divide-x-2 pr-1">
      <ul class="TOGGLE flex flex-row bg-[#E9EBF1] border border-[#979797] rounded mr-3 w-40 text-center" :class="`${mainPanel}`">
        <li class="w-1/2" @click="setMainPanel('formula')" :class="{ 'active': mainPanel === 'formula' }">Formula</li>
        <li class="w-1/2" @click="setMainPanel('chart')" :class="{ 'active': mainPanel === 'chart' }">Chart</li>
      </ul>
      <div class="px-4 py-2">
        <DownloadIcon class="h-[22px]" />
      </div>
      <div class="px-4 py-2">
        <HelpIcon class="h-[24px]" @click="toggleHelp" />
      </div>
    </div>
  </div>

  <div class="HEADER COMPONENT flex flex-row pl-4 items-center relative z-50 pointer-events-none">
    <div Logo class="w-8 invisible"><Logo /></div>
    <h1 class="invisible text-2xl font-extralight text-left pl-2 py-3 whitespace-nowrap">Stabilization Analysis Model</h1>
    <div class="grow"></div>
    <div class="relative pointer-events-auto">
      <div class="absolute whitespace-nowrap text-center -top-3 left-1/2 -translate-x-1/2 pt-2 z-20">
        <div MenuBoxBg class="absolute top-0 left-0 w-full h-full bg-white border border-slate-300 rounded-md shadow"></div>
        <Listbox as="div" v-model="selected" v-slot="{ open }" class="relative z-20">
          <div class="text-slate-400 text-sm font-light flex flex-row items-center relative -top-1 px-2">
            <div HorizontalLineFadeLeft class="grow h-[1px]"></div>
            <ListboxLabel class="mx-2">SCENARIO</ListboxLabel>
            <div HorizontalLineFadeRight class="grow h-[1px]"></div>
          </div>
          <ListboxButton class="text-3xl font-bold pl-6 pr-12 pb-3 cursor-default block w-full relative">
            <span class="opacity-0 text-right block">{{ open ? options[2].name : selected.name }}</span>
            <span class="absolute top-0 right-12 -mr-1">{{ selected.name }}</span>
            <span class="pointer-events-none absolute right-4 top-2 -mt-0.5 flex items-center">
              <ChevronUpDownIcon class="h-7 w-7 text-gray-300" aria-hidden="true" />
            </span>
          </ListboxButton>
          <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ListboxOption as="template" v-for="option in options" :key="option.id" :value="option" v-slot="{ active, selected }">
                <li :class="[active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-12']">
                  <div class="text-right -mr-1">
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate text-3xl']">
                      {{ option.name }}
                    </span>
                  </div>

                  <span v-if="selected" :class="[active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4']">
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </Listbox>
      </div>
    </div>
    <div class="grow"></div>
    <div class="invisible flex flex-row space-x-1 items-center divide-x-2 pr-1">
      <ul class="TOGGLE flex flex-row bg-[#E9EBF1] border border-[#979797] rounded mr-3 w-40 text-center" :class="`${mainPanel}`">
        <li class="w-1/2" :class="{ 'active': mainPanel === 'formula' }">Formula</li>
        <li class="w-1/2" :class="{ 'active': mainPanel === 'chart' }">Chart</li>
      </ul>
      <div class="px-4 py-2">
        <DownloadIcon class="h-[22px]" />
      </div>
      <div class="px-4 py-2">
        <HelpIcon class="h-[24px]" @click="toggleHelp" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { storeToRefs } from 'pinia';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import DownloadIcon from '@/assets/download-icon.svg';
import HelpIcon from '@/assets/help-icon.svg';
import Logo from '@/assets/logo.svg';
import { useBasicStore } from '@/stores/basic';

const basicStore = useBasicStore();
const { mainPanel } = storeToRefs(basicStore);
const { setMainPanel, scenarioId, setScenarioId, toggleHelp } = basicStore;

const options = [
  { id: 'terra', name: 'Terra Luna' },
  { id: 'argon', name: 'Argon' },
  { id: 'argonForcedCollapse', name: 'Argon Forced Collapse' },
]

const selected = Vue.ref(options.find(o => o.id === scenarioId) || options[0]);

Vue.watch(selected, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    setScenarioId(newValue.id);
  }
});

</script>

<style lang="scss">
  .HEADER.COMPONENT {
    &[HeaderBar] {
      background: #F9FAFD;
      border: 1px solid #b9bcc4;
      box-shadow: 0 0 2px 2px rgba(0,0,0,0.05), inset 2px 2px 0 white;
      border-radius: 2px;
    }

    [Logo] svg path {
      fill: #73179E !important;
    }
    [HorizontalLineFadeLeft] {
      background: linear-gradient(to left, rgba(203, 213, 225, 1) 0%, rgba(203, 213, 225, 1) 50%, rgba(203, 213, 225, 0) 100%);
    }
    [HorizontalLineFadeRight] {
      background: linear-gradient(to right, rgba(203, 213, 225, 1) 0%, rgba(203, 213, 225, 1) 50%, rgba(203, 213, 225, 0) 100%);
    }
    [MenuBoxBg]:after {
      @apply z-10;
      content: '';
      width: calc(100% + 2px);
      height: 50%;
      position: absolute;
      top: -3px;
      left: -1px;
      background: linear-gradient(to bottom, #F9FAFD 0%, #F9FAFD 50%, rgba(249, 250, 253, 0) 100%);
    }
    ul.TOGGLE {
      position: relative;
      box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2);
      li {
        z-index: 1;
        cursor: pointer;
        padding: 4px 0;
        opacity: 0.3;
        transition: opacity 0.3s ease;
      }
      li.active {
        opacity: 1;
      }
      &:after {
        content: '';
        width: calc(50% + 1px);
        height: calc(100% + 2px);
        position: absolute;
        top: -1px;
        left: -1px;
        background: white;
        border-radius: 5px;
        border: 1px solid #979797;
        box-shadow: 0 1px rgba(0,0,0,0.1);
        cursor: default;
        transition: left 0.3s ease;
      }
      &.chart:after {
        left: calc(50%);
      }
    }
  }
</style>

