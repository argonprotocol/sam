<template>
  <div Wrapper class="grow h-full flex flex-col relative top-1.5">
    <div class="absolute w-full h-full">
      <ChartSelector v-if="shadowSelector.isActive" :defaultMarkerOpacity="0" :config="shadowSelector" :helpers="{ getPointPosition, getItem, getLastItem }" class="opacity-60" />
      <ChartSelector :defaultMarkerOpacity="defaultMarkerOpacity" :config="mainSelector" :helpers="{ getPointPosition, getItem, getLastItem }" @move="onChartSelectorMove" @openPlayer="openPlayer" />
      <slot />
      <Charttip :config="tooltipConfig" v-if="!hideTooltip" />
    </div>

    <div ChartWrapper :class="props.isRunning ? 'pointer-events-none' : ''" class="grow relative w-full z-10">
      <canvas id="MyChart" ref="chartRef"></canvas>
    </div>

    <div v-if="markerPos.show" StartMarker class="MARKER cursor-pointer" :style="`left: ${markerPos.left}px; top: ${markerPos.top}px`"></div>

    <XAxis :phases="xAxisPhases" @phaseenter="onPhaseEnter" @phaseleave="onPhaseLeave" @phaseclick="onPhaseClick" :endingYear="endingYear" :loadPct="loadPct" :getPointPosition="getPointPosition" class="relative mb-4 mx-4 -top-0.5" />
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
import ChartSelector from '../components/ChartSelector.vue';
import { createChartOptions, CHART_X_MAX } from '../lib/ChartOptions';
import emitter from '../emitters/basic';

dayjs.extend(dayjsUtc);
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, TimeScale, Tooltip);

const props = defineProps<{ 
  xAxisPhases: any[],
  endingYear?: number,
  isRunning?: boolean,
  hideTooltip?: boolean,
}>();

const emit = defineEmits(['dragging']);

const endingYear = Vue.computed(() => props.endingYear || 2025);

const shadowSelector = Vue.ref({ firstIdx: 0, lastIdx: 0, isActive: false });
const mainSelector = Vue.ref({ firstIdx: 0, lastIdx: 0 });

const hideTooltip = Vue.ref(props.hideTooltip);
const defaultMarkerOpacity: Vue.Ref<number> = Vue.ref(1);

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

function onChartSelectorMove(events: any) {
  const leftIdx = getItemIndexFromEvent(events.left);
  const rightIdx = getItemIndexFromEvent(events.right);
  mainSelector.value.firstIdx = leftIdx || 0;
  mainSelector.value.lastIdx = rightIdx || 0;
}

function openPlayer({ firstIdx, lastIdx }: { firstIdx: number, lastIdx: number }) {
  const items = getItems(firstIdx, lastIdx);
  emitter.emit('openPlayer', { items });
}

function onPhaseEnter(event: MouseEvent) {
  const phase = (event as any).phase;
  shadowSelector.value.firstIdx = phase.firstItem.idx;
  shadowSelector.value.lastIdx = phase.lastItem.idx;
  shadowSelector.value.isActive = true;
}

function onPhaseLeave(event: any) {
  shadowSelector.value.isActive = false;
}

function onPhaseClick(event: MouseEvent) {
  const phase = (event as any).phase;
  
  let firstIdx = phase.firstItem.idx;
  let lastIdx = phase.lastItem.idx;

  if (event.shiftKey) {
    if (firstIdx < mainSelector.value.firstIdx) {
      lastIdx = mainSelector.value.lastIdx;
    }
    if (lastIdx > mainSelector.value.lastIdx) {
      firstIdx = mainSelector.value.firstIdx;
    }
  }

  setMainSelectorPos(firstIdx, lastIdx);
}

function setMainSelectorPos(firstIdx: number, lastIdx: number) {
  mainSelector.value.firstIdx = firstIdx;
  mainSelector.value.lastIdx = lastIdx;
}

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
  // @ts-ignore
  chart.options.scales.x.max = CHART_X_MAX;
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
  if (chartPoints[chartPoints.length - 1].x > CHART_X_MAX) {
    // @ts-ignore
    chart.options.scales.x.max = chartPoints[chartPoints.length - 1].x;
  }
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

function getPointPosition(index: number) {
  const meta = chart?.getDatasetMeta(0);
  const currentDataPoint = meta?.data[index];

  return { x: currentDataPoint?.x || 0, y: currentDataPoint?.y || 0 };
}

function getItem(index: number) {
  index = Math.max(0, index);
  index = Math.min(pointItems.length - 1, index);
  return pointItems[index];
}

function getItems(startIndex: number, endIndex: number) {
  return pointItems.slice(startIndex, endIndex);
}

function getLastItem() {
  return pointItems[pointItems.length - 1];
}

function getItemIndexFromEvent(event: MouseEvent) {
  if (!chartRef.value) return;

  const rect = chartRef.value.getBoundingClientRect();
  const maxY = rect.height - rect.top;
  const clientX = event.clientX;
  const clientY = event.clientY;

  const wrappedEvent = { 
    chart: chart,
    native: event,
    offsetX: undefined,
    offsetY: undefined,
    type: event.type,
    x: clientX,
    y: Math.min(clientY, maxY),
  };
  const interactionItems = chart?.getElementsAtEventForMode(wrappedEvent as any, 'index', { intersect: false }, true) || [];
  return interactionItems[0]?.index;
}

function turnOffTooltip(tooltipConfig: any) {
  tooltipConfig.value.opacity = 0;
  defaultMarkerOpacity.value = 1;
}

function turnOnTooltip(tooltipConfig: any, datasetIndex: number) {
  tooltipConfig.value.opacity = 1;

  if (datasetIndex === 0) {
    defaultMarkerOpacity.value = 0.5;
  }
}

function onTooltipFn(tooltip: TooltipModel<any>, closeIfItemMatchesThis?: any) {
  if (tooltipOpened.value) return;
  // Hide if no tooltip
  if (tooltip.opacity === 0 || !tooltip.dataPoints) {
    turnOffTooltip(tooltipConfig);
    return;
  }

  const dataPoint = tooltip.dataPoints[0];
  const pointIndex = dataPoint.dataIndex;
  const datasetIndex = dataPoint.datasetIndex;
  const item = pointItems[pointIndex];

  if (closeIfItemMatchesThis === item) {
    turnOffTooltip(tooltipConfig);
    return;
  }

  tooltipConfig.value.datasetIndex = datasetIndex;
  tooltipConfig.value.item = item;

  // Set caret Position
  if (tooltip.yAlign) {
    tooltipConfig.value.class = tooltip.yAlign; // above or below
  } else {
    tooltipConfig.value.class = 'no-transform';
  }

  turnOnTooltip(tooltipConfig, datasetIndex);
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
  datasetIndex: 0,
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

defineExpose({ 
  addPoints, 
  reloadData, 
  startPulsing, 
  stopPulsing, 
  clearPoints, 
  getItems, 
  getItem, 
  getLastItem, 
  toggleDatasetVisibility,
  getPointPosition,
  setMainSelectorPos,
});
</script>

<style lang="scss" scoped>
.MARKER {
  @apply rounded-full bg-[#63298E] absolute z-20 border border-slate-400;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  pointer-events: none;
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