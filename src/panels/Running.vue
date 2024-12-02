<template>
  <div class="flex flex-col w-full">
    <ChartBg />
    <Chart ref="chartRef" :xAxisPhases="xAxisPhases" :isRunning="true">
      <div StatusText v-if="statusText" :style="`left: ${statusTextPos.left}px; top: ${statusTextPos.top}px`" class="absolute z-20 font-bold text-slate-400 text-2xl">{{statusText}}</div>
    </Chart>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { storeToRefs } from 'pinia';
import Chart from '../components/Chart.vue';
import ChartBg from '../components/ChartBg.vue';
import { useBasicStore } from '../store';

const basicStore = useBasicStore();
const { pendingMarkers } = storeToRefs(basicStore);

const chartRef = Vue.ref<typeof Chart | null>(null);

const statusOptions = {
  1: ['STARTING MODEL...', 'INITIALIZING BLOCKCHAIN NETWORK...', 'LOADING BITCOIN PRICES...', "MODELING TERRA'S HISTORY..."],
}

const xAxisPhases = Vue.ref([
  {
    id: 'running',
    label: "Running Terra's Historical Data Against the Argon",
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
  while (pendingMarkers.value.length > 0) {
    const marker = pendingMarkers.value.shift();
    markers.push(marker);

    if (markers.length % 5 === 0) {
      console.log('inserting', markers);
      const pointPos = chartRef.value?.addPoints(markers);
      updateStatusTextPos(pointPos);
      markers = [];
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  setTimeout(loadStartData, 1);
  return;

  
  let items: any[] = [];

  for (const [index, item] of blockData.start.entries()) {
    item.showPointOnChart = index === 0;
    items.push(item);

    if (index % 2 === 0) {
      const pointPos = chartRef.value?.addPoints(items);
      updateStatusTextPos(pointPos);
      items = [];
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  const pointPos = chartRef.value?.addPoints(items);
  updateStatusTextPos(pointPos);

  chartRef.value?.startPulsing();
  statusText.value = 'TRIGGERING COLLAPSE';
  await new Promise(resolve => setTimeout(resolve, 1_000));

  statusTextPos.value.top -= 12;
  statusText.value = 'DEATH-SPIRAL COMPLETE';
  await new Promise(resolve => setTimeout(resolve, 1_500));

  statusText.value = 'ACTIVATING RESTABILIZATION MECHANISMS';
  await new Promise(resolve => setTimeout(resolve, 1_500));
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
  transform: translateY(-50%);
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