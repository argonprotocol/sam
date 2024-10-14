<template>
  <div v-if="isLoaded" class="FORMULA COMPONENT relative flex flex-col pt-1">
    <div FormulaGrid class="grow mt-10 relative flex flex-col">
      <div class="text-md text-slate-400 text-center opacity-70 uppercase">
        <span :FadeWhenDragging="isDragging" class="relative ml-6">
          <div IndependentArrowLeft @click="moveToPreviousPriceChange()" :class="selected.index ? '' : 'opacity-30 pointer-events-none'"></div>
          Snapshot for {{ selected.startingDate.format('MMMM D, YYYY') }}
          <div IndependentArrowRight v-if="selected.index < markers.length - 1" @click="moveToNextPriceChange()" class=""></div>
        </span>
      </div>
      <div class="flex flex-row h-full max-h-[600px] mx-[4%] mt-2">
        <div FormulaGridColumn1 :FadeWhenDragging="isDragging" class="col-start-1 flex flex-col pr-2 w-[28.8%]">
          <div SubBox @click="openEditor('speculativeGreed')" class="h-[23%]">
            <div number>${{ formatShorthandNumber(selected.capitalFromSpeculativeGreed) }}</div>
            <div label>Incoming Capital Based On Speculation</div>
          </div>
          <div class="flex-1 relative">
            <div VerticalLine class="bg-slate-400 w-1 h-[48%] absolute top-1 left-[30%]"></div>
            <div HorizontalLine class="ArrowRight bg-slate-400 h-1 w-[70%] absolute top-[48%] left-[30%]"></div>
            <div HorizontalLine v-if="rules.disableRecoveryDuringFall" class="ArrowRight Light bg-slate-300 h-1 w-[20%] absolute top-[48%] left-[80%]"></div>
            <LineBreakIcon v-if="rules.disableRecoveryDuringFall" class="absolute top-[48%] left-[80%] h-6 -mt-3" />

            <div VerticalLine class="bg-slate-400 w-1 h-[38%] absolute bottom-1 left-[30%]"></div>
            <div HorizontalLine class="ArrowRight bg-slate-400 h-1 w-[70%] absolute bottom-[38%] left-[30%]"></div>
            <div HorizontalLine v-if="rules.disableRecoveryDuringFall" class="ArrowRight Light bg-slate-300 h-1 w-[20%] absolute bottom-[38%] left-[80%]"></div>
            <LineBreakIcon v-if="rules.disableRecoveryDuringFall" class="absolute bottom-[35%] left-[80%] h-6 mt-3" />
          </div>
          <div SubBox @click="openEditor('certaintyGreed')" class="h-[23%]">
            <div number>${{ formatShorthandNumber(selected.capitalFromCertaintyGreed) }}</div>
            <div label>Incoming Capital Based On Certainty</div>
          </div>
        </div>
        
        <div FormulaGridColumn2 class="col-start-2 flex flex-col w-[42.4%] relative">
          <div :FadeWhenDragging="isDragging" class="h-[23%] relative">
            <div HorizontalLine :disabled="!rules.enableBitcoinVaulting" class="bg-slate-400 h-1 w-[22%] absolute top-[44%] -right-1"></div>
            <div HorizontalLine v-if="rules.disableRecoveryDuringFall" class="bg-slate-300 h-1 w-[11%] absolute top-[44%] right-[10%]"></div>
            <LineBreakIcon v-if="rules.disableRecoveryDuringFall && rules.enableBitcoinVaulting" class="absolute top-[44%] right-[10%] h-6 -mt-3" />

            <div VerticalLine :disabled="!rules.enableBitcoinVaulting" :class="[rules.disableRecoveryDuringFall ? 'bg-slate-300' : 'bg-slate-400']" class="w-1 h-[56%] absolute bottom-0 right-[21%]"></div>
            <div class="flex flex-col h-full justify-end ml-8">
              <div class="flex items-center">
                <input v-model="rules.enableDollarSeries" type="checkbox" class="mr-2 bg-transparent h-5 w-5 rounded border-gray-400 text-[#A1A8B9] focus:ring-[#A1A8B9]" id="enableDollarSeries">
                <label for="enableDollarSeries" class="font-light text-slate-400 select-none">Show Dollar Comparison</label>
              </div>
              <div class="mt-5 flex items-center">
                <input v-model="rules.disableRecoveryDuringFall" type="checkbox" class="mr-2 bg-transparent h-5 w-5 rounded border-gray-400 text-[#A1A8B9] focus:ring-[#A1A8B9]" id="disableRecoveryDuringFall">
                <label for="disableRecoveryDuringFall" class="font-light text-slate-400 select-none">Disable Recovery While Collapsing</label>
              </div>
            </div>
          </div>
          <div :FadeWhenDragging="isDragging" class="h-[4%] relative">
            <div VerticalLine :disabled="!rules.enableBitcoinVaulting" :class="[rules.disableRecoveryDuringFall ? 'bg-slate-300' : 'bg-slate-400']" class="w-1 h-full absolute bottom-0 right-[21%]"></div>
          </div>
          <div :FadeWhenDragging="isDragging" class="grow h-[2%] relative">
            <div VerticalLine :disabled="!rules.enableBitcoinVaulting" :class="[rules.disableRecoveryDuringFall ? 'bg-slate-300' : 'bg-slate-400']" class="w-1 h-full absolute bottom-2 right-[21%]"></div>
          </div>          
          <div :FadeWhenDragging="isDragging" class="grow min-h-[6%] relative">
            <div VerticalLine :disabled="!rules.enableBitcoinVaulting" :class="[rules.disableRecoveryDuringFall ? 'bg-slate-300 Light' : 'bg-slate-400']" class="ArrowBottom w-1 h-full absolute bottom-2 right-[21%]"></div>
          </div>
          <div :FadeWhenDragging="isDragging" class="flex flex-row text-center items-center h-[23%] ">
            <div MainBox class="flex-1 h-full">
              <div class="text-2xl font-bold">
                <span>${{ formatShorthandNumber(selected.endingCapital) }}</span>
                <span v-if="selected.capitalChangePct" class="text-sm font-normal relative top-[-0.36rem] ml-1">
                  <span class="text-slate-200">(</span><span :class="selected.capitalChangePct > 0 ? 'text-green-700' : 'text-red-500'">{{ addCommas(selected.capitalChangePct) }}%<span class="text-slate-200">)</span></span>
                </span>
              </div>
              <div class="font-light text-slate-400">CAPITAL DEMAND</div>
            </div>
            <div class="px-8 text-4xl relative h-full flex flex-col place-content-center">
              <span class="bg-[#E6EAF3] relative z-10 px-2">&divide;</span>
              <div HorizontalLine class="bg-slate-400 h-1 absolute top-[50%] left-2 right-2"></div>
              <div VerticalLine class="bg-slate-400 w-1 h-[50%] absolute top-[50%] left-[50%] -ml-0.5"></div>
            </div>
            <div MainBox class="flex-1 h-full">
              <div class="text-2xl font-bold">
                <span>₳{{ formatShorthandNumber(selected.endingCirculation) }}</span>
                <span v-if="selected.circulationChangePct" class="text-sm font-normal relative top-[-0.36rem] ml-1">
                  <span class="text-slate-200">(</span><span :class="selected.circulationChangePct > 0 ? 'text-green-700' : 'text-red-500'">{{ addCommas(selected.circulationChangePct) }}%<span class="text-slate-200">)</span></span>
                </span>
              </div>
              <div class="font-light text-slate-400">TOKEN SUPPLY</div>
            </div>
          </div>
          <div :FadeWhenDragging="isDragging" class="grow min-h-[6%] relative">
            <div VerticalLine class="ArrowBottom bg-slate-400 w-1 absolute top-0 bottom-2 left-[50%] -ml-0.5"></div>
          </div>
          <div MainBox class="w-8/12 h-[29%] mx-auto">
            <div class="text-3xl font-bold">
              <span>${{ formatPrice(selected.endingPrice) }} for ₳1.00</span>
              <span v-if="selected.priceChangePct" class="text-sm font-normal relative top-[-0.36rem] ml-1">
                <span class="text-slate-200">(</span><span :class="selected.priceChangePct > 0 ? 'text-green-700' : 'text-red-500'">{{ addCommas(selected.priceChangePct) }}%<span class="text-slate-200">)</span></span>
              </span>
            </div>
            <div class="font-light text-slate-400">EXCHANGE RATE</div>
          </div>
        </div>
      
        <div FormulaGridColumn3 :FadeWhenDragging="isDragging" class="col-start-3 whitespace-nowrap flex flex-col w-[28.8%]">
          <div class="flex flex-row h-[23%]">
            <div SubBox @click="openEditor('bitcoinVaulting')" :disabled="!rules.enableBitcoinVaulting" class="w-[64%] h-full ml-2">
              <div v-if="rules.enableBitcoinVaulting" class="flex flex-col">
                <div number>₳{{ formatShorthandNumber(selected.burnFromBitcoins) }} <span class="font-light">of</span> ₳{{ formatShorthandNumber(selected.startingBitcoinsCoverage) }}</div>
                <div label>Bitcoin Shorts Applied</div>
              </div>
              <div v-else class="flex flex-col text-[#D8A3A3] leading-none">
                <div class="text-[28px] font-bold">BITCOIN</div>
                <div class="text-2xl font-bold">DISABLED</div>
              </div>
            </div>
            <div class="flex flex-col w-[35%] pl-2" :class="{ 'opacity-20': !rules.enableBitcoinVaulting }">
              <div class="bg-slate-400 h-[1px] w-full opacity-40"></div>
              <div class="flex-1 flex flex-row items-center pl-2 opacity-50"><strong>{{ formatShorthandNumber(selected.startingBitcoinsVaulted) }}</strong>&nbsp;Bitcoins</div>
              <div class="bg-slate-400 h-[1px] w-full opacity-40"></div>
              <div class="flex-1 flex flex-row items-center pl-2 opacity-50"><strong>₳{{ formatShorthandNumber(selected.startingBitcoinsCoverage) }}</strong>&nbsp;Leverage</div>
              <div class="bg-slate-400 h-[1px] w-full opacity-40"></div>
            </div>
          </div>

          <div class="h-[4%]"></div>
          
          <div class="grow flex flex-row justify-end relative">
            <div HorizontalLine :disabled="!rules.enableTaxation" class="ArrowLeft bg-slate-400 h-1 absolute top-[48%] left-2 right-[71%]"></div>
            <div HorizontalLine v-if="rules.disableRecoveryDuringFall" class="ArrowLeft Light bg-slate-300 h-1 absolute top-[48%] left-2 right-[85%]"></div>
            <LineBreakIcon v-if="rules.disableRecoveryDuringFall && rules.enableTaxation" class="absolute top-[48%] right-[85%] h-6 -mt-3" />

            <div HorizontalLine :disabled="!rules.enableReservePurchasingPower" class="ArrowLeft bg-slate-400 h-1 absolute bottom-[36%] left-2 right-[77%]"></div>
            <div HorizontalLine v-if="rules.disableRecoveryDuringFall" class="ArrowLeft Light bg-slate-300 h-1 absolute bottom-[36%] left-2 right-[85%]"></div>
            <div VerticalLine :disabled="!rules.enableReservePurchasingPower" class="bg-slate-400 w-1 h-[37%] absolute bottom-0 right-[77%]"></div>
            <LineBreakIcon v-if="rules.disableRecoveryDuringFall && rules.enableReservePurchasingPower" class="absolute bottom-[32%] right-[85%] h-6 -mt-3" />

            <div SubBox @click="openEditor('taxation')" :disabled="!rules.enableTaxation" class="Large h-full w-[70%] flex flex-col">
              <div v-if="rules.enableTaxation" class="flex flex-col h-full">
                <div class="grow place-content-center">
                  <div number>₳{{ formatShorthandNumber(selected.burnFromMicropaymentTaxes) }}</div>
                  <div label>Micropayment Taxes</div>
                </div>
                <div class="">
                  <span class="relative text-sm font-bold opacity-30">
                    <div class="absolute -left-12 top-[50%] h-[1px] w-10 bg-slate-400"></div>
                    PLUS
                    <div class="absolute -right-12 top-[50%] h-[1px] w-10 bg-slate-400"></div>
                  </span>
                </div>
                <div class="grow place-content-center">
                  <div number>₳{{ formatShorthandNumber(selected.burnFromStandardTaxes) }}</div>
                  <div label>Standard Taxes</div>
                </div>
              </div>
              <div v-else class="flex flex-col text-[#D8A3A3]">
                <div class="text-3xl font-bold">TAXATION</div>
                <div class="text-3xl font-bold">DISABLED</div>
              </div>
            </div>
          </div>
          <div class="h-[4%] relative">
            <div VerticalLine :disabled="!rules.enableReservePurchasingPower" class="bg-slate-400 w-1 h-full absolute bottom-1 right-[77%]"></div>
          </div>
          
          <div class="flex flex-row h-[23%]">
            <div SubBox @click="openEditor('reservePurchasingPower')" :disabled="!rules.enableReservePurchasingPower" class="w-[64%] h-full ml-2">
              <div v-if="rules.enableReservePurchasingPower" class="flex flex-col">
                <div number>${{formatShorthandNumber(selected.reserveBurns)}} <span class="font-light">of</span> ${{formatShorthandNumber(selected.reserveCoverage)}}</div>
                <div label>Reserves Used</div>
              </div>
              <div v-else class="flex flex-col text-[#D8A3A3] leading-none">
                <div class="text-[23px] font-bold">RESERVES</div>
                <div class="text-2xl font-bold">DISABLED</div>
              </div>
            </div>
            <div class="flex flex-col w-[35%] pl-2">
              <div class="bg-slate-400 h-[1px] w-full" :class="[ rules.enableReservePurchasingPower ? 'opacity-40': 'opacity-30' ]"></div>
              <div class="flex-1 flex flex-row items-center pl-2" :class="[ rules.enableReservePurchasingPower ? 'opacity-50': 'opacity-25' ]"><strong>${{formatShorthandNumber(selected.reserveCapital)}}</strong>&nbsp;Capital</div>
              <div class="bg-slate-400 h-[1px] w-full" :class="[ rules.enableReservePurchasingPower ? 'opacity-40': 'opacity-30' ]"></div>
              <div class="flex-1 flex flex-row items-center pl-2" :class="[ rules.enableReservePurchasingPower ? 'opacity-50': 'opacity-25' ]"><strong>₳{{formatShorthandNumber(selected.reserveCoverage)}}</strong>&nbsp;Leverage</div>
              <div class="bg-slate-400 h-[1px] w-full" :class="[ rules.enableReservePurchasingPower ? 'opacity-40': 'opacity-30' ]"></div>
            </div>
          </div>

        </div>
      </div>
      <div class="relative grow z-30 h-14">
        <div VerticalLine ref="markerVerticalElement" class="h-12 w-1 bg-slate-400 absolute top-0.5 left-1/2 opacity-70 -ml-1"></div>
        <div HorizontalLine :class="[markerIsAnchoredLeft ? '' : '-ml-1']" :style="{ left: markerIsAnchoredLeft ? `${markerLinePos + 11}px` : '50%', right: markerIsAnchoredLeft ? '50%' : `${markerLinePos + 11}px` }" class="absolute h-1 bg-slate-400 opacity-70 top-12"></div>
        <div VerticalLine :style="`left: ${markerPosLeft + 11}px;`" class="h-[calc(100%-48px)] w-1 bg-slate-400 absolute top-12 left-6 opacity-70"></div>
        <div DateSlider
             :style="{ left: `${markerPosLeft+10}px`, transform: `translateX(-${selectedIndexPct * 91}%)` }"
             class="absolute top-16 bg-[#E6EAF3] text-sm"
             @mousedown="startDrag">
          <div IndependentArrowLeft :FadeWhenDragging="isDragging" v-if="selected.index > 0" @click="moveDateSlider(-1)" class=""></div>
          <span :style="{ cursor: sliderCursor }">{{ selected.startingDate.format('MMM D, YYYY') }}</span>
          <div IndependentArrowRight :FadeWhenDragging="isDragging" v-if="selected.index < markers.length - 1" @click="moveDateSlider(1)" class=""></div>
        </div>
      </div>
    </div>

    <div ChartWrapper class="BOTTOM-CHART flex flex-row pt-[2%] relative overflow-hidden">
      <div VerticalLine :style="`left: ${markerPosLeft + 11}px;`" class="ArrowBottom h-[calc(100%-117px)] w-1 bg-slate-400 absolute top-1 opacity-70 z-10"></div>
      <div class="GLOBAL-BOX grow flex flex-col mx-3 mb-2">
        <div ref="markerWrapperElement" class="grow relative min-h-[100px]" @mouseenter="chartMouseEnter" @mouseleave="chartMouseLeave">

          <div class="absolute -top-0 -bottom-3 -left-2 right-0 z-10">
            <ApexChart
              width="100%"
              height="100%"
              type="line"
              ref="chartElement"
              :options="chartOptions"
              :series="chartSeries"
              @mouse-move="chartMouseMove"
            ></ApexChart>
          </div>

          <div class="MARKER cursor-pointer rounded-full bg-[#63298E] shadow-md absolute left-2 top-[50%] z-20 border border-slate-400"></div>
          <div :style="`left: ${collapseLeftPos}%`" class="MARKER cursor-pointer rounded-full bg-[#63298E] shadow-md absolute top-[50%] z-20 border border-slate-400"></div>
          <div :style="`left: ${recoveryLeftPos}%; top: ${recoveryTopPos}%`" class="MARKER ONE cursor-pointer rounded-full bg-[#63298E] shadow-md absolute z-20 border border-slate-400"></div>

          <div SelectedMarker :style="`left: ${markerPosLeft}px; top: ${markerPosTop}%`" class="rounded-full bg-white shadow-md absolute z-20 border border-slate-400 w-4 h-4 -mt-4 -ml-2"></div>

          <div v-if="showShadowMarker" :style="`left: ${shadowMarkerLeftPos}px; top: ${shadowMarkerTopPos}%`" class="rounded-full bg-white shadow-md absolute z-20 border border-slate-400 w-4 h-4 -mt-4 -ml-2 opacity-50 ml-1"></div>
        </div>
        <div class="X-AXIS h-8 text-sm text-slate-400 border-t border-slate-300 mx-1">
          <ul class="flex flex-row justify-around pt-0.5 text-center">
            <li class="border-slate-300" style="width: 4.7619047619%;">2020</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2021</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2022</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2023</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2024</li>
            <li class="border-l border-slate-300" style="width: 19.0476190476%;">2025</li>
          </ul>
        </div>
      </div>  
    </div>
  </div>
  <div v-else Loading class="flex items-center justify-center h-full">Loading...</div>
