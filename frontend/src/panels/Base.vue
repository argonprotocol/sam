<template>
  <div ref="componentElement" class="relative pt-2 -mt-2 h-full flex flex-col overflow-hidden">
    <div class="h-full flex flex-col relative" @mousedown="startDrag">
      
      <div class="absolute w-full h-full flex flex-col pointer-events-none">
        <p ChartCallout class="CalloutText absolute top-6 left-7 w-6/12 z-20">S.A.M. uses Terra's collapse as its underlying base. Terra was one of the largest cypto collapse in history, losing over $18 billion within days. No  stablecoin has shown an ability to survive such a death-sprial, which makes Terra the ideal real-world scenario to test Argon's capabilities.</p>
        
        <div ChartCallout class="absolute bottom-[47%] left-[25px] z-20 h-[10%]">
          <div class="absolute top-12 bottom-0 left-0 w-[1px] bg-slate-400"></div>
          <p class="CalloutText relative left-0 -top-1">
            Argon begins at the size of<br />
            Terra with $18.7B in capital.
          </p>
        </div>

        <div ChartCallout class="absolute bottom-[47%] left-[18.5%] z-20 h-[28%]">
          <div class="absolute top-10 bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <div class="absolute top-10 right-0 h-[1px] w-10 bg-slate-400"></div>
          <p class="CalloutText relative right-12 text-right">
            Argon is hit with a full<br />
            Terra-like collapse as $18.69B<br />
            in capital fled the asset.
          </p>
        </div>

        <div v-if="selectedFilter === 'collapseThenRecover'" ChartCallout class="absolute bottom-[47%] left-[34.1%] z-20 h-[18%]">
          <div class="absolute top-6 bottom-0 -left-1 w-[1px] bg-slate-400"></div>
          <div class="absolute top-6 -left-1 h-[1px] w-10 bg-slate-400"></div>
          <p class="CalloutText relative left-12 text-left">
            Argon bounces back to its target<br />
            price in under 3 days and remains stable.
          </p>
        </div>
        <div v-else-if="selectedFilter === 'collapsingRecovery'" ChartCallout class="absolute bottom-[47%] left-[34.1%] z-20 h-[18%]">
          <div class="absolute top-6 bottom-0 -left-1 w-[1px] bg-slate-400"></div>
          <div class="absolute top-6 -left-1 h-[1px] w-10 bg-slate-400"></div>
          <p class="CalloutText relative left-12 text-left">
            Argon has absorbed the full brunt of Terra's<br />
            $18.69B collapse, and other than brief dips<br />
            in price, remains incredibly stable.
          </p>
        </div>

        <div v-if="['collapseThenRecover', 'collapsingRecovery'].includes(selectedFilter)" ChartCallout class="absolute bottom-[47%] right-[25px] z-20 h-[25%]">
          <div @mouseenter="showDollarTooltip" @mouseleave="hideDollarTooltip" class="absolute pointer-events-auto top-[73px] bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <p @mouseenter="showDollarTooltip" @mouseleave="hideDollarTooltip" class="CalloutText pointer-events-auto right-0 -top-1 text-right">
            It's the end of 2025, and<br />
            Argon is now worth 27%<br />
            more than the dollar.
          </p>
        </div>
        <div v-else-if="selectedFilter === 'collapsedForever'" ChartCallout class="absolute bottom-[10%] right-[25px] z-20 h-[25%]">
          <div @mouseenter="showDollarTooltip" @mouseleave="hideDollarTooltip" class="absolute pointer-events-auto top-[73px] bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <p @mouseenter="showDollarTooltip" @mouseleave="hideDollarTooltip" class="CalloutText pointer-events-auto right-0 -top-1 text-right">
            Argon's novel stabilization mechanisms have<br />
            been turned off, meaning it basically resembles.<br />
            It has no hope of recovering.
          </p>
        </div>
      </div>

      <div Selection v-if="selector.isActive" class="absolute -top-1 bottom-[73px] cursor-pointer border-[6px] rounded border-[#BCC1D8] z-[60]" :style="`left: ${selector.left}px; width: ${selector.width}px`">
        <div EdgeLeft side="left" @mousedown="startDragEdge"></div>
        <div SelectionBg @click="openPlayer"></div>
        <div EdgeRight side="right" @mousedown="startDragEdge"></div>
      </div>
      
      <div class="grow relative">
        <ChartBg />
        <Chart @dragging="onDragging" ref="chartRef" :daysToRecover="daysToRecover" :xAxisPhases="xAxisPhases" />
      </div>
    
    </div>
    <Player />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { IFilterName, useBasicStore } from '../stores/basic';
import Chart from '../components/Chart.vue';
import Player from '../overlays/Player.vue';
import { storeToRefs } from 'pinia';
import emitter from '../emitters/basic';
import ChartBg from '../components/ChartBg.vue';

const basicStore = useBasicStore();
const { switchToPanel, getSimulationData } = basicStore;
const { selectedFilter } = storeToRefs(basicStore);

