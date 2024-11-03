<template>
  <div class="X-AXIS COMPONENT text-sm text-slate-400 border-t border-slate-300 mx-1" :style="cssVars">
    <ul Dates class="flex flex-row justify-around pt-0.5 text-center whitespace-nowrap h-7 mb-1">
      <li v-if="unitType === 'year'" class="border-slate-300" :style="`min-width: ${unitWidth}%`">&nbsp; 2020 &nbsp;</li>
      <li v-for="length in lengths" :key="length" class="border-l border-slate-300" :style="`width: ${lengthWidth}%`">{{ length }}</li>
    </ul>
    <ul Phases class="flex flex-row pt-0.5 text-center whitespace-nowrap space-x-1">
      <li SegmentBg v-for="phase in phases" @mouseenter="phaseMouseEnter(phase, $event)" @mouseleave="phaseMouseLeave(phase, $event)" :style="{ background: phase.bgColorGradient, width: `${phase.durationPct * 100}%` }" class="py-1 uppercase cursor-pointer text-white">{{phase.label}}</li>
    </ul>
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
    startingDate: string;
    endingDate: string;
    bgColor: string | string[];
  }[];
  endingYear: string;
  loadPct: number;
  daysToRecover?: number;
}>();

const phases: Vue.Ref<any[]> = Vue.ref([]);

const phaseOverlayConfig = Vue.ref({
  left: 1000,
  bottom: 10,
  opacity: 0,
  phase: {} as any,
});

function phaseMouseEnter(phase: any, event: MouseEvent) {
  if (!phases.value.length) return;
  const currentTarget = event.currentTarget as HTMLElement;
  const rect = currentTarget.getBoundingClientRect();
  phaseOverlayConfig.value.left = rect.left + (rect.width / 2) - 16;
  phaseOverlayConfig.value.opacity = 1;
  phaseOverlayConfig.value.phase = phase;
}

function phaseMouseLeave(phase: any, event: MouseEvent) {
  phaseOverlayConfig.value.opacity = 0;
}

Vue.watch(() => props.phases, () => {
  if (!props.phases.length) return;

  const firstStartingDate = dayjs.utc(props.phases[0].startingDate);
  const lastEndingDate = dayjs.utc(props.phases[props.phases.length - 1].endingDate);
  const totalDuration = lastEndingDate.diff(firstStartingDate, 'days');

  phases.value = props.phases.map(s => {
    const startingDate = dayjs.utc(s.startingDate);
    const endingDate = dayjs.utc(s.endingDate);
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

const phase1Width = unitType === 'year' ? unitWidth * 7 : unitWidth * 0.2;
const phase2Width = 100 - phase1Width;

const replicateLabel = Vue.ref("Replicate Terra's Launch and Collapse");
const attemptLabel = Vue.ref('Attempt to Recover from Collapse');

const cssVars = Vue.computed(() => {
  const loadPct = props.loadPct / 100;
  const phase1Ratio = phase1Width / 100;
  const phase2Ratio = phase2Width / 100;

  let loadPct1 = Math.min(loadPct / phase1Ratio, 1) * 105;
  let loadPct2 = Math.max((loadPct - phase1Ratio) / phase2Ratio, 0) * 105;

  if (loadPct1 >= 105) {
    replicateLabel.value = "Replicated Terra's Launch and Collapse";
  } else if (loadPct1 > 0) {
    replicateLabel.value = "Replicating Terra's Launch and Collapse";
  }

  if (props.daysToRecover) {
    attemptLabel.value = `Recovered Within ${props.daysToRecover} Days`;
  } else if (loadPct2 > 0) {
    attemptLabel.value = "Attempting to Recover from Terra's Collapse";
  }

  return {
    '--load-pct1-start': `${Math.max(loadPct1 === 0 ? 0 : loadPct1 - 5, 0)}%`,
    '--load-pct1-end': `${Math.min(loadPct1 === 0 ? 0 : loadPct1 + 5, 100)}%`,
    '--load-pct2-start': `${Math.max(loadPct2 === 0 ? 0 : loadPct2 - 5, 0)}%`,
    '--load-pct2-end': `${Math.min(loadPct2 === 0 ? 0 : loadPct2 + 5, 100)}%`,
  };
});

</script>

<style lang="scss">
.X-AXIS.COMPONENT {
  ul[Dates] li:first-child {
    border-left: none;
  }

  [SegmentBg]:hover {
    box-shadow: 1px 1px 0 0 rgba(16, 20, 24, 0.7);
  }
}
</style>