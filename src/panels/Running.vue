<template>
  <div class="flex flex-col w-full">
    <ChartBg />
    <Chart ref="chartRef" :xAxisPhases="xAxisPhases" :isRunning="true" :endingYear="chartEndingYear" :hideTooltip="!!statusText">
      <div StatusText v-if="statusText" :style="`left: ${statusTextPos.left}px; top: ${statusTextPos.top}px`" class="absolute z-20 font-bold text-slate-400 text-2xl -translate-y-1/2">{{statusText}}</div>
      <span StatusText v-else class="absolute left-1/2 top-1/3 z-20 font-bold text-slate-400 text-2xl text-center -translate-x-1/2">CREATING BLOCK #{{addCommas(blockCount)}}</span>
    </Chart>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Chart from '../components/Chart.vue';
import ChartBg from '../components/ChartBg.vue';
import { useBasicStore } from '../store';
import { addCommas } from '../lib/BasicUtils';
import { IMarkerJson } from '../engine/Marker';

dayjs.extend(utc);

const basicStore = useBasicStore();
const { incomingMarkers, isRunning } = storeToRefs(basicStore);

const chartRef = Vue.ref<typeof Chart | null>(null);
const chartEndingYear = Vue.ref(0);

const blockCount = Vue.ref(0);

const statusOptions = {
  1: ['STARTING MODEL...', 'INITIALIZING BLOCKCHAIN NETWORK...', 'LOADING BITCOIN PRICES...', "MODELING TERRA'S HISTORY..."],
}

const xAxisPhases = Vue.ref([
  {
    id: 'running',
    label: "Applying Terra's Historical Data to the Argon",
    bgColor: '#AAB0B7',
    firstItem: {
      startingDate: '2020-10-01',
    },
    lastItem: {
      startingDate: '2025-12-31',
    },
  }
]);

const statusTextPos = Vue.ref({ left: 0, top: 0 });
const statusText = Vue.ref(statusOptions[1][0]);
const currentStatusIndex = Vue.ref(0);

const updateStatusText = () => {
  if (currentStatusIndex.value < statusOptions[1].length) {
    statusText.value = statusOptions[1][currentStatusIndex.value];
    currentStatusIndex.value++;
    
    setTimeout(updateStatusText, 1000);
  } else {
    chartRef.value?.clearPoints();
    chartRef.value?.stopPulsing();
    statusText.value = '';
    loadStartData();
  }
};

async function loadStartData() {
  let markers: any[] = [];

  while (isRunning.value && incomingMarkers.value.length > 0) {
    const marker = incomingMarkers.value.shift() as IMarkerJson;
    const lastMarker = markers[markers.length - 1] || chartRef.value?.getLastItem();

    markers.push(marker);
    blockCount.value += marker?.blockCount || 0;

    const phrasesToDisplay = generateStatusText(marker, lastMarker);
    if (marker.phase === 'collapse' && phrasesToDisplay) {
      await showStatusText(phrasesToDisplay);
    }

    let timeToWait = 1;
    let stepsToJump = Math.max(1, Math.floor(incomingMarkers.value.length / 20));

    console.log('stepsToJump = ', stepsToJump);

    if (lastMarker && Math.abs(lastMarker.endingPrice - marker.endingPrice) > 0.05) {
      timeToWait = 500;
      stepsToJump === markers.length;
    }

    if (phrasesToDisplay || markers.length % stepsToJump === 0) {
      const pointPos = chartRef.value?.addPoints(markers);
      updateStatusTextPos(pointPos);
      markers = [];
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }

    if (marker.phase !== 'collapse' && phrasesToDisplay) {
      await showStatusText(phrasesToDisplay);
    }
  }

  chartEndingYear.value = markers.length ? dayjs.utc(markers[markers.length - 1].endingDate).year() : 2025;

  const pointPos = chartRef.value?.addPoints(markers);
  updateStatusTextPos(pointPos);
  setTimeout(loadStartData, 1); 
}

function generateStatusText(marker: IMarkerJson, lastMarker: IMarkerJson | null) {
  if (!lastMarker) return null;
  if (lastMarker.phase === marker.phase) return null;

  if (marker.phase === 'collapse') {
    return ['TRIGGERING COLLAPSE'];
  } else if (['collapsedForever', 'recovery'].includes(marker.phase)) {
    return ['DEATH-SPIRAL COMPLETE', 'ACTIVATING RESTABILIZATION MECHANISMS'];
  } else if (marker.phase === 'regrowth') {
    return ['RECOVERY COMPLETE'];
  }
  return null;
}

async function showStatusText(phrases: string[]) {
  for (const phrase of phrases) {
    chartRef.value?.startPulsing();
    statusText.value = phrase;
    await new Promise(resolve => setTimeout(resolve, 2_000));
    statusText.value = '';
  }
}

function updateStatusTextPos(pos: { x: number, y: number }) {
  if (!pos) return;
  statusTextPos.value.left = pos.x + 35;
  statusTextPos.value.top = pos.y;
}

Vue.onMounted(() => {
  const pointPos = chartRef.value?.addPoints([{ startingDate: '2020-10-01', endingPrice: 1.00, showPointOnChart: true }]);
  chartRef.value?.startPulsing();
  updateStatusTextPos(pointPos);
  updateStatusText(); // Start the sequence
});
</script>

<style lang="scss" scoped>
[StatusText] {
  animation: textPulse 1s infinite;
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
}
</style>