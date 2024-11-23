<template>
  <div ref="componentElement" class="relative pt-2 -mt-2 h-full flex flex-col overflow-hidden">
    <div class="h-full flex flex-col relative" @mousedown="startDrag">
      
      <div class="absolute w-full h-full flex flex-col pointer-events-none">        
        <div ChartCallout class="absolute bottom-[47%] left-[25px] z-20 h-[10%]">
          <div class="absolute top-12 bottom-0 left-0 w-[1px] bg-slate-400"></div>
          <p class="CalloutText relative left-0 -top-1">
            Argon follows the same trajectory<br />
            as Terra, growing to $18.7B in demand.
          </p>
        </div>

        <div ChartCallout class="absolute bottom-[47%] left-[18.5%] z-20 h-[28%]">
          <div class="absolute top-10 bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <div class="absolute top-10 right-0 h-[1px] w-32 bg-slate-400"></div>
          <p class="CalloutText relative right-36 text-right">
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
            price in under 3 days, creating an<br /> 
            enormous profit for those who participated.
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

        <div v-else-if="selectedFilter === 'collapsedForever'" ChartCallout class="absolute bottom-[10%] right-[25px] z-20 h-[25%]">
          <div class="absolute pointer-events-auto top-[73px] bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <p class="CalloutText pointer-events-auto right-0 -top-1 text-right">
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
    
      <div class="absolute right-20 top-[8%] flex flex-col min-w-[30%] xl:min-w-[35%] pb-20 items-end">
        <div class="relative max-w-[39%]">
          <p class="text-slate-700/80 text-base font-light text-shadow text-right">
            <strong class="font-bold">What Am I Looking At?</strong> This is a simulator that sends Argon into a complete death-spiral using Terra's collapse as its blueprint. Terra was one of the largest cypto failures in history, losing $18.7 billion in days. No stablecoin has shown an ability to survive such a death-sprial, which makes Terra the ideal scenario to test Argon against.
          </p>

          <div ref="configSectionRef" class="absolute top-full translate-y-7 right-0">
            
            <section class="divide-y divide-slate-400/40 border-b border-slate-400/40 whitespace-nowrap uppercase text-sm text-right">
              <h3 class="py-1 font-semibold text-base">CONFIGURE BASIC PROPERTIES</h3>
              <div class="group relative py-2 pl-3">
                LIQUID LOCKING OF BITCOIN IS AT
                <EditorButton id="btcVaultCapacityPct" type="percent" v-model="rules.btcVaultCapacityPct" @showing="showingEditor" @hiding="hidingEditor" @updated="runVault" />
                CAPACITY
                <div class="hidden group-hover:block absolute -right-14 top-1/2 -translate-y-1/2 translate-x-full text-slate-700/70 w-[300px] whitespace-normal normal-case text-right">
                  <div InlineInsight class="absolute -left-8 border border-r-0 rounded-l-3xl border-slate-400/40 w-6 -top-5 -bottom-5 "></div>
                  Set the date when your bitcoin enters the Argon vaults. This determines when the downside risk of your bitcoin is hedged. The quantity or dollar amount of bitcoin does not change your percentage returns.
                </div>
              </div>
              <div class="group relative py-2 pl-3">
                A MAX OF
                <EditorButton id="btcMaxTxnsPerHour" type="number" v-model="rules.btcMaxTxnsPerHour" @showing="showingEditor" @hiding="hidingEditor" />
                BITCOINS CAN UNLOCK PER HOUR
                <div class="hidden group-hover:block absolute -right-14 top-1/2 -translate-y-1/2 translate-x-full text-slate-700/70 w-[300px] whitespace-normal normal-case text-right">
                  <div InlineInsight class="absolute -left-8 border border-r-0 rounded-l-3xl border-slate-400/40 w-6 -top-5 -bottom-5 "></div>
                  The lower your ratchet percentage, the tighter your hedge on downside risk, and therefore, the stronger your upside potential. Disable this feature by setting it to zero.
                </div>
              </div>
            </section>

            <div class="absolute -bottom-5 right-0 flex flex-row space-x-4 whitespace-nowrap translate-y-full justify-end">
              <span VideoLink @click="openVideo" class="text-fuchsia-600 hover:text-fuchsia-500 cursor-pointer flex flex-row items-center pl-1 font-bold">
                <PlayOutlined OutlineIcon class="w-6 h-6 inline-block" />
                <PlaySolid SolidIcon class="w-6 h-6 inline-block" />
                <span class="inline-block underline decoration-dashed decoration-fuchsia-300 underline-offset-4 ml-2">Watch <em class="italic">The Antidote</em></span>
              </span>
              <button @click="downloadRawData" class="border border-slate-400 text-fuchsia-700 py-1.5 px-6 rounded-md bg-white/50 hover:bg-white/100">
                Edit All Properties
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
    <Player />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { IFilterName, useBasicStore } from '../stores/basic';
