<template>
  <div class="CHART COMPONENT GLOBAL-BOX relative flex flex-col pt-1">
    <h2 class="text-xl mx-2 font-extralight py-3 pl-2 relative">
      THE RESULTS
      <div class="absolute bottom-0 left-0 w-full h-[1px]" style="background: linear-gradient(to right, rgb(203 213 225) 70%, rgba(203, 213, 225, 0) 100%)"></div>
    </h2>
    
    <div class="flex flex-row grow my-2 mr-2">
      <ul @click="toggleYAxis" class="text-sm text-right text-slate-400 flex flex-col justify-between border-r border-slate-300 pr-2 w-14 ml-1 mb-8 hover:bg-slate-100 cursor-pointer">
        <li>{{xSymbol}}2.00</li>
        <li>{{xSymbol}}1.75</li>
        <li>{{xSymbol}}1.50</li>
        <li>{{xSymbol}}1.25</li>
        <li>{{xSymbol}}1.00</li>
        <li>{{xSymbol}}0.75</li>
        <li>{{xSymbol}}0.50</li>
        <li>{{xSymbol}}0.25</li>
        <li>{{xSymbol}}0.00</li>
      </ul>
      <div class="grow flex flex-col">
        <div class="grow relative">
          <div class="absolute -top-8 -bottom-4 -left-4 -right-2 z-10">
            <ApexChart
              width="100%"
              height="100%"
              type="line"
              :options="chartOptions"
              :series="chartSeries"
            ></ApexChart>
          </div>

          <div class="absolute left-0 w-full top-[50%] h-2 mt-[-0.5%] border-b-4 border-dotted border-slate-300 z-0"></div>
          <div @click="runSimulation('recovery')" v-if="stepStage >= 3" :class="{previousRunning: stepStage === 3, current: stepStage === 4}" :style="`left: ${recoveryLeftPos}%; top: ${recoveryTopPos}%`" @mouseenter="iconEnter('recovery')" @mouseleave="iconLeave()" class="MARKER cursor-pointer rounded-full bg-white shadow-md absolute z-20 border border-slate-400 ml-[2px]">
            <!-- <RecoveryIcon class="w-full" /> -->
          </div>
          <div @click="runSimulation('collapse')" v-if="stepStage >= 1" :class="{previousRunning: stepStage === 1, current: stepStage === 2}" :style="`left: ${collapseLeftPos}%`" @mouseenter="iconEnter('collapse')" @mouseleave="iconLeave()" class="MARKER cursor-pointer rounded-full bg-white shadow-md absolute top-[50%] z-20 border border-slate-400">
            <!-- <CollapseIcon class="w-full" /> -->
          </div>
          <div @click="runSimulation('start')" :class="{current: stepStage === 0}" @mouseenter="iconEnter('start')" @mouseleave="iconLeave()" class="MARKER cursor-pointer rounded-full bg-white shadow-md absolute -left-1.5 top-[50%] z-20 border border-slate-400">
            <!-- <StartIcon class="w-full" /> -->
          </div>
        </div>
        <div class="X-AXIS h-8 text-sm text-slate-400 border-t border-slate-300">
          <ul class="flex flex-row justify-around pt-0.5 text-center">
            <li class="border-l border-slate-300" style="width: 4.7619047619%;">2020</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2021</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2022</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2023</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2024</li>
            <li class="border-l border-r border-slate-300" style="width: 19.0476190476%;">2025</li>
          </ul>
        </div>
      </div>  
    </div>
    
    <div class="relative h-10 overflow-hidden flex flex-row mb-1.5 opacity-50">
      <div class="absolute left-0 top-0 w-20 h-full z-20" style="background: linear-gradient(to right, rgba(255,255,255,1) 5%, rgba(255,255,255,0) 100%);"></div>
      <div class="absolute top-[50%] mt-[-3px] left=0 w-full h-2 overflow-hidden flex flex-row">
        <div v-for="i in 69" :key="i" class="LINK" style="width: 1.0%; margin-right: 0.4225352113%"  :style="i===1 ? 'margin-left: 1.03%' : ''"></div>  
      </div>
      <div v-for="i in 70" :key="i" class="BLOCK" style="width: 1%; margin-right: 0.4225352113%" :style="i===1 ? 'margin-left: 0.4225352113%' : ''"></div>
    </div>

  </div>
</template>

