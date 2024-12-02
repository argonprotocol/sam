<template>
<div Wrapper class="grow h-full flex flex-col relative">
  <div ChartWrapper class="grow relative w-full h-full">
    <canvas id="MyChart" ref="chartRef" class="relative -top-1"></canvas>
  </div>
</div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale } from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

dayjs.extend(dayjsUtc);
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale);

const props = defineProps<{
  items: { startingDate: string, endingPrice: number }[];
}>();

const emit = defineEmits<{
  (event: 'click', event: any): void;
}>();

const chartRef = Vue.ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const chartPoints: any[] = [];

function addPoints(items: { startingDate: string, endingPrice: number }[]) {
  for (const item of items) {
    const date = dayjs.utc(item.startingDate);
    const price = Math.min(item.endingPrice, 1.00);

    chartPoints.push({ x: date.valueOf(), y: price });
  }

  if (!chart) return;
  chart.update();
}

function reloadData(items: any[]) {
  if (!chart) return;

  chartPoints.splice(0, chartPoints.length);
  addPoints(items);
  chart.update();
}

Vue.onMounted(() => {
  if (chartRef.value) {
    chart = new Chart(chartRef.value, {
      type: 'line',
      data: {
        datasets: [{
          data: chartPoints,
          borderColor: '#D8E4EF',
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
          display: false,
          min: dayjs(props.items[0].startingDate).valueOf(),
          max: dayjs(props.items[props.items.length - 1].startingDate).valueOf(),
        },
        y: {
          display: false,
          min: 0,
            max: 2.50,
          }
        },
        plugins: {
          tooltip: {
            enabled: false,
          }
        }
      },
      plugins: [{
        id: 'myEventCatcher',
        afterEvent: onEventFn,
      }]    
    });
    reloadData(props.items);
  }
});

function onEventFn(chart: Chart, args: any, pluginOptions: any) {
  const event = args.event;
  if (event.type === 'click') {
    emit('click', event);
  }
}


Vue.onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});

defineExpose({ addPoints, reloadData });
</script>