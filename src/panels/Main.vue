<template>
  <div ref="componentElement" class="MainPanel Component relative pt-2 -mt-2 h-full flex flex-col overflow-hidden">
    <div class="h-full flex flex-col relative" @mousedown="startDrag">
      
      <div class="absolute w-full h-full flex flex-col pointer-events-none">        
        <div ChartCallout class="absolute bottom-[47%] left-[25px] z-1 h-[10%]">
          <div class="absolute top-12 bottom-0 left-0 w-[1px] bg-slate-400"></div>
          <p class="CalloutText relative left-0 -top-1">
            Argon follows the same trajectory<br />
            as Terra, growing to $18.7B in demand.
          </p>
        </div>

        <div ChartCallout class="absolute bottom-[47%] left-[18.5%] z-1 h-[28%]">
          <div class="absolute top-10 bottom-0 right-0 w-[1px] bg-slate-400"></div>
          <div class="absolute top-10 right-0 h-[1px] w-32 bg-slate-400"></div>
          <p class="CalloutText relative right-36 text-right">
            Argon is hit with a full<br />
            Terra-like collapse as $18.69B<br />
            in capital fled the asset.
          </p>
        </div>

        <div v-if="selectedFilter === 'collapseThenRecover'" ChartCallout class="absolute bottom-[47%] left-[34.1%] z-1 h-[18%]">
          <div class="absolute top-6 bottom-0 -left-1 w-[1px] bg-slate-400"></div>
          <div class="absolute top-6 -left-1 h-[1px] w-10 bg-slate-400"></div>
          <p class="CalloutText relative left-12 text-left">
            Argon bounces back to its target<br />
            price in under 3 days, creating an<br /> 
            enormous profit for those who participated.
          </p>
        </div>
        <div v-else-if="selectedFilter === 'collapsingRecovery'" ChartCallout class="absolute bottom-[47%] left-[34.1%] z-1 h-[18%]">
          <div class="absolute top-6 bottom-0 -left-1 w-[1px] bg-slate-400"></div>
          <div class="absolute top-6 -left-1 h-[1px] w-10 bg-slate-400"></div>
          <p class="CalloutText relative left-12 text-left">
            Argon has absorbed the full brunt of Terra's<br />
            $18.69B collapse, and other than brief dips<br />
            in price, remains incredibly stable.
          </p>
        </div>

        <div v-else-if="selectedFilter === 'collapsedForever'" ChartCallout class="absolute bottom-[10%] right-[25px] z-1 h-[25%]">
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
        <div v-if="needsRerun" class="absolute top-0 left-0 w-full h-full z-10">
          <div class="absolute top-0 left-0 w-full h-full bg-[#E6EAF3] opacity-80">
            <ChartBg />
          </div>
          <div @click="runEngine" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 group rounded-full bg-[#edf0f6] border border-slate-400/40 shadow-md flex items-center justify-center cursor-pointer">
            <RerunIcon class="w-28 h-28 relative top-0.5 opacity-60 group-hover:opacity-100" />
            <span class="absolute top-[51%] left-[52%] -translate-x-1/2 -translate-y-1/2 text-slate-700/50 group-hover:text-slate-700/70 text-sm font-bold text-shadow">RERUN</span>
          </div>
        </div>
      </div>
    
      <div class="absolute right-20 top-[8%] flex flex-col pb-20 items-end">
        <div class="relative max-w-[41%]">
          <p class="relative text-slate-700/80 text-base font-light text-shadow text-right z-[10]">
            <strong class="font-bold">What Is SAM?</strong> This Stabilization Analysis Model (SAM) is a simulator that forces Argon into a death-spiral using Terra's collapse 
            as its blueprint. Terra was one of the largest cypto failures in history, losing $18.7 billion in days. No stablecoin has shown an ability to survive such a 
            death-sprial, which makes Terra the ideal scenario to test Argon.
          </p>

          <div ref="configSectionRef" class="absolute top-full translate-y-7 right-0 z-[10]">
            
            <section class="divide-y divide-slate-400/40 border-b border-slate-400/40 whitespace-nowrap uppercase text-sm text-right">
              <h3 class="pt-1 pb-2 font-semibold text-base">CONFIGURE BASIC PROPERTIES</h3>
              <div class="relative py-2 pl-3">
                LIQUID LOCKING OF BITCOIN IS AT
                <EditorButton id="btcVaultCapacityPct" type="percent" v-model="rules.btcVaultCapacityPct" />
                CAPACITY
              </div>
              <div class="relative py-2 pl-3">
                A MAX OF
                <EditorButton id="btcMaxTxnsPerHour" type="number" v-model="rules.btcMaxTxnsPerHour" />
                BITCOINS CAN UNLOCK PER HOUR
              </div>
            </section>

            <div class="absolute -bottom-5 right-0 flex flex-row space-x-4 whitespace-nowrap translate-y-full justify-end">
              <span VideoLink @click="openVideo" class="text-fuchsia-600 hover:text-fuchsia-500 cursor-pointer flex flex-row items-center pl-1 font-bold">
                <PlayOutlined OutlineIcon class="w-6 h-6 inline-block" />
                <PlaySolid SolidIcon class="w-6 h-6 inline-block" />
                <span class="inline-block underline decoration-dashed decoration-fuchsia-300 underline-offset-4 ml-2">Watch <em class="italic">The Antidote</em></span>
              </span>
              <button @click="openConfiguration" class="border border-slate-400 text-fuchsia-700 py-1.5 px-6 rounded-md bg-white/50 hover:bg-white/100">
                Edit All Properties
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
    <PlayerOverlay />
    <EditingOverlay />
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { IFilterName, useBasicStore } from '../store';
import Chart from '../components/Chart.vue';
import PlayerOverlay from '../overlays/PlayerOverlay.vue';
import EditingOverlay from '../overlays/EditingOverlay.vue';
import { storeToRefs } from 'pinia';
import emitter from '../emitters/basic';
import ChartBg from '../components/ChartBg.vue';
import EditorButton from '../components/EditorButton.vue';
import PlayOutlined from '../assets/play-outlined.svg';
import PlaySolid from '../assets/play-solid.svg';
import RerunIcon from '../assets/rerun.svg';

dayjs.extend(utc);

const basicStore = useBasicStore();
const { selectedFilter, rules, simulationData, dollarMarkers, needsRerun } = storeToRefs(basicStore);

const chartRef = Vue.ref<typeof Chart | null>(null);
const daysToRecover = Vue.ref(0);

const isDragging = Vue.ref(false);
const componentElement = Vue.ref(null);

const startDragMeta: { startX: number, side: string | null } = Vue.ref({ startX: 0, side: null });

const dragMeta: any = {};
const selector = Vue.ref({ left: 0, width: 0, isActive: false });
const dragSelection: Vue.Ref<null | any> = Vue.ref();

function runEngine() {
  basicStore.runEngine();
}

function openVideo() {
  emitter.emit('openVideo');
}

function openConfiguration() {
  emitter.emit('openEditing');
}

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
  const markers = simulationData.value.markers;
  const phases: any = {};

  for (const [name, phase] of Object.entries(simulationData.value.phases) as any) {
    phases[name] = {
      firstItem: markers[phase.firstItem],
      lastItem: markers[phase.lastItem],
    }
  }

  xAxisUpdate(selectedFilter.value, phases);

  let accumulatedSeigniorage = 0;
  let accumulatedArgonLoss = 0;

  // connect each item to the next and previous item
  for (const [index, item] of markers.entries()) {
    const seigniorageProfits: number[] = Object.values(item.seigniorageMap as any);
    const addedSeigniorageProfits = seigniorageProfits.reduce((acc: number, curr: number) => acc + curr, 0);

    accumulatedSeigniorage += addedSeigniorageProfits;
    accumulatedArgonLoss += item.argonLossDueToFear;
    item.seigniorageProfits = accumulatedSeigniorage;
    item.argonLossDueToFear = accumulatedArgonLoss;

    item.next = markers[index + 1] || item;
    item.previous = markers[index - 1] || item;
    item.dollar = dollarMarkers.value[index];
  }
  
  chartRef.value?.reloadData(markers, dollarMarkers.value);
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
        id: 'collapse',
        bgColor: '#F36F6F',
        ...phases.collapse,
      }, {
        id: 'recovery',
        bgColor: ['#F36F6F', '#93CD61'],
        ...phases.recovery,
      }, {
        id: 'regrowth',
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
        id: 'regrowth',
        label: 'Stabilized and Growing',
        bgColor: '#93CD61',
        ...phases.regrowth,
      }
    ]);
  } else if (newSelectedFilter === 'collapsedForever') {
    xAxisPhases.value.push(...[
      {
        id: 'collapse',
        bgColor: '#F36F6F',
        ...phases.collapse,
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

<style lang="scss">
.MainPanel.Component {  
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
}
</style>