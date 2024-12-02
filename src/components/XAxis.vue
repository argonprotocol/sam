<template>
  <div class="X-AXIS COMPONENT text-sm text-slate-400 border-t border-slate-300 mx-1" :style="cssVars">
    <ul Dates class="flex flex-row justify-around pt-0.5 text-center whitespace-nowrap h-7 mb-1">
      <li v-if="unitType === 'year'" class="border-slate-300" :style="`min-width: ${unitWidth}%`">&nbsp; 2020 &nbsp;</li>
      <li v-for="length in lengths" :key="length" class="border-l border-slate-300" :style="`width: ${lengthWidth}%`">{{ length }}</li>
    </ul>
    <div class="relative text-center whitespace-nowrap">
      <ul Phases class="flex flex-row pt-0.5 space-x-1 relative z-1">
        <li SegmentBg v-for="phase in phases" :isLoading="phases.length === 1" @mouseenter="phaseMouseEnter(phase, $event)" @mouseleave="phaseMouseLeave(phase, $event)" :style="{ width: `${phase.durationPct * 100}%` }" class="relative uppercase text-white py-1">
          <span class="relative z-1">{{phase.label}}</span>
          <div :style="{ background: phase.bgColorGradient, opacity: loadPct < 100 ? 0.5 : 1 }" class="absolute top-0 left-0 w-full h-full z-0"></div>
        </li>
      </ul>
      <ul Phases v-if="phases.length === 1" :style="`width: ${loadPct}%; mask-image: linear-gradient(to left, transparent 0px, black 30px)`" class="absolute top-0.5 bottom-0 left-0 flex flex-row pt-0.5 space-x-1 z-0 py-1 overflow-hidden">
        <li v-for="phase in phases" :style="{ background: phase.bgColorGradient, width: `${phase.durationPct * 100}%` }" class="h-full">
          <div :style="{ background: phase.bgColorGradient }" class="absolute top-0 left-0 w-full h-full"></div>
        </li>
      </ul>
    </div>
    <SegmentOverlay :config="phaseOverlayConfig" class="absolute z-[1000]" />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import SegmentOverlay from '../overlays/SegmentOverlay.vue';

dayjs.extend(utc);

const props = defineProps<{
  phases: {
    label: {
      type: String,
      required: false,
    },
    firstItem: {
      type: Object,
      required: true,
    },
    lastItem: {
      type: Object,
      required: true,
    },
    bgColor: string | string[];
  }[];
  endingYear: string;
  loadPct: number;
}>();

const emit = defineEmits(['phaseenter', 'phaseleave']);

const phases: Vue.Ref<any[]> = Vue.ref([]);
const loadPct = Vue.ref(props.loadPct);

const phaseOverlayConfig = Vue.ref({
  left: 1000,
  bottom: 10,
  opacity: 0,
  phase: {} as any,
});

function phaseMouseEnter(phase: any, event: MouseEvent) {
  if (phases.value.length === 1 || loadPct.value < 100) return;

  const currentTarget = event.currentTarget as HTMLElement;
  const rect = currentTarget.getBoundingClientRect();
  // phaseOverlayConfig.value.left = rect.left + (rect.width / 2) - 16;
  // phaseOverlayConfig.value.opacity = 1;
  // phaseOverlayConfig.value.phase = phase;
  emit('phaseenter', { left: rect.left, width: rect.width, phase });
}

function phaseMouseLeave(phase: any, event: MouseEvent) {
  // phaseOverlayConfig.value.opacity = 0;
  emit('phaseleave');
}

Vue.watch(() => props.phases, () => {
  if (!props.phases.length) return;

  const veryFirstItem: any = props.phases[0].firstItem;
  const veryLastItem: any = props.phases[props.phases.length - 1].lastItem;
  
  const firstDate = dayjs.utc(veryFirstItem.startingDate);
  const lastDate = dayjs.utc(veryLastItem.startingDate);
  const totalDuration = lastDate.diff(firstDate, 'days');

  phases.value = props.phases.map(s => {
    const firstItem: any = s.firstItem;
    const lastItem: any = s.lastItem;
    const startingDate = dayjs.utc(firstItem.startingDate);
    const endingDate = dayjs.utc(lastItem.startingDate);
    const durationPct = endingDate.diff(startingDate, 'days') / totalDuration;
    const bgColor = Array.isArray(s.bgColor) ? s.bgColor : [s.bgColor, s.bgColor];
    const bgColorGradient = `linear-gradient(to right, ${bgColor[0]} 0%, ${bgColor[1]} 100%)`;
    return {
      ...s,
      durationPct,
      bgColorGradient,
    }
  });
}, { immediate: true });

type IUnitType = 'year' | 'decade';

const endingYear = Number(props.endingYear || '2025') + 1
const years = Array.from({ length: endingYear - 2021 }, (_, index) => 2021 + index);

let unitType: IUnitType = 'year';
let units = 1 + (years.length * 4)

let lengths = [...years];

if (years.length >= 9) {
  lengths.unshift(2020);

  // Convert years into an array of decades
  unitType = 'decade';
  const startDecade = Math.floor(years[0] / 10) * 10;
  const endDecade = Math.floor(years[years.length - 1] / 10) * 10;
  lengths = Array.from(
    { length: (endDecade - startDecade) / 10 + 1 },
    (_, index) => startDecade + index * 10
  );
  units = lengths.length;
}

const unitWidth = 100 / units
const lengthWidth = unitType === 'year' ? unitWidth * 4 : unitWidth;

const cssVars = Vue.computed(() => {
  loadPct.value = props.loadPct;
  const loadDec = (props.loadPct / 100) * 105;

  return {
    '--load-pct-start': `${Math.max(loadDec === 0 ? 0 : loadDec - 5, 0)}%`,
    '--load-pct-end': `${Math.min(loadDec === 0 ? 0 : loadDec + 5, 100)}%`,
  };
});

</script>

<style lang="scss">
.X-AXIS.COMPONENT {
  ul[Dates] li:first-child {
    border-left: none;
  }

  [SegmentBg] {
    cursor: pointer;
    &:hover {
      box-shadow: 1px 1px 0 0 rgba(16, 20, 24, 0.7);
    }
  }

  [SegmentBg][isLoading="true"] {
    cursor: default;
    &:hover {
      box-shadow: none;
    }
  }
}
</style>