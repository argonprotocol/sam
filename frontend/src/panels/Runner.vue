<template>
  <div class="flex flex-col w-full">
    <ChartBg />
    <Chart ref="chartRef" :daysToRecover="daysToRecover">
      <div StatusText v-if="statusText" :style="`left: ${statusTextPos.left}px; top: ${statusTextPos.top}px`" class="absolute z-20 font-bold text-slate-400 text-2xl">{{statusText}}</div>
    </Chart>
    <TerraCollapseOverlay v-if="showTerraCollapseOverlay" @close="loadCollapseData" />
    <ActivatingRecoveryOverlay v-if="showActivatingRecoveryOverlay" @close="loadRecoveryData" />
    <FinishedRecoveryOverlay v-if="showFinishedRecoveryOverlay" :daysToRecover="daysToRecover" @close="navigateToBase" />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { useBasicStore } from '../stores/basic';
import API from '../lib/API';
import Chart from '../components/Chart.vue';
import TerraCollapseOverlay from '../overlays/TerraCollapseOverlay.vue';
import ActivatingRecoveryOverlay from '../overlays/ActivatingRecoveryOverlay.vue';
import FinishedRecoveryOverlay from '../overlays/FinishedRecoveryOverlay.vue';
import ChartBg from '../components/ChartBg.vue';

const basicStore = useBasicStore();
const { switchToPanel } = basicStore;

const chartRef = Vue.ref<typeof Chart | null>(null);
const daysToRecover = Vue.ref(0);

const statusOptions = {
  1: ['STARTING MODEL...', 'INITIALIZING BLOCKCHAIN NETWORK...', 'LOADING BITCOIN PRICES...', "MODELING TERRA'S HISTORY..."],
}

const showTerraCollapseOverlay = Vue.ref(false);
const showActivatingRecoveryOverlay = Vue.ref(false);
const showFinishedRecoveryOverlay = Vue.ref(false);

const statusTextPos = Vue.ref({ left: 0, top: 0 });
const statusText = Vue.ref(statusOptions[1][0]);
const currentStatusIndex = Vue.ref(0);
let blockData = {
  start: null as any,
  collapseThenRecover: null as any,
  collapsingRecovery: null as any,
  collapsedForever: null as any,
  dollar: null as any,
};
let blockCount = 0;

const updateStatusText = () => {
  if (currentStatusIndex.value < statusOptions[1].length) {
    statusText.value = statusOptions[1][currentStatusIndex.value];
    currentStatusIndex.value++;
    
    setTimeout(updateStatusText, 1000);
  } else {
    loadStartData();
  }
};

async function loadStartData() {
  if (!blockData.start) {
    console.log('WAITING TO loadStartData');
    setTimeout(loadStartData, 100);
    return;
  };

  chartRef.value?.clearPoints();
  chartRef.value?.stopPulsing();
  statusText.value = '';
  
  let items: any[] = [];

  for (const [index, item] of blockData.start.entries()) {
    blockCount += item.blockCount;
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

  showTerraCollapseOverlay.value = true;
}

async function loadCollapseData() {
  if (!blockData.collapseThenRecover) {
    console.log('WAITING TO loadCollapseThenRecoverData');
    setTimeout(loadCollapseData, 100);
    return;
  };

  chartRef.value?.stopPulsing();
  statusText.value = '';

  for (const [index, item] of blockData.collapseThenRecover.collapse.entries()) {
    blockCount += item.blockCount;
    item.showPointOnChart = index === 0;

    const pointPos = chartRef.value?.addPoints([item]);
    updateStatusTextPos(pointPos);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  chartRef.value?.startPulsing();
  statusTextPos.value.top -= 12;
  statusText.value = 'DEATH-SPIRAL COMPLETE';
  await new Promise(resolve => setTimeout(resolve, 1_500));

  showActivatingRecoveryOverlay.value = true;
}

async function loadRecoveryData() {
  statusText.value = 'ACTIVATING RESTABILIZATION MECHANISMS';
  await new Promise(resolve => setTimeout(resolve, 1_500));

  chartRef.value?.stopPulsing();
  statusText.value = '';

  let items: any[] = [];
  let isFirstPoint = true;
  let previousPrice = 0.001;
  let lastMarkerRecovered = false;

  for (const [index, item] of blockData.collapseThenRecover.recover.entries()) {
    blockCount += item.blockCount;
    item.showPointOnChart = index === 0 || lastMarkerRecovered;
    items.push(item);
    
    const shouldUpdateNow = previousPrice >= 1.00 && !lastMarkerRecovered ? index % 10 === 0 : true;

    if (shouldUpdateNow) {
      const updateSpeed = previousPrice >= 1.00 ? 1 : 100;
      const pointPos = chartRef.value?.addPoints(items);
      updateStatusTextPos(pointPos);
      items = [];
      isFirstPoint = false;
      await new Promise(resolve => setTimeout(resolve, updateSpeed));
    }
    
    lastMarkerRecovered = previousPrice < 1.00 && item.endingPrice >= 1.00;
    if (lastMarkerRecovered) {
      daysToRecover.value = index + 1;
      showFinishedRecoveryOverlay.value = true;
    }
    previousPrice = item.endingPrice;
  }

  chartRef.value?.addPoints(items);
}

function navigateToBase() {
  if (!blockData.start || !blockData.collapseThenRecover || !blockData.dollar) {
    console.log('WAITING TO navigateToBase');
    setTimeout(navigateToBase, 100);
    return;
  }
  switchToPanel('base');
}

async function loadData() {
  const data = await API.getSimulationData('start', { rules: basicStore.rules });
  blockData.start = data;
  const lastMarker = blockData.start[blockData.start.length - 1];
  const startingVaultMeta = lastMarker.endingVaultMeta;
  await API.getSimulationData('collapseThenRecover', { rules: basicStore.rules, startingVaultMeta }).then(data => blockData.collapseThenRecover = data);
  await API.getSimulationData('collapsedForever', { rules: basicStore.rules, startingVaultMeta }).then(data => blockData.collapsedForever = data);
  await API.getSimulationData('dollar', { rules: basicStore.rules, startingVaultMeta }).then(data => blockData.dollar = data);
  await API.getSimulationData('collapsingRecovery', { rules: basicStore.rules, startingVaultMeta }).then(data => blockData.collapsingRecovery = data);
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

loadData().catch(console.error);
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