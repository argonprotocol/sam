<template>
  <div class="absolute z-50 pointer-events-none transition-all duration-300" :style="`left: ${config.left}px; bottom: ${config.bottom}px; opacity: ${config.opacity}`">
    
    <div Arrow ref="arrowRef" class="relative -translate-x-1/2 -translate-y-full -mt-1 rotate-180 z-1">
      <svg class="relative z-10" width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="white"/>
      </svg>
      <svg class="absolute z-0 -top-0.5 left-[-1.5px] opacity-20" width="26" height="14" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="black"/>
      </svg>
    </div>

    <div :style="`transform: translateX(${boxConfig.translateX}%)`" class="absolute left-0 bottom-[23px] min-h-[500px] w-[500px] text-slate-800 z-0 flex flex-col shadow-lg bg-white border border-slate-400/60 rounded-lg p-5">
      <h2 class="text-lg font-bold mb-2">{{phase.title}} Phase <span class="text-slate-500 font-light">(10/01/2022 - 05/08/2022)</span></h2>
      <p class="font-light">During the seventeen months between October 1, 2020 to May 8th, 2022, Terra went from $0 in cirulatory value to over $18.7B. </p>

      <section class="flex flex-col border-t mt-4 pt-4">
        <h3 class="text-sm font-bold uppercase">Ownership Token Profits</h3>
        <p class="mt-1 mb-3 font-light opacity-70">Profits that accrue to the Ownership Tokens.</p>
        <RangeStat :position="100" value="$19.5B" />
      </section>

      <section class="flex flex-col border-t mt-4 pt-4">
        <h3 class="text-sm font-bold uppercase">Bitcoin Token Profits</h3>
        <p class="mt-1 mb-3 font-light opacity-70">Bitcoin's price volatility allows profits from liquid locking (vaulting).</p>
        <RangeStat :position="20" value="$5.7B" />
      </section>

      <section class="flex flex-col border-t mt-4 pt-4">
        <h3 class="text-sm font-bold uppercase">Argon Value Relative to the Dollar</h3>
        <p class="mt-1 mb-3 font-light opacity-70">Argon is pegged to an inflation index, which this increase represents.</p>
        <RangeStat :position="50" value="100%" />
      </section>

      <section class="flex flex-col border-t mt-4 pt-4">
        <h3 class="text-sm font-bold uppercase">Micropayment Revenue to Sellers</h3>
        <p class="mt-1 mb-3 font-light opacity-70">While Argon is stable sellers using argon earn stable revenue.</p>
        <RangeStat :position="50" value="100%" />
      </section>

      <section class="flex flex-col border-t mt-4 pt-4">
        <h3 class="text-sm font-bold uppercase">Value Adjustment of Peer-to-Peer Taxation</h3>
        <p class="mt-1 mb-3 font-light opacity-70">This represents the change in value of taxation per transaction.</p>
        <RangeStat :position="50" value="0%" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import RangeStat from '../components/RangeStat.vue';
import { addCommas, formatShorthandNumber, formatPrice, formatChangePct } from '../lib/BasicUtils';

dayjs.extend(dayjsUtc);

const props = defineProps<{
  config: any
}>();

const phase = Vue.ref(props.config.phase || {});
const title = Vue.ref('');

Vue.watch(() => props.config.phase, () => {
  phase.value = props.config.phase || {};

  const id = phase.value.id;
  if (id === 'collapse') {
    title.value = 'Collapse';
  } else if (id === 'recovery') {
    title.value = 'Recovery';
  } else if (id === 'collapsingRecovery') {
    title.value = 'Collapsing Recovery';
  } else if (id === 'recovered') {
    title.value = 'Recovered';
  } else if (id === 'dead') {
    title.value = 'Dead';
  } else {
    title.value = phase.value.label || '';
  }
});

const boxConfig = Vue.ref({
  translateX: -50,
});

</script>

<style lang="scss" scoped>
  
</style>