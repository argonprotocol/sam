<template>
  <div :class="[isLeft ? '' : 'translate-x-1']" class="absolute pointer-events-none" :style="`left: ${left}; top: ${config.top}px; opacity: ${config.opacity}`">
    
    <div Arrow :style="{'--tw-rotate': `${rotationDegree}deg`}" class="relative -translate-y-1/2 -translate-x-1/2 mt-[-0.5px] z-1">
      <svg class="relative z-10" width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="white"/>
      </svg>
      <svg class="absolute z-0 -top-0.5 left-[-1.5px] opacity-20" width="26" height="14" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="black"/>
      </svg>
    </div>

    <div :class="[boxLeftPos]" class="absolute -top-0 text-center translate-y-[-60%] z-0 whitespace-nowrap px-1 py-2 flex flex-col shadow-sm bg-white border border-slate-400/60 rounded">
      <div class="font-bold border-b border-slate-300/60 px-3 pb-1 mb-1">{{ dayjs.utc(item.startingDate).format('MMMM D, YYYY') }}</div>
      <div class="text-slate-400  px-3">{{ formatPrice(currentPrice) }} for ₳1.00</div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { formatPrice } from '../lib/BasicUtils';

dayjs.extend(dayjsUtc);

const props = defineProps<{
  config: {
    top: number,
    opacity: number,
    item: any,
  },
  direction: 'left' | 'right',
}>();


const isLeft = props.direction === 'left';
const rotationDegree = isLeft ? 90 : -90;

const item = Vue.computed(() => props.config.item);
const currentPrice = Vue.computed(() => Math.min(isLeft ? item.value.startingPrice : item.value.endingPrice || 1.00, 1.00));
const left = Vue.computed(() => isLeft ? '-3px' : '100%');

const boxLeftPos = Vue.computed(() => isLeft ? 'right-[119%]' : 'left-[20%]');
</script>
