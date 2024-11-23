<template>
  <div HeaderBar class="HEADER COMPONENT flex flex-row pl-4 items-center z-50">
    <a :disabled="selectedPanel==='runner'" Logo href="https://argonprotocol.org" class="block w-8 relative top-[1px]"><Logo /></a>
    <h1 :disabled="selectedPanel==='runner'" class="text-2xl font-extralight relative top-[0.5px] text-left pl-[10px] py-3 whitespace-nowrap text-slate-600">Stabilization Analysis Model</h1>
    <div class="grow"></div>
    <div class="relative">
    </div>
    <div class="grow"></div>
    <div class="flex flex-row space-x-1 items-center divide-x-2 pr-4">
      <ul class="TOGGLE flex flex-row bg-[#E9EBF1] border border-[#b8b9bd] rounded mr-3 text-center text-slate-600" :disabled="selectedPanel !== 'base'">
        <li class="border-r border-slate-400" @click="saveFilter('collapseThenRecover')" :class="{ 'selected': selectedFilter === 'collapseThenRecover' }">
          <span>Argon Mechanisms Enabled After Collapse</span>
        </li>
        <li class="border-r border-slate-400" @click="saveFilter('collapsedForever')" :class="{ 'selected': selectedFilter === 'collapsedForever' }">
          <span>Never Enabled</span>
        </li>
        <li class="" @click="saveFilter('collapsingRecovery')" :class="{ 'selected': selectedFilter === 'collapsingRecovery' }">
          <span>Always Enabled</span>
        </li>
      </ul>
      <div class="px-1">
        <div @click="resetToDefault" class="IconWrapper" @mouseenter="showTooltip($event, 'Reset to Default')" @mouseleave="hideTooltip">
          <ResetOutlined OutlineIcon class="h-[24px]" />
          <ResetSolid SolidIcon class="h-[24px]" />
        </div>
      </div>

      <div class="px-1">
        <div @click="downloadRawData" class="IconWrapper" @mouseenter="showTooltip($event, 'Download')" @mouseleave="hideTooltip">
          <DownloadOutlined OutlineIcon class="h-[24px]" />
          <DownloadSolid SolidIcon class="h-[24px]" />
        </div>
      </div>

      <div class="px-1 cursor-pointer">
        <div @click="openVideoOverlay" class="IconWrapper" @mouseenter="showTooltip($event, 'Watch Video')" @mouseleave="hideTooltip">
          <PlayOutlined OutlineIcon class="w-[24px]" />
          <PlaySolid SolidIcon class="w-[24px]" />
        </div>
      </div>

      <MoreInfoMenu ref="moreInfoMenuRef" />

      <div class="px-1 cursor-pointer">
        <a class="IconWrapper" :disabled="selectedPanel==='runner'" href="https://github.com/argonprotocol/sam" target="_blank">
          <GithubOutlined OutlineIcon class="h-[24px]" @click="" />
          <GithubSolid SolidIcon class="h-[24px]" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router'
import DownloadOutlined from '@/assets/download-outlined.svg';
import DownloadSolid from '@/assets/download-solid.svg';
import GithubOutlined from '@/assets/github-outlined.svg';
import GithubSolid from '@/assets/github-solid.svg';
import Logo from '@/assets/logo.svg';
import ResetOutlined from '@/assets/reset-outlined.svg';
import ResetSolid from '@/assets/reset-solid.svg';
import PlayOutlined from '@/assets/play-outlined.svg';
import PlaySolid from '@/assets/play-solid.svg';
import { useBasicStore } from '@/stores/basic';
import MoreInfoMenu from './MoreInfoMenu.vue';

const basicStore = useBasicStore();
const { saveFilter, switchToPanel } = basicStore;
const { selectedFilter, selectedPanel } = storeToRefs(basicStore);
const router = useRouter();

function resetToDefault() {
  basicStore.resetToDefault();
  window.location.reload();
}

function editConfiguration(close: () => void) {
  router.push('/edit');
  close();
}
</script>

<style lang="scss">
  .HEADER.COMPONENT {
    [disabled='true'] {
      opacity: 0.2;
      pointer-events: none;
    }

    &[HeaderBar] {
      border-bottom: 1px solid #b9bcc4;
      box-shadow: 0 1px 0 0 white;
    }

    [Logo] svg path {
      fill: #73179E !important;
    }
    svg[SolidIcon] path {
      fill: #73179E !important;
    }

    ul.TOGGLE {
      position: relative;
      box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2);
      white-space: nowrap;
      &[disabled='true'] {
        opacity: 0.5;
        pointer-events: none;
        li {
          opacity: 0.5 !important;
        }
      }
      li {
        z-index: 1;
        cursor: pointer;
        padding: 4px 16px;
        transition: opacity 0.3s ease;
        position: relative;
        span {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
        }
      }
      li.selected:after {
        content: '';
        width: calc(100% + 2px);
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
        z-index: 1;
      }
      li:not(.selected) {
        opacity: 0.3;
      }
      li:last-child.selected:after {
        left: -1px;
      }
    }

    .IconWrapper {
      @apply cursor-pointer;
      [SolidIcon] {
        display: none;
      }
      &:hover {
        [OutlineIcon] {
          display: none;
        }
        [SolidIcon] {
          display: block;
        }
      }
    }
  }
</style>