import Chart from '../components/Chart.vue';
import Player from '../overlays/Player.vue';
import { storeToRefs } from 'pinia';
import emitter from '../emitters/basic';
import ChartBg from '../components/ChartBg.vue';
import EditorButton from '../components/EditorButton.vue';
import PlayOutlined from '../assets/play-outlined.svg';
import PlaySolid from '../assets/play-solid.svg';

dayjs.extend(utc);

const basicStore = useBasicStore();
const { switchToPanel, getSimulationData } = basicStore;
const { selectedFilter, rules } = storeToRefs(basicStore);

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

function loadData() {
  const startData = getSimulationData('start');
  const collapseThenRecoverData = getSimulationData('collapseThenRecover');
  const collapsedForeverData = getSimulationData('collapsedForever');
  const collapsingRecoveryData = getSimulationData('collapsingRecovery');
  const dollarData = getSimulationData('dollar');
  const allItems: any[] = [];

  if (!startData || !collapseThenRecoverData || !dollarData) {
    switchToPanel('runner');
  }

  let phases: any = {};

  if (selectedFilter.value === 'collapseThenRecover') {
    phases = {
      launch: {
        firstItem: startData[0],
        lastItem: startData[startData.length - 1],
      },
      collapsing: {
        firstItem: collapseThenRecoverData.collapsing[0],
        lastItem: collapseThenRecoverData.collapsing[collapseThenRecoverData.collapsing.length - 1],
      },
      recovering: {
        firstItem: collapseThenRecoverData.recovering[0],
        lastItem: collapseThenRecoverData.recovering[collapseThenRecoverData.recovering.length - 1],
      },
      regrowth: {
        firstItem: collapseThenRecoverData.regrowth[0],
        lastItem: collapseThenRecoverData.regrowth[collapseThenRecoverData.regrowth.length - 1],
      }
    };
    allItems.push(...[
      ...startData,
      ...collapseThenRecoverData.collapsing,
      ...collapseThenRecoverData.recovering,
      ...collapseThenRecoverData.regrowth,
    ]);
  } else if (selectedFilter.value === 'collapsedForever') {
    phases = {
      launch: {
        firstItem: startData[0],
        lastItem: startData[startData.length - 1],
      },
      collapsing: {
        firstItem: collapsedForeverData.collapsing[0],
        lastItem: collapsedForeverData.collapsing[collapsedForeverData.collapsing.length - 1],
      },
      collapsedForever: {
        firstItem: collapsedForeverData.collapsedForever[0],
        lastItem: collapsedForeverData.collapsedForever[collapsedForeverData.collapsedForever.length - 1],
      }
    };
    allItems.push(...[
      ...startData,
      ...collapsedForeverData.collapsing,
      ...collapsedForeverData.collapsedForever,
    ]);
  } else if (selectedFilter.value === 'collapsingRecovery') {
    phases = {
      launch: {
        firstItem: startData[0],
        lastItem: startData[startData.length - 1],
      },
      collapsingRecovery: {
        firstItem: collapsingRecoveryData.collapsingRecovery[0],
        lastItem: collapsingRecoveryData.collapsingRecovery[collapsingRecoveryData.collapsingRecovery.length - 1],
      },
      regrowth: {
        firstItem: collapsingRecoveryData.regrowth[0],
        lastItem: collapsingRecoveryData.regrowth[collapsingRecoveryData.regrowth.length - 1],
      }
    };
    allItems.push(...[
      ...startData,
      ...collapsingRecoveryData.collapsingRecovery,
      ...collapsingRecoveryData.regrowth,
    ]);
  }

  xAxisUpdate(selectedFilter.value, phases);

  let accumulatedSeigniorage = 0;
  let accumulatedArgonLoss = 0;

  // connect each item to the next and previous item
  for (const [index, item] of allItems.entries()) {
    const seigniorageProfits: number[] = Object.values(item.seigniorageMap as any);
    const addedSeigniorageProfits = seigniorageProfits.reduce((acc: number, curr: number) => acc + curr, 0);

    accumulatedSeigniorage += addedSeigniorageProfits;
    accumulatedArgonLoss += item.argonLossDueToFear;
    item.seigniorageProfits = accumulatedSeigniorage;
    item.argonLossDueToFear = accumulatedArgonLoss;

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
  for (const [index, item] of collapseThenRecoverData.collapsing.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapseThenRecoverData.collapsing[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);    
    if (priceDiff >= 0.05) {
      allItems[startData.length + index].showPointOnChart = true;
    }
  }

  for (const [index, item] of collapseThenRecoverData.recovering.entries()) {
    if (index === 0) {
      allItems[startData.length + collapseThenRecoverData.collapsing.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapseThenRecoverData.recovering[lastIndex];
    const priceDiff = Math.abs(item.endingPrice - lastItem.endingPrice);
    if (priceDiff >= 0.05) {
      allItems[startData.length + collapseThenRecoverData.collapsing.length + index].showPointOnChart = true;
    }

    if (item.endingPrice >= 1.00) {
      daysToRecover.value = index + 1
      allItems[startData.length + collapseThenRecoverData.collapsing.length + index].showPointOnChart = true;
      break;
    }
  }
}

function injectPointsIntoCollapsedForever(startData: any[], collapsedForeverData: any, allItems: any[]) {
  let daysAtBottom = 0;

  for (const [index, item] of collapsedForeverData.collapsing.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapsedForeverData.collapsing[lastIndex];
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
  
  for (const [index, item] of collapsingRecoveryData.collapsingRecovery.entries()) {
    if (index === 0) {
      allItems[startData.length + index].showPointOnChart = true;
      continue;
    }
    
    const lastIndex = index - 1;
    const lastItem = collapsingRecoveryData.collapsingRecovery[lastIndex];
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

const xAxisLaunchPhase = {
  id: 'launch',
  label: "Replication of Terra's Launch",
  bgColor: '#AAB0B7',
  firstItem: {
    startingDate: '2020-10-01',
  },
  lastItem: {
    startingDate: '2022-05-08',
  },
};

const xAxisPhases: Vue.Ref<any[]> = Vue.ref([xAxisLaunchPhase]);

function xAxisUpdate(newSelectedFilter: IFilterName, phases: any) {
  xAxisPhases.value = [{ 
    ...xAxisLaunchPhase, 
    ...phases.launch,
  }];
   
  if (newSelectedFilter === 'collapseThenRecover') {
    xAxisPhases.value.push(...[
      {
        id: 'collapsing',
        bgColor: '#F36F6F',
        ...phases.collapsing,
      }, {
        id: 'recovering',
        bgColor: ['#F36F6F', '#93CD61'],
        ...phases.recovering,
      }, {
        id: 'recovered',
        label: 'Stabilized and Growing',
        bgColor: '#93CD61',
        ...phases.regrowth,
      }
    ]);
  } else if (newSelectedFilter === 'collapsingRecovery') {
    xAxisPhases.value.push(...[
      {
        id: 'collapsingRecovery',
        bgColor: ['#F36F6F', '#93CD61'],
        ...phases.collapsingRecovery,
      }, {
        id: 'recovered',
        label: 'Stabilized and Growing',
        startingDate: '2022-07-20',
        ...phases.regrowth,
      }
    ]);
  } else if (newSelectedFilter === 'collapsedForever') {
    xAxisPhases.value.push(...[
      {
        id: 'collapsing',
        bgColor: '#F36F6F',
        ...phases.collapsing,
      }, {
        id: 'collapsedForever',
        label: 'No Hope of Recovery',
        bgColor: '#F36F6F',
        ...phases.collapsedForever,
      }
    ]);
  }
}

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

[VideoLink] {
    [SolidIcon] {
      display: none;
    }
    [OutlineIcon] {
      display: inline-block;
    }
    &:hover {
      [SolidIcon] {
        display: inline-block;
      }
      [OutlineIcon] {
        display: none;
      }
    }
    svg path {
      fill: rgb(192 38 211) !important;
    }
  }
</style>