const chartRef = Vue.ref<typeof Chart | null>(null);
const daysToRecover = Vue.ref(0);

const isDragging = Vue.ref(false);
const componentElement = Vue.ref(null);

const startDragMeta: { startX: number, side: string | null } = Vue.ref({ startX: 0, side: null });

const dragMeta: any = {};
const selector = Vue.ref({ left: 0, width: 0, isActive: false });
const dragSelection: Vue.Ref<null | any> = Vue.ref();

function startDragEdge(event: MouseEvent) {
  if (dragMeta.isDragging) return;
  startDragMeta.startX = event.clientX;
  startDragMeta.side = (event.target as HTMLElement).getAttribute('side');
  document.addEventListener('mousemove', onDragEdge);
  document.addEventListener('mouseup', stopDragEdge);
}

function onDragEdge(event: MouseEvent) {
  const diff = event.clientX - startDragMeta.startX;
  if (startDragMeta.side === 'left') {
    selector.value.left += diff;
  } else if (startDragMeta.side === 'right') {
    selector.value.width += diff;
  }
}

function stopDragEdge(event: MouseEvent) {
  console.log('stopDragEdge', event);
}

function onDragging(response: any) {
  dragSelection.value = response;
}

function startDrag(event: MouseEvent) {
  const targetElem = event.target as HTMLElement;
  const hasSelectionAttribute = targetElem.hasAttribute('Selection') || targetElem.parentElement?.hasAttribute('Selection');
  if (hasSelectionAttribute) {
    return;
  }

  isDragging.value = true;
  dragMeta.startX = event.clientX;
  setSelectorPos(event.clientX, event.clientX);
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return;

  setSelectorPos(dragMeta.startX, event.clientX);
  // console.log('dragging', dragMeta.startX, event.clientX);

  // const deltaXBaseline = event.clientX

  // console.log('onDrag');
}

