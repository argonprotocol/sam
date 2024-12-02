<template>
  <div Wrapper class="grow h-full flex flex-col relative top-1.5">
    <div class="absolute w-full h-full">
      <slot />
      <Charttip :config="tooltipConfig" />
      <ChartMarker direction="left" :config="chartMarkerLeft" />
      <ChartMarker direction="right" :config="chartMarkerRight" />
      
      <div ShadowSelection v-if="shadowSelector.isActive" class="absolute -top-[10px] bottom-[79px] cursor-pointer border-[6px] rounded border-[#BCC1D8] z-[60]" :style="`left: ${shadowSelector.left}px; width: ${shadowSelector.width}px`">
        <div ShadowSelectionBg></div>
      </div>
    </div>

    <div ChartWrapper class="grow relative w-full z-10">
      <canvas id="MyChart" ref="chartRef"></canvas>
    </div>

    <div v-if="markerPos.show" StartMarker class="MARKER cursor-pointer" :style="`left: ${markerPos.left}px; top: ${markerPos.top}px`"></div>

    <XAxis :phases="xAxisPhases" @phaseenter="onPhaseEnter" @phaseleave="onPhaseLeave" endingYear="2025" :loadPct="loadPct" class="relative mb-4 mx-4 -top-1.5" />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale, Tooltip, TooltipModel, ChartEvent, InteractionItem } from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import XAxis from '../components/XAxis.vue';
import Charttip from '../overlays/Charttip.vue';
import ChartMarker from '../overlays/ChartMarker.vue';
import { createChartOptions } from '../lib/ChartOptions';

dayjs.extend(dayjsUtc);
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale, Tooltip);

const props = defineProps<{ 
  xAxisPhases: any[],
  isRunning?: boolean,
}>();

const emit = defineEmits(['dragging'])

const shadowSelector = Vue.ref({ isActive: false, left: 0, width: 0 });

function onPhaseEnter(event: any) {
  shadowSelector.value.isActive = true;
  shadowSelector.value.left = event.left;
  shadowSelector.value.width = event.width;
}

function onPhaseLeave(event: any) {
  shadowSelector.value.isActive = false;
}

const totalDays = dayjs('2025-12-31').diff(dayjs('2020-10-01'), 'day');
const loadPct = Vue.ref(0);

const markerPos = Vue.ref({ show: false, left: 0, top: 0 });

const chartRef = Vue.ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const chartPoints: any[] = [];
const pointRadius: number[] = [];
const pointItems: any[] = [];

const dollarPoints: any[] = [];
const dollarPointRadius: any[] = [];

function toggleDatasetVisibility(index: number, visible: boolean) {
  const dataset = chart?.data.datasets[index];
  if (dataset) {
    dataset.hidden = !visible;
  }
  chart?.update();
}

function clearPoints() {
  chartPoints.splice(0, chartPoints.length);
  pointRadius.splice(0, pointRadius.length);
  chart?.update();
}

function addPoints(items: { startingDate: string, endingPrice: number, showPointOnChart?: boolean }[]) {
  const lastIndex = chartPoints.length - 1;
  if (lastIndex > 0) {
    pointRadius[lastIndex] = chartPoints[lastIndex].showPointOnChart ? 4 : 0;
  }
  
  for (const item of items) {
    const date = dayjs.utc(item.startingDate);
    const price = Math.min(item.endingPrice, 1.00);

    chartPoints.push({ x: date.valueOf(), y: price });
    pointRadius.push(item.showPointOnChart ? 4 : 0);
    pointItems.push(item);
  }

  pointRadius[pointRadius.length - 1] = 4;

  const daysLoaded = chartPoints.length / totalDays;
  loadPct.value = Math.round(daysLoaded * 100);

  if (!chart) return;
  chart.update();

  const dataset = chart.data.datasets[0];
  const datasetData = dataset.data;
  const currentIndex = datasetData.length - 1;

  const meta = chart?.getDatasetMeta(0);
  const currentDataPoint = meta?.data[currentIndex];

  markerPos.value.left = currentDataPoint?.x || 0;
  markerPos.value.top = currentDataPoint?.y || 0;

  // Trigger tooltip on the latest point
  if (props.isRunning && currentDataPoint && pointItems.length > 10) {
    chart.tooltip.setActiveElements([{ datasetIndex: 0, index: currentIndex }], { x: currentDataPoint.x, y: currentDataPoint.y });
    chart.update();
  }

  return { x: currentDataPoint?.x, y: currentDataPoint?.y };
}

const tooltipOpened = Vue.ref(false);

function reloadData(items: any[], dollarData?: any[]) {
  if (!chart) return;

  chartPoints.splice(0, chartPoints.length);
  pointRadius.splice(0, pointRadius.length);
  pointItems.splice(0, pointItems.length);

  dollarPoints.splice(0, dollarPoints.length);
  dollarPointRadius.splice(0, dollarPointRadius.length);

  const newDollarPoints = dollarData?.map((item: any) => {
    const date = dayjs.utc(item.startingDate);
    const price = Math.min(item.endingPrice, 1.00);
    return { x: date.valueOf(), y: price };
  }) || [];

  dollarPoints.push(...newDollarPoints);
  dollarPointRadius.push(...newDollarPoints.map(() => 0));
  dollarPointRadius[dollarPointRadius.length - 1] = 4;

  addPoints(items);
  chart.update();
}

function getItem(index: number) {
  index = Math.max(0, index);
  index = Math.min(pointItems.length - 1, index);
  return pointItems[index];
}

function getItems(startIndex: number, endIndex: number) {
  return pointItems.slice(startIndex, endIndex);
}