</template>

<script setup lang="ts">
  import * as Vue from 'vue';
  import { storeToRefs } from 'pinia';
  import dayjs from 'dayjs';
  import utc from 'dayjs/plugin/utc';
  import ApexChart from 'vue3-apexcharts';
  import { createChartOptions } from '../lib/ChartConfig';
  import { useBasicStore } from '../stores/basic';
  import { addCommas, formatShorthandNumber } from '../lib/BasicUtils';
  import API from '../lib/API';
  import emitter from '../emitters/basic';
  import LineBreakIcon from '../assets/line-break.svg';

  dayjs.extend(utc);

  const CHART_LEFT_MARGIN = 14;
  const CHART_RIGHT_MARGIN = 10;

  const chartElement = Vue.ref<any | null>(null);
  const markerWrapperElement = Vue.ref<HTMLDivElement | null>(null);
  const markerVerticalElement = Vue.ref<HTMLDivElement | null>(null);

  const markers: Vue.Ref<any[]> = Vue.ref([]);
  
  const selectedIndexPct = Vue.ref(0);
  const selected = Vue.ref({
    index: 0,
    startingDate: dayjs.utc(),
    endingPrice: 0,
    endingCirculation: 0,
    endingCapital: 0,
    capitalFromSpeculativeGreed: 0,
    capitalFromCertaintyGreed: 0,
    startingLeverageShorts: 0,
    startingBitcoinsVaulted: 0,
    startingBitcoinsCoverage: 0,

    burnFromBitcoins: 0,
    burnFromMicropaymentTaxes: 0,
    burnFromStandardTaxes: 0,

    reserveBurns: 0,
    reserveCapital: 0,
    reserveCoverage: 0,

    capitalChangePct: 0,
    circulationChangePct: 0,
    priceChangePct: 0,
  });

  const basicStore = useBasicStore();
  const { rules, scenarioId } = storeToRefs(basicStore);
  
  const chartOptions = Vue.ref(createChartOptions({
    chartType: 'line',
    strokeType: 'dashed',
  }));

  let dollarSeries = Vue.ref<any[]>([]);
  const chartSeries = Vue.ref<any>([
    {
      data: [],
    },
  ]);

  const isLoaded = Vue.ref(false);

  const showShadowMarker = Vue.ref(false);

  const markerPosLeft = Vue.ref(10);
  const markerPosTop = Vue.ref(50);
  const markerLinePos = Vue.ref(10);
  const markerIsAnchoredLeft = Vue.ref(true);
  
  const collapseLeftPos = Vue.ref(-0.65); // to 30%;
  const recoveryLeftPos = Vue.ref(0.65); // to 30%;
  const recoveryTopPos = Vue.ref(50); // to 30%;

  const shadowMarkerLeftPos = Vue.ref(14);
  const shadowMarkerTopPos = Vue.ref(50);

  let chartData = [];

  async function injectIntoGraph(serverData: any) {
    markers.value = [
      ...serverData.startData,
      ...serverData.collapseData,
      ...serverData.recoveryData,
    ];
    chartData = markers.value.map((m: any) => [m.startingDate, m.endingPrice]);
    dollarSeries = serverData.dollarData.map((m: any) => [m.startingDate, m.endingPrice]);
    
    const startOfCollapsePct = serverData.startData.length / chartData.length;
    collapseLeftPos.value = startOfCollapsePct * 100;

    const startOfReceoveryPct = (serverData.startData.length + serverData.collapseData.length) / chartData.length;
    const lastCollapseItem = serverData.collapseData[serverData.collapseData.length - 1];
    recoveryLeftPos.value = (startOfReceoveryPct * 100);
    recoveryTopPos.value = 100 - (lastCollapseItem.endingPrice * 100);

    chartSeries.value = [{ data: [] }, { data: chartData }];
    updateDollarSeries();
  }

  function openEditor(editorType: 'speculativeGreed' | 'certaintyGreed' | 'recoveryDuringFall' | 'reservePurchasingPower' | 'taxation' | 'bitcoinVaulting') {
    emitter.emit('openEditor', editorType);
  }

  function selectMarker(index: number) {
    const marker = markers.value[index];
    if (!marker) {
      console.log('no marker', index, markers.value);
    }
    
    selected.value.index = index;
    selected.value.startingDate = dayjs.utc(marker.startingDate);
    selected.value.endingPrice = marker.endingPrice;

    selected.value.endingCirculation = marker.endingCirculation;
    selected.value.endingCapital = marker.endingCapital;

    const startingReserveMeta = marker.startingReserveMeta;
    selected.value.reserveBurns = marker.circulationRemovedMap.ReserveSpend || 0;
    selected.value.reserveCapital = startingReserveMeta.amountRemaining;
    selected.value.reserveCoverage = startingReserveMeta.amountRemaining *  startingReserveMeta.leveragePerDollar;

    selected.value.capitalFromCertaintyGreed = marker.capitalAddedMap.CertaintyGreed || 0
    selected.value.capitalFromSpeculativeGreed = marker.capitalAddedMap.SpeculativeGreed || 0

    const startingVaultMeta = marker.startingVaultMeta;
    selected.value.startingBitcoinsVaulted = startingVaultMeta.bitcoins;
    selected.value.startingBitcoinsCoverage = startingVaultMeta.lockedValue * startingVaultMeta.leveragePerDollar;
    selected.value.burnFromBitcoins = marker.circulationRemovedMap.BitcoinFusion || 0;
    selected.value.burnFromMicropaymentTaxes = marker.circulationRemovedMap.MicropaymentTaxes || 0;
    selected.value.burnFromStandardTaxes = marker.circulationRemovedMap.TransactionalTaxes || 0;

    selected.value.priceChangePct = formatChangePct((marker.endingPrice - marker.startingPrice) / marker.startingPrice);

    selected.value.capitalChangePct = formatChangePct((marker.endingCapital - marker.startingCapital) / marker.startingCapital);
    selected.value.circulationChangePct = formatChangePct((marker.endingCirculation - marker.startingCirculation) / marker.startingCirculation);
    // if (selected.value.circulationChangePct !== 0) {
    //   console.log('circulationChangePct', selected.value.circulationChangePct, (marker.endingCirculation - marker.startingCirculation) / marker.startingCirculation);
    // }
    selectedIndexPct.value = index / (markers.value.length - 1);
    setMarkerPositionBasedOnIndex(index);
  }

  function formatChangePct(pct: number) {
    if (pct === 0 || Math.abs(pct) === 100) return pct;

    let formatted = Math.round(pct * 100); // Initially round to whole number
    if (formatted !== 0 && Math.abs(formatted) !== 100) return formatted;

    let decimals = 0;
    while (true) {
      formatted = Math.round(pct * Math.pow(10, decimals + 2)) / Math.pow(10, decimals);
      if (formatted !== 0 && Math.abs(formatted) !== 100) {
        console.log('formatted', formatted, pct);
        return formatted;
      }
      decimals++;
      if (decimals > 10) {
        console.log('decimals', decimals, pct);
        return  Math.round(pct * 100); // Prevent infinite loop
      }
    }
  }

  async function runSimulation() {    
    const request = {
      rules: rules.value,
    };
    const serverData: any = await API.getSimulationData(request);
    await injectIntoGraph(serverData);
    selectMarker(0);
  }

  async function load() {
    await runSimulation();
    isLoaded.value = true;
    setTimeout(() => {
      selectMarker(0);
    }, 100);
  }

  function chartMouseMove(event: any) {
    // if (chartSeries.value.length < 2 || !chartSeries.value[1].data.length) return;

    // const gElement = chartElement.value?.$el.querySelector('svg g.apexcharts-line-series.apexcharts-plot-series');
    // const gRect = gElement?.getBoundingClientRect();

    // const leftMargin = 20;
    // const rightMargin = 130;

    // const rectLeft = gRect.left + leftMargin;
    // const rectRight = gRect.right - rightMargin;
    // const rectWidth = rectRight - rectLeft;

    // let pointerX = event.layerX - rectLeft;
    // if (pointerX < 0) pointerX = 0;
    // if (pointerX > rectWidth) pointerX = rectWidth;

    // const pointerXPct = pointerX / rectWidth;
    // const chartDataIndex = Math.round((pointerXPct - 0.019) * (chartSeries.value[1].data.length + 1));
    // const chartDataItem = chartSeries.value[1].data[chartDataIndex];
    // const price = chartDataItem[1];

    // shadowMarkerLeftPos.value = pointerXPct * 100;
    // if (shadowMarkerLeftPos.value > 98.8) shadowMarkerLeftPos.value = 98.8;

    // shadowMarkerTopPos.value = 100 - (price * 50);
  }

  function chartMouseEnter() {
    showShadowMarker.value = true;
  }

  function chartMouseLeave() {
    showShadowMarker.value = false;
  }

  function moveDateSlider(direction: 1 | -1) {
    selectMarker(selected.value.index + direction);
  }

  function moveToNextPriceChange() {
    for (let i = selected.value.index; i < markers.value.length; i++) {
      if (markers.value[i].endingPrice !== selected.value.endingPrice) {
        selectMarker(i);
        return;
      }
    }
    selectMarker(markers.value.length + 1);
  }

  function moveToPreviousPriceChange() {
    for (let i = selected.value.index; i > 0; i--) {
      if (markers.value[i].endingPrice !== selected.value.endingPrice) {
        selectMarker(i);
        return;
      }
    }
    selectMarker(0);
  }

  const dragMeta: any = {};
  const isDragging = Vue.ref(false);
  const sliderCursor = Vue.ref('grab');

  function startDrag(event: MouseEvent) {
    const wrapperRect = markerWrapperElement.value?.getBoundingClientRect() as DOMRect;

    isDragging.value = true;
    dragMeta.startX = event.clientX;
    dragMeta.startXBaseline = event.clientX - (wrapperRect.left + CHART_LEFT_MARGIN);
    dragMeta.startMarkerPos = markerPosLeft.value;
    dragMeta.startWrapperWidth = wrapperRect.width;
    dragMeta.startWrapperLeft = wrapperRect.left;
    dragMeta.startMarkerIndex = selected.value.index;
    sliderCursor.value = 'grabbing';

    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    updateDollarSeries(false);
  }

  function onDrag(event: MouseEvent) {
    if (!isDragging.value) return;

    const leftBaseline = dragMeta.startWrapperLeft + CHART_LEFT_MARGIN;
    const rightBaseline = dragMeta.startWrapperLeft + dragMeta.startWrapperWidth - CHART_RIGHT_MARGIN;
    const deltaXBaseline = event.clientX - leftBaseline;
    const deltaXBaselineChange = deltaXBaseline - dragMeta.startXBaseline;
    const totalMarkers = markers.value.length - 1;

    if (deltaXBaselineChange > 0) {
      const lengthToMove = rightBaseline - dragMeta.startX;
      const dragRightPct = deltaXBaselineChange / lengthToMove;
      const markerIndexIncrement = Math.round((totalMarkers - dragMeta.startMarkerIndex) * dragRightPct);
      const markerIndex = Math.min(totalMarkers, dragMeta.startMarkerIndex + markerIndexIncrement);
      selectMarker(Math.max(0, markerIndex));
    } else if (deltaXBaselineChange < 0) {
      const lengthToMove = dragMeta.startX- leftBaseline;
      const dragLeftPct = 1 - Math.abs(deltaXBaselineChange / lengthToMove);
      const markerIndex = Math.max(0, Math.round(dragMeta.startMarkerIndex * dragLeftPct));
      selectMarker(Math.max(0, markerIndex));
    }
  }

  function stopDrag() {
    isDragging.value = false;
    sliderCursor.value = 'grab';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    updateDollarSeries();
  }

  function setMarkerPositionBasedOnIndex(index: number) {
    const marker = markers.value[index];
    const indexPct = index / markers.value.length;
    const wrapperRect = markerWrapperElement.value?.getBoundingClientRect() as DOMRect;
    if (!wrapperRect) return;

    const markerSubtractFromRight = wrapperRect.width;
    const markerVerticalLeft = (markerVerticalElement.value?.getBoundingClientRect().left || 0) - 17;
    const wrapperWidth = wrapperRect.width - (CHART_LEFT_MARGIN + CHART_RIGHT_MARGIN);
    markerPosLeft.value = (wrapperWidth * indexPct) + CHART_LEFT_MARGIN;

    if (markerPosLeft.value > markerVerticalLeft) {
      markerIsAnchoredLeft.value = false;
      markerLinePos.value = markerSubtractFromRight - markerPosLeft.value;
    } else {
      markerIsAnchoredLeft.value = true;
      markerLinePos.value = markerPosLeft.value;
    }

    markerPosTop.value = 100 - (marker.endingPrice * 50);
  }

  function formatPrice(price: number) {
    if (price < 0.10 && price.toFixed(3).charAt(4) !== '0') {
      return price.toFixed(3);
    } else  {
      return price.toFixed(2);
    }
  }

  function updateDollarSeries(override?: boolean) {
    const enable = override !== undefined ? override : rules.value.enableDollarSeries;
    if (enable) {
      chartSeries.value[0].data = dollarSeries;
    } else {
      chartSeries.value[0].data = [];
    }
  }

  Vue.watch(() => scenarioId.value, async (newScenarioId, oldScenarioId) => {
    if (newScenarioId !== oldScenarioId) {
      isLoaded.value = false;
      load();
    }
  });

  Vue.watch(() => rules.value.enableDollarSeries, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      updateDollarSeries();
    }
  });

  load();