<script setup lang="ts">
  import * as Vue from 'vue';
  import { storeToRefs } from 'pinia';
  import ApexChart from 'vue3-apexcharts';
  import { createChartOptions } from '../lib/Charts';
  import StartIcon from '@/assets/start-icon.svg';
  import CollapseIcon from '@/assets/collapse-icon.svg';
  import RecoveryIcon from '@/assets/recovery-icon.svg';
  import { useBasicStore } from '@/stores/basic';
  import API from '@/lib/API';

  const stepStage = Vue.ref<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

  const cachedData = {
    start: [],
    collapse: [],
    recovery: [],
  };

  const basicStore = useBasicStore();
  const { asset, rules, rulesToHighlight } = storeToRefs(basicStore);

  const xSymbol = Vue.ref('');

  const chartOptions = Vue.ref(createChartOptions({
    chartType: 'line',
    strokeType: 'dashed',
  }));

  const chartSeries = Vue.ref<any>([
    {
      data: [],
    },
  ]);

  const collapseLeftPos = Vue.ref(-0.65); // to 30%;
  const recoveryLeftPos = Vue.ref(-0.65); // to 30%;
  const recoveryTopPos = Vue.ref(50); // to 30%;

  function toggleYAxis() {
    xSymbol.value = !xSymbol.value ? '$' : '';
  }

  function iconEnter(icon: string) {
    rulesToHighlight.value = icon;
  }

  function iconLeave() {
    rulesToHighlight.value = '';
  }

  async function injectIntoGraph(tmpData: any, step: 'start' | 'collapse' | 'recovery', dollarData?: any) {
    const chartData = [];
    if (step === 'collapse') {
      chartData.push(...cachedData.start);
    }
    if (step === 'recovery') {
      chartData.push(...cachedData.start);
      chartData.push(...cachedData.collapse);
    }
    for (const [index, item] of tmpData.entries()) {
      const pctProgress = index / tmpData.length;
      chartData.push(item);
      chartSeries.value = [{ data: [] }, { data: chartData }];
      if (step === 'start') {
        collapseLeftPos.value = (30.65 * pctProgress) - 0.65;
        recoveryLeftPos.value = (30.65 * pctProgress) - 0.65;
      } else if (step === 'collapse') {
        recoveryTopPos.value = 100 - (item[1] * 50);
        recoveryLeftPos.value += 0.05218525766;
      }
      if (step === 'start' && chartData.length % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      } else if (step === 'collapse') {
        await new Promise(resolve => setTimeout(resolve, 1));
      } else if (step === 'recovery' && chartData.length % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    if (dollarData) {
      chartSeries.value = [{ data: dollarData }, { data: chartData }];
    }
    if (step === 'start') {
      stepStage.value = 2;
    } else if (step === 'collapse') {
      stepStage.value = 4;
    } else if (step === 'recovery') {
      stepStage.value = 6;
    }
  }

  function runSimulation(step: 'start' | 'collapse' | 'recovery') {
    let lastDate = '';
    let lastPrice = 0;

    if (step === 'start') {
      stepStage.value = 1;
    } else if (step === 'collapse') {
      chartOptions.value.chart.animations.enabled = false;
      stepStage.value = 3;
      const lastIndex = cachedData['start'].length - 1;
      const lastChartItem = cachedData['start'][lastIndex];
      lastDate = lastChartItem[0];
      lastPrice = lastChartItem[1];
    } else if (step === 'recovery') {
      stepStage.value = 5;
      const lastIndex = cachedData['collapse'].length - 1;
      const lastChartItem = cachedData['collapse'][lastIndex];
      lastDate = lastChartItem[0];
      lastPrice = lastChartItem[1];
    }
    
    const request = {
      asset: asset.value,
      rules: rules.value[asset.value],
      lastDate: lastDate,
      lastPrice: lastPrice,
    };
    API.getSimulationData(step, request).then(async (data: any) => {
      cachedData[step] = data.chartMarkers;
      if (step === 'recovery') {
        const endingDate = data.chartMarkers[data.chartMarkers.length - 1][0];
        const dollarResponse = await runDollar(new Date(endingDate));
        const dollarData = dollarResponse.dollarMarkers.map((item: any) => [item.date, item.price]);
        injectIntoGraph(data.chartMarkers, step, dollarData);
      } else {
        injectIntoGraph(data.chartMarkers, step);
      }
    });
  }

  async function runDollar(endingDate: Date) {
    const request = {
      endingDate,
      rules: rules.value[asset.value],
    };
    return await API.getDollarData(request);
  }
</script>

<style lang="scss">
.CHART.COMPONENT {
  .BLOCK {
    width: 15px;
    height: 100%;
    border: 4px solid #979797;
  }
  .LINK {
    height: 8px;
    background: #979797;
    border-top: 2px solid #F9FAFD;
    border-bottom: 2px solid #F9FAFD;
  }
  .MARKER {
    width: 14px;
    height: 14px;
    margin-top: -7px;
    &.current {
      svg {
        opacity: 1;
      }
    }
    &.prevousRunning {
      svg {
        opacity: 0;
      }
    }
    svg {
      opacity: 0.3;
    }
  }
}
</style>