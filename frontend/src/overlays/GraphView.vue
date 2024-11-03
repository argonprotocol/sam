<template>
  <div v-if="show" :style="{ left: `${padding}px`, right: `${padding}px`, bottom: `${padding}px`, top: `${top +13}px` }" class="absolute z-[2000] bg-white border border-slate-500/30 rounded shadow-xl">

    <div :style="{ left: `${arrowLeft}px`, top: 0 }" class="absolute -translate-x-1/2 -translate-y-full">
      <svg class="relative z-10" width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="white"/>
      </svg>
      <svg class="absolute z-0 -top-0.5 left-[-0.5px] opacity-20" width="26" height="14" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="black"/>
      </svg>
    </div>

    <div class="relative w-full h-full flex flex-col px-6 pt-4 pb-3">
      <h2 class="text-lg font-semibold">Burn Coverage Over Time</h2>
      <div class="mb-10">
        <p>Bitcoins play a pivotal role in the Argon ecosystem. </p>
      </div>
      <div class="relative grow">
        <div ChartWrapper class="absolute w-full h-full left-0 top-0">
          <canvas id="MyChart" ref="chartRef" class="relative w-full h-full"></canvas>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
import * as Vue from 'vue';
import emitter from '../emitters/basic';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale } from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

dayjs.extend(dayjsUtc);
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale);

const props = defineProps<{
  items: { startingDate: string, endingPrice: number }[];
}>();

const show = Vue.ref(false);
const padding = Vue.ref(0);
const top = Vue.ref(0);

const arrowLeft = Vue.ref(0);

const chartRef = Vue.ref<HTMLCanvasElement | null>(null);

let id = '';
let chart: Chart | null = null;

const chartPoints: any[] = [];

function addPoints(items: any[]) {
  if (!chart) return;

  for (const item of items) {
    const date = dayjs.utc(item.startingDate);
    let value = 0;

    if (id === 'bitcoinCoverage') {
      const vaultMeta = item.endingVaultMeta;
      value = vaultMeta.bitcoinCount * vaultMeta.unlockPricePerBitcoin * vaultMeta.unlockBurnPerBitcoinDollar;
    } else if (id === 'bitcoinProfits') {
      // value = item.endingVaultMeta.bitcoinCount * item.endingVaultMeta.unlockPricePerBitcoin * item.endingVaultMeta.unlockBurnPerBitcoinDollar;
    } else if (id === 'argonRelativeToDollar') {
      value = item.step.dollarDiffPct;
    } else if (id === 'argonLosses') {
      // value = 
    } else if (id === 'seigniorageProfits') {
      // value = 
    } else if (id === 'seigniorageLosses') {
      value = 0;
    }

    chartPoints.push({ x: date.valueOf(), y: value });
  }

  if (['argonRelativeToDollar', 'seigniorageLosses'].includes(id)) {
    (chart as any).options.scales.y.max = 100;
    (chart as any).options.scales.y.min = -100;
  } else {
    (chart as any).options.scales.y.max = undefined;
    (chart as any).options.scales.y.min = 0;
  }

  chart.update();
}

function loadData(items: any[]) {
  if (!chart) return;

  addPoints(items);
  chart.update();
}

function createChart() {
  if (!chartRef.value) return;

  chartPoints.splice(0, chartPoints.length);
  chart = new Chart(chartRef.value, {
    type: 'line',
    data: {
      datasets: [{
        data: chartPoints,
        borderColor: '#9765a8',
        borderWidth: 4,
        pointBorderWidth: 0,
        pointRadius: 0,
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 0,
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
          },
          display: true,
          min: dayjs(props.items[0].startingDate).valueOf(),
          max: dayjs(props.items[props.items.length - 1].startingDate).valueOf(),
        },
        y: {
          display: true,
          min: 0,
        }
      },
      plugins: {
        tooltip: {
          enabled: true,
        }
      }
    },  
  });
  loadData(props.items);
}

function destroyChart() {
  if (!chart) return;
  chart.destroy();
}

emitter.on('showGraphView', (data: any) => {
  id = data.id;
  show.value = true;
  padding.value = data.padding;
  top.value = data.top;
  arrowLeft.value = data.arrowLeft;
  setTimeout(createChart, 1);
});

emitter.on('hideGraphView', () => {
  show.value = false;
  destroyChart();
});
</script>