<template>
  <div class="HEADER COMPONENT wrapper flex flex-row pl-4 items-center">
    <Logo />
    <h1 class="grow text-2xl font-extralight text-left pl-2 py-3 whitespace-nowrap">Argon's Stabilization Analysis Model</h1>
    <div class="flex flex-row space-x-1 items-center divide-x-2 pr-1">
      <ul class="TOGGLE flex flex-row bg-[#E9EBF1] border border-[#979797] rounded mr-3 w-40 text-center" :class="`${asset}`">
        <li class="w-1/2" @click="setAsset('terra')" :class="{ 'active': asset === 'terra' }">Terra</li>
        <li class="w-1/2" @click="setAsset('argon')" :class="{ 'active': asset === 'argon' }">Argon</li>
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
import { storeToRefs } from 'pinia';
import DownloadIcon from '@/assets/download-icon.svg';
import HelpIcon from '@/assets/help-icon.svg';
import Logo from '@/assets/logo.svg';
import { useBasicStore } from '@/stores/basic';

const basicStore = useBasicStore();
const { asset } = storeToRefs(basicStore);
const { setAsset, toggleHelp } = basicStore;
</script>

<style lang="scss">
  .HEADER.COMPONENT {
    svg path {
      fill: #73179E !important;
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
      &.argon:after {
        left: calc(50%);
      }
    }
  }
</style>

