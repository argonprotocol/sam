<template>
  <div class="X-AXIS COMPONENT text-sm text-slate-400 border-t border-slate-300 mx-1" :style="cssVars">
    <ul Dates class="flex flex-row justify-around pt-0.5 text-center whitespace-nowrap h-7 mb-1">
      <li v-if="unitType === 'year'" class="border-slate-300" :style="`min-width: ${unitWidth}%`">&nbsp; 2020 &nbsp;</li>
      <li v-for="length in lengths" :key="length" class="border-l border-slate-300" :style="`width: ${lengthWidth}%`">{{ length }}</li>
    </ul>
    <div class="relative text-center whitespace-nowrap">
      <ul Phases class="flex flex-row pt-0.5 relative z-1 h-9">
        <li SegmentBg v-for="(phase, index) in phases" :isLoading="phases.length === 1" @mouseenter="phaseMouseEnter(phase, $event)" @mouseleave="phaseMouseLeave(phase, $event)" @click="phaseClick(phase, $event)" :style="{ left: leftPos(index, phase), width: widthPos(index, phase) }" class="absolute h-7 uppercase text-white top-1 pt-1">
          <span v-if="phase.durationPct > 0.2" class="relative z-1">{{phase.label}}</span>
          <div :style="{ background: phase.bgColorGradient, opacity: loadPct < 100 ? 0.5 : 1 }" class="absolute top-0 left-0 w-full h-full z-0"></div>
          <div HoverBg v-if="loadPct === 100" :style="{ background: phase.bgColorGradient, maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)` }" class="absolute bottom-full left-0 w-full h-full z-0 opacity-0 translate-y-[-2px]"></div>
        </li>
      </ul>
      <ul Phases v-if="phases.length === 1" :style="`width: ${loadPct}%; mask-image: linear-gradient(to left, transparent 0px, black 30px)`" class="absolute top-1.5 h-7 left-0 flex flex-row pt-0.5 z-0 overflow-hidden">
        <li v-for="(phase, index) in phases" :style="{ background: phase.bgColorGradient, left: leftPos(index, phase), width: widthPos(index, phase) }" class="h-full">
          <div :style="{ background: phase.bgColorGradient }" class="absolute top-0 left-0 w-full h-full"></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

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
  endingYear: number;
  loadPct: number;
  getPointPosition: (index: number) => { x: number, y: number };
}>();

const emit = defineEmits(['phaseenter', 'phaseleave', 'phaseclick']);

const phases: Vue.Ref<any[]> = Vue.ref([]);
const loadPct = Vue.ref(props.loadPct);

function phaseMouseEnter(phase: any, event: MouseEvent) {
  if (phases.value.length === 1 || loadPct.value < 100) return;
  (event as any).phase = phase;
  emit('phaseenter', event);
}

function phaseMouseLeave(phase: any, event: MouseEvent) {
  (event as any).phase = phase;
  emit('phaseleave', event);
}

function phaseClick(phase: any, event: MouseEvent) {
  (event as any).phase = phase;
  emit('phaseclick', event);
}

function leftPos(index: number, phase: any) {
  const isFirstIndex = index === 0;
  const firstPos = props.getPointPosition(phase.firstItem.idx);
  
  let firstX = firstPos.x - 24.81764;
  if (!isFirstIndex) firstX += 2;
  
  return `${firstX}px`;
}

function widthPos(index: number, phase: any) {
  const isLastIndex = index === props.phases.length - 1;

  const firstPos = props.getPointPosition(phase.firstItem.idx);
  const firstX = firstPos.x - 24.81764;

  const lastPos = props.getPointPosition(phase.lastItem.idx);
  let lastX = lastPos.x - 24.81764;

  if (isLastIndex) {
    lastX += 16.81764;
  } else {
    lastX -= 2;
  }

  return `${lastX - firstX}px`;
}

Vue.watch(() => props.phases, () => {
  if (!props.phases.length) return;

  const veryFirstItem: any = props.phases[0].firstItem;
  const veryLastItem: any = props.phases[props.phases.length - 1].lastItem;
  
  if (!veryLastItem) {
    console.log('props.phases', props.phases);
  }

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

const unitType: Vue.Ref<IUnitType> = Vue.ref('year');
const lengthWidth: Vue.Ref<number> = Vue.ref(0);
const unitWidth: Vue.Ref<number> = Vue.ref(0);
const lengths: Vue.Ref<number[]> = Vue.ref([2021, 2022, 2023, 2024, 2025]);

Vue.watch(() => props.endingYear, () => {
  const endingYear = Number(props.endingYear || 2025) + 1
  const years = Array.from({ length: endingYear - 2021 }, (_, index) => 2021 + index);

  let units = 1 + (years.length * 4)

  lengths.value = [...years];

  if (years.length >= 9) {
    lengths.value.unshift(2020);

    // Convert years into an array of decades
    unitType.value = 'decade';
    const startDecade = Math.floor(years[0] / 10) * 10;
    const endDecade = Math.floor(years[years.length - 1] / 10) * 10;
    lengths.value = Array.from(
      { length: (endDecade - startDecade) / 10 + 1 },
      (_, index) => startDecade + index * 10
    );
    units = lengths.value.length;
  }

  unitWidth.value = 100 / units
  lengthWidth.value = unitType.value === 'year' ? unitWidth.value * 4 : unitWidth.value;
}, { immediate: true });

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
    &:hover [HoverBg] {
      opacity: 0.3;
    }
  }

  [SegmentBg][isLoading="true"] {
    cursor: default;
    &:hover [HoverBg] {
      opacity: 0;
    }
  }
}
</style>