</script>

<style lang="scss">
.FORMULA.COMPONENT {
  .BOTTOM-CHART {
    position: relative;
    &:before {
      content: '';
      display: block;
      position: absolute;
      top: 32px;
      left: -5px;
      width: calc(100% + 10px);
      height: 50%;
      background: linear-gradient(to bottom, rgb(230, 234, 243), rgba(230, 234, 243, 0));
      z-index: 1;
    }
  }

  [FormulaGrid] {
    [MainBox] {
      @apply flex flex-col place-content-center text-center py-3 cursor-pointer;
      background: #DEE3EF;
      border: 1px solid #A1A8B9;
      border-radius: 5px;
      &:hover {
        @apply border-slate-400;
        box-shadow: inset 1px 1px 0 0 rgba(255, 255, 255, 0.8);
        background: #e3e7ef;
      }
    }
    [SubBox] {
      @apply flex flex-col place-content-center text-center py-2 cursor-pointer;
      background: #e6eaf3;
      border: 1px solid rgba(161, 168, 185, 0.5);
      border-radius: 5px;
      [number] {
        @apply text-2xl font-bold opacity-50;
      }
      [label] {
        @apply font-light text-slate-400;
      }
      &:hover {
        @apply border-slate-400;
        box-shadow: inset 1px 1px 0 0 rgba(255, 255, 255, 1);
        background: rgba(255, 255, 255, 0.1);
      }

      &[disabled='true'] {
        position: relative;
        border: 1px solid rgba(180, 147, 147, 0.5);
      }
    }
  }

  [HorizontalLine][disabled='true'] {
    @apply bg-slate-300;
  }
  [HorizontalLine].ArrowRight:after {
    position: absolute;
    content: '';
    bottom: -5px;
    right: -3px;
    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 8px solid rgb(148 163 184);
    &.Light, &[disabled='true'] {
      @apply border-l-slate-300;
    }
  }

  [HorizontalLine].ArrowLeft:after {
    position: absolute;
    content: '';
    bottom: -5px;
    left: -3px;
    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-right: 8px solid rgb(148 163 184);
    &.Light, &[disabled='true'] {
      @apply border-r-slate-300;
    }
  }

  [VerticalLine][disabled='true'] {
    @apply bg-slate-300;
  }
  [VerticalLine].ArrowBottom:after {
    position: absolute;
    content: '';
    bottom: -3px;
    right: -5px;
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 8px solid rgb(148 163 184);
    &.Light, &[disabled='true'] {
      @apply border-t-slate-300;
    }
  }
  
  [DateSlider] {
    position: relative;
    display: inline-block;
    user-select: none;
  }

  [IndependentArrowRight] {
    content: '';
    position: absolute;
    right: -18px;
    top: 53%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 12px solid #94a3b8;
    cursor: pointer;
  }

  [IndependentArrowLeft] {
    content: '';
    position: absolute;
    left: -18px;
    top: 53%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 12px solid #94a3b8;
    cursor: pointer;
  }
  
  .MARKER {
    width: 10px;
    height: 10px;
    margin-top: -12px;
    pointer-events: none;
    &.ONE {
      margin-top: -8px;
    }
  }

  [FadeWhenDragging] {
    transition: opacity 0.3s ease-in-out;
  }
  [FadeWhenDragging='true'] {
    opacity: 0.2;
  }
}
</style>