function stopDrag(event: MouseEvent) {
  isDragging.value = false;

  setSelectorPos(dragMeta.startX, event.clientX);

  // console.log('stopDrag', dragMeta.startX, event.clientX);

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

function setSelectorPos(startPos: number, currentPos: number) {
  const left = Math.min(startPos, currentPos);
  const right = Math.max(startPos, currentPos);

  selector.value.left = left;
  selector.value.width = right - left;
  
  selector.value.isActive = (left !== right);
}

function openPlayer() {
  if (!dragSelection.value) return;
  const { left, right } = dragSelection.value;

  const items = chartRef.value?.getItems(left.index, right.index);
  emitter.emit('openPlayer', { items });
}

function showDollarTooltip(event: MouseEvent) {
  chartRef.value?.toggleDatasetVisibility(1, true);
}

function hideDollarTooltip(event: MouseEvent) {
  chartRef.value?.toggleDatasetVisibility(1, false);
}

function loadData() {
  const startData = getSimulationData('start');
  const collapseThenRecoverData = getSimulationData('collapseThenRecover');
  const collapsedForeverData = getSimulationData('collapsedForever');
  const collapsingRecoveryData = getSimulationData('collapsingRecovery');
  const dollarData = getSimulationData('dollar');

  if (!startData || !collapseThenRecoverData || !dollarData) {
    switchToPanel('runner');
  }

  const allItems: any[] = [];
  
  if (selectedFilter.value === 'collapseThenRecover') {
    allItems.push(...[
      ...startData,
      ...collapseThenRecoverData.collapse,
      ...collapseThenRecoverData.recover,
    ]);
  } else if (selectedFilter.value === 'collapsedForever') {
    allItems.push(...[
      ...startData,
      ...collapsedForeverData
    ]);
  } else if (selectedFilter.value === 'collapsingRecovery') {
    allItems.push(...[
      ...startData,
      ...collapsingRecoveryData,
    ]);
  }

  for (const [index, item] of allItems.entries()) {
    item.next = allItems[index + 1] || item;
    item.previous = allItems[index - 1] || item;
    item.dollar = dollarData[index];
  }
  
  allItems[0].showPointOnChart = true;
  allItems[startData.length - 1].showPointOnChart = true;
  allItems[allItems.length - 1].showPointOnChart = true;
  
  if (selectedFilter.value === 'collapseThenRecover') {
    injectPointsIntoCollapseThenRecover(startData, collapseThenRecoverData, allItems);
  } else if (selectedFilter.value === 'collapsedForever') {
    injectPointsIntoCollapsedForever(startData, collapsedForeverData, allItems);
  } else if (selectedFilter.value === 'collapsingRecovery') {
    injectPointsIntoCollapsingRecovery(startData, collapsingRecoveryData, allItems);
  }

  chartRef.value?.reloadData(allItems, dollarData);
}

function injectPointsIntoCollapseThenRecover(startData: any[], collapseThenRecoverData: any, allItems: any[]) {
  for (const [index, item] of collapseThenRecoverData.collapse.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapseThenRecoverData.collapse[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);    
    if (priceDiff >= 0.05) {
      allItems[startData.length + index].showPointOnChart = true;
    }
  }

  for (const [index, item] of collapseThenRecoverData.recover.entries()) {
    if (index === 0) {
      allItems[startData.length + collapseThenRecoverData.collapse.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapseThenRecoverData.recover[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);
    if (priceDiff >= 0.05) {
      allItems[startData.length + collapseThenRecoverData.collapse.length + index].showPointOnChart = true;
    }

    if (item.endingPrice >= 1.00) {
      daysToRecover.value = index + 1
      allItems[startData.length + collapseThenRecoverData.collapse.length + index].showPointOnChart = true;
      break;
    }
  }
}

function injectPointsIntoCollapsedForever(startData: any[], collapsedForeverData: any, allItems: any[]) {
  let daysAtBottom = 0;

  for (const [index, item] of collapsedForeverData.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapsedForeverData[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);    
    if (priceDiff >= 0.05) {
      allItems[startData.length + index].showPointOnChart = true;
    }

    daysAtBottom = item.endingPrice === 0.001 ? daysAtBottom + 1 : 0;
    if (daysAtBottom === 20) {
      allItems[startData.length + index].showPointOnChart = true;
    }
  }
}

function injectPointsIntoCollapsingRecovery(startData: any[], collapsingRecoveryData: any, allItems: any[]) {
  let daysAtTop = 0;
  
  for (const [index, item] of collapsingRecoveryData.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapsingRecoveryData[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);    
    if (priceDiff >= 0.05) {
      allItems[startData.length + index].showPointOnChart = true;
    }

    daysAtTop = item.lowestPrice === 1.00 ? daysAtTop + 1 : 0;
    if (daysAtTop === 20) {
      allItems[startData.length + index].showPointOnChart = true;
    }
  }
}

const xAxisPhases: Vue.Ref<any[]> = Vue.ref([]);

function xAxisUpdate(newSelectedFilter: IFilterName) {
  xAxisPhases.value = [{
    id: 'launch',
    label: "Replication of Terra's Launch",
    startingDate: '2020-10-01',
    endingDate: '2022-05-08',
    bgColor: '#AAB0B7',
  }];
   
  if (newSelectedFilter === 'collapseThenRecover') {
    xAxisPhases.value.push(...[
      {
        id: 'collapse',
        startingDate: '2022-05-08',
        endingDate: '2022-06-29',
        bgColor: '#F36F6F',
      }, {
        id: 'recovery',
        startingDate: '2022-06-30',
        endingDate: '2022-07-20',
        bgColor: ['#F36F6F', '#93CD61'],
      }, {
        id: 'recovered',
        label: 'Recovered and Stable',
        startingDate: '2022-07-20',
        endingDate: '2025-12-31',
        bgColor: '#93CD61'
      }
    ]);
  } else if (newSelectedFilter === 'collapsingRecovery') {
    xAxisPhases.value.push(...[
      {
        id: 'collapsingRecovery',
        startingDate: '2022-05-08',
        endingDate: '2022-07-20',
        bgColor: ['#F36F6F', '#93CD61'],
      }, {
        id: 'recovered',
        label: 'Recovered and Stable',
        startingDate: '2022-07-20',
        endingDate: '2025-12-31',
        bgColor: '#93CD61'
      }
    ]);
  } else if (newSelectedFilter === 'collapsedForever') {
    xAxisPhases.value.push(...[
      {
        id: 'collapse',
        startingDate: '2022-05-08',
        endingDate: '2022-06-29',
        bgColor: '#F36F6F',
      }, {
        id: 'dead',
        label: 'No Hope of Recovery',
        startingDate: '2022-06-30',
        endingDate: '2025-12-31',
        bgColor: '#F36F6F'
      }
    ]);
  }
}

Vue.watch(() => selectedFilter.value, async (newSelectedFilter) => {
  xAxisUpdate(newSelectedFilter);
});

xAxisUpdate(selectedFilter.value);


Vue.watch(() => selectedFilter.value, () =>  loadData());
Vue.onMounted(() => loadData());
</script>

<style lang="scss" scoped>
.CalloutText {
  @apply font-light text-slate-400 select-none;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
  &:hover {
    @apply text-slate-500;
  }
}

[Selection] {
  box-shadow: 1px 1px 1px 0 rgb(0 0 0), inset 1px 1px 1px 0 rgb(0 0 0);
}

[Selection]:hover {
  border-color: #91bcdf;
  [SelectionBg] {
    background: rgba(230, 234, 243, 0.5);
  }
}
[SelectionBg] {
  @apply absolute top-0 bottom-0 left-0 right-0;
  background: rgba(230, 234, 243, 0.4);
}
[EdgeLeft] {
  @apply absolute top-0 bottom-0 -left-2 w-3 cursor-col-resize;
}
[EdgeRight] {
  @apply absolute top-0 bottom-0 -right-2 w-2 cursor-col-resize;
}
</style>