function onTooltipFn(tooltip: TooltipModel<any>, closeIfItemMatchesThis?: any) {
  if (tooltipOpened.value) return;
  // Hide if no tooltip
  if (tooltip.opacity === 0 || !tooltip.dataPoints) {
    tooltipConfig.value.opacity = 0;
    return;
  }

  const pointIndex = tooltip.dataPoints[0].dataIndex;
  const item = pointItems[pointIndex];

  if (closeIfItemMatchesThis === item) {
    tooltipConfig.value.opacity = 0;
    return;
  }

  tooltipConfig.value.item = item;

  // Set caret Position
  if (tooltip.yAlign) {
    tooltipConfig.value.class = tooltip.yAlign; // above or below
  } else {
    tooltipConfig.value.class = 'no-transform';
  }

  tooltipConfig.value.opacity = 1;
  tooltipConfig.value.left = tooltip.caretX;
  tooltipConfig.value.top = tooltip.caretY;
}

function onEventFn(chart: Chart, args: any, pluginOptions: any) {
  const tooltip = chart.tooltip;
  const event = args.event;
  if (event.type === 'click') {
    if (tooltipOpened.value) {
      tooltipOpened.value = false;
      const item = tooltipConfig.value.item;
      const pointIndex = pointItems.findIndex(x => x === item);
      pointRadius[pointIndex] = item.showPointOnChart ? 4 : 0;
      onTooltipFn(tooltip as any, item);
      chart?.update();
    } else if (tooltip?.opacity) {
      tooltipOpened.value = true;
      const pointIndex = tooltip.dataPoints[0].dataIndex;
      pointRadius[pointIndex] = 4;
      chart?.update();
    }
  }
  if (event.type === 'mousedown') {
    startDrag(event);
  }
}

const dragMeta = { 
  isDragging: false,
  startX: 0 as number,
  startInteractionItem: null as InteractionItem | null,
  startEvent: null as any,
};

function startDrag(event: ChartEvent) {
  const alteredEvent = { ...event };
  alteredEvent.x = Math.max(20, alteredEvent.x as number);
  const interactionItems = chart?.getElementsAtEventForMode(alteredEvent as any, 'index', { intersect: false }, true) || [];
  
  dragMeta.isDragging = true;
  dragMeta.startX = event.x || 0;
  dragMeta.startInteractionItem = interactionItems[0];
  dragMeta.startEvent = event;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

const chartMarkerLeft = Vue.ref({ left: 0, top: 0, opacity: 0, item: {} as any });
const chartMarkerRight = Vue.ref({ left: 0, top: 0, opacity: 0, item: {} as any });

function onDrag(event: any) {
  if (!dragMeta.isDragging) return;

  const { startX, startInteractionItem } = dragMeta;
  const startIndex = startInteractionItem?.index || 0;
  const alteredEvent = { ...dragMeta.startEvent };
  alteredEvent.x = Math.max(20, event.x as number);
  const interactionItems = chart?.getElementsAtEventForMode(alteredEvent, 'index', { intersect: false }, true) || [];

  const endX = Math.max(20, event.x as number);
  const endInteractionItem = interactionItems[0];
  const endIndex = endInteractionItem.index;
  const leftToRight = endX > startX;

  const left = {
    x: leftToRight ? startInteractionItem?.element.x || 0 : endInteractionItem?.element.x,
    y: leftToRight ? startInteractionItem?.element.y || 0 : endInteractionItem?.element.y,
    index: leftToRight ? startIndex : endIndex,
    item: leftToRight ? pointItems[startIndex] : pointItems[endIndex],
  };
  const right = {
    x: leftToRight ? endInteractionItem?.element.x || 0 : startInteractionItem?.element.x || 0,
    y: leftToRight ? endInteractionItem?.element.y || 0 : startInteractionItem?.element.y || 0,
    index: leftToRight ? endIndex : startIndex,
    item: leftToRight ? pointItems[endIndex] : pointItems[startIndex],
  }

  chartMarkerLeft.value = {
    left: left.x,
    top: left.y,
    opacity: 1,
    item: left.item,
  };

  chartMarkerRight.value = {
    left: right.x,
    top: right.y,
    opacity: 1,
    item: right.item,
  };

  // Emit the response back to the parent component
  emit('dragging', { left, right });
}

function stopDrag(event: MouseEvent) {
  dragMeta.isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

const tooltipConfig = Vue.ref({
  opacity: 0,
  class: '',
  left: 0,
  top: 0,
  item: {} as any,
});

function startPulsing() {
  markerPos.value.show = true;
}

function stopPulsing() {
  markerPos.value.show = false;
}

Vue.onMounted(() => {
  if (chartRef.value) {
    const chartOptions = createChartOptions(chartPoints, pointRadius, dollarPoints, dollarPointRadius, onTooltipFn, onEventFn);
    chart = new Chart(chartRef.value, chartOptions as any);
  }
});

Vue.onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});

defineExpose({ addPoints, reloadData, startPulsing, stopPulsing, clearPoints, getItems, getItem, toggleDatasetVisibility });
</script>

<style lang="scss" scoped>
.MARKER {
  @apply rounded-full bg-[#63298E] absolute z-20 border border-slate-400;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

[ShadowSelection] {
  box-shadow: 1px 1px 1px 0 rgb(0 0 0), inset 1px 1px 1px 0 rgb(0 0 0);
}

.MARKER {
  pointer-events: none;

  &:before, &:after {
    content: "";
    display: block;
    position: absolute;
    border: 2px solid #63298E;
    left: -20px;
    right: -20px;
    top: -20px;
    bottom: -20px;
    border-radius: 50%;
    animation: animate 1.5s linear infinite;
    backface-visibility: hidden;
  }

  &:after {
    animation-delay: 0.5s;
  }
}

@keyframes animate {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
</style>