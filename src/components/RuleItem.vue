<template>
  <div ROW v-if="!isEditing" :disabled="isDisabled" ref="rowElem" @mouseenter="hover" @mouseleave="unhover" @mouseover="reposition" @click="edit" :class="{ 'highlight': false }" class="grid grid-cols-subgrid col-span-4 cursor-pointer">
    <div ICON>
      <StartIcon v-if="props.type === 'start'" />
      <CollapseIcon v-if="props.type === 'collapse'" />
      <RecoveryIcon recovery v-if="props.type === 'recovery'" />
      <GreedIcon v-if="props.type === 'greed'" />
    </div>
    <div TITLE><slot name="title" /></div>
    <div>=</div>
    <div><slot name="value" /></div>
  </div>
  <div EDITOR v-if="!isDisabled && isEditing" @mouseenter="hover" @mouseleave="unhover" @mouseover="reposition" isBoth class="grid grid-cols-subgrid col-span-4">
    <div @click="unedit" class="grid grid-cols-subgrid col-span-4 cursor-pointer">
      <div ICON>
        <StartIcon v-if="props.type === 'start'" />
        <CollapseIcon v-if="props.type === 'collapse'" />
        <RecoveryIcon recovery v-if="props.type === 'recovery'" />
        <GreedIcon v-if="props.type === 'greed'" />
      </div>
      <div TITLE class="col-span-2 font-bold">
        <slot name="title" />
      </div>
      <div class="content-center text-right">
        <CloseIcon class="w-3 relative -top-0.5 inline-block mr-3 opacity-30" />
      </div>
    </div>
    <div class="grid grid-cols-subgrid col-span-4 -mt-1.5">
      <div class="ICON"></div>
      <div class="col-span-3 pr-2 pt-3 border-t border-dashed border-slate-300 whitespace-normal leading-6">
        <slot name="editing"></slot>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <div HELP ref="helpElem" class="hidden absolute z-50 bg-white border rounded-md border-[rgba(0,0,0,0.3)] px-3 py-3 w-72 shadow-md">
      <div class="text-sm">
        <slot name="help"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import * as Pinia from 'pinia';
import StartIcon from '@/assets/start-icon.svg';
import CollapseIcon from '@/assets/collapse-icon.svg';
import RecoveryIcon from '@/assets/recovery-icon.svg';
import GreedIcon from '@/assets/greed-icon.svg';
import emitter from '../emitters/basic';
import CloseIcon from '@/assets/close-icon.svg';
import { useBasicStore } from '../store';

const basicStore = useBasicStore();
const { asset } = Pinia.storeToRefs(basicStore);

const props = defineProps({
  type: String,
  isArgon: Boolean,
  isTerra: Boolean,
  isBoth: Boolean,
  isDisabled: Boolean,
});

const isDisabled = Vue.computed(() => {
  if (props.isDisabled || (props.isArgon && asset.value === 'terra')) {
    return true;
  } else if (props.isDisabled || (props.isTerra && asset.value === 'argon')) {
    return true;
  }
  return false;
});

const rowElem = Vue.ref();
const helpElem = Vue.ref();
const isEditing = Vue.ref(false);

function hover(e: any) {
  const elem = e.currentTarget;
  helpElem.value?.classList.remove('hidden');
  positionHelp(elem, helpElem.value as unknown as HTMLElement);
}

function unhover(e: any) {
  helpElem.value?.classList.add('hidden');
}

function positionHelp(elem: Element, helpElem: HTMLElement) {
  const rect = elem.getBoundingClientRect();
  const topPosition = rect.top;
  const rightPosition = rect.right;
  if (helpElem) {
    helpElem.style.top = `${topPosition - 2}px`;
    helpElem.style.left = `${rightPosition + 15}px`;
  }
}

function reposition(e: any) {
  const elem = e.currentTarget;
  positionHelp(elem, helpElem.value as unknown as HTMLElement);
}

function edit(e: any) {
  isEditing.value = true;
  emitter.emit('opened-editor', rowElem.value);
}

function unedit(e: any) {
  console.log('unedit');
  isEditing.value = false;
}

emitter.on('opened-editor', (rowElemOpening: HTMLElement) => {
  if (rowElemOpening !== rowElem.value) {
    isEditing.value = false;
  }
});

</script>

<style scoped lang="scss">
div[ROW] {
  @apply border-b border-slate-300 relative;
  & > div {
    @apply content-center;
  }
  & > div:nth-child(3) {
    padding: 0 5px;
    opacity: 50%;
  }
  & > div:nth-child(4) {
    padding-right: 10px;
    width: 100%;
  }
  &:hover:after {
    content: '';
    width: calc(100% + 12px);
    height: calc(100% + 1px);
    position: absolute;
    border: 2px solid #9428C6;
    border-radius: 5px;
    z-index: 10;
    left: -6px;
    top: -1px;
  }
  &[disabled='true'] {
    opacity: 0.5;
    pointer-events: none;
  }
}
div[EDITOR] {
  @apply border-b border-slate-300 relative pb-5 bg-slate-50;
  &:after {
      content: '';
      width: calc(100% + 12px);
      height: calc(100% + 1px);
      position: absolute;
      border: 2px solid #9428C6;
      border-radius: 5px;
      z-index: 10;
      left: -6px;
      top: -1px;
      opacity: 0.5;
      box-shadow: inset 1px 1px 2px 0 rgba(61, 25, 77, 0.2);
      pointer-events: none;
    }
}
div[ICON] {
  @apply content-center;
  padding-right: 7px;
  height: 50px;
  svg {
    width: 22px;
    display: inline-block;
  }
  svg[recovery] {
    width: 31px;
    margin-left: -4px;
  }
}
div[TITLE] {
  @apply content-center;
}
div[HELP] {
  &:before {
    content: '';
    width: 0;
    height: 0;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
    border-right: 17px solid rgba(0,0,0,0.3);
    position: absolute;
    top: 25px;
    right: 100%;
    transform: translateY(-50%);
  }
  &:after {
    content: '';
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 16px solid white;
    position: absolute;
    top: 25px;
    right: 100%;
    transform: translateY(-50%);
  }
}
</style>

