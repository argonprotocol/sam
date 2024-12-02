import * as Vue from 'vue';
import { defineStore } from 'pinia'
import baseRules, { IRules } from './lib/RulesConfig';
import BaseScenario from './lib/BaseScenario';
import EngineWorker from './workers/engine.ts?worker';
import DollarInflation from './engine/DollarInflation';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';

export type IPanelName = 'tour' | 'runner' | 'base';
export type IFilterName = 'collapsedForever' | 'collapseThenRecover' | 'collapsingRecovery';

const config = JSON.parse(sessionStorage.getItem('config') || '{}');
const storedRules = JSON.parse(sessionStorage.getItem('rules') || 'null');
const data: any = {};
const worker = new EngineWorker();

export const useBasicStore = defineStore('help', () => {
  const isLoading: Vue.Ref<boolean> = Vue.ref(true);
  const isRunning: Vue.Ref<boolean> = Vue.ref(config.isRunning || false);
  const isReady = Vue.computed(() => !isLoading.value && !isRunning.value);

  const needsRerun: Vue.Ref<boolean> = Vue.ref(false);

  const tourStep: Vue.Ref<number> = Vue.ref(config.tourStep || 0);
  const completedWelcome: Vue.Ref<boolean> = Vue.ref(config.completedWelcome || false);

  const selectedFilter: Vue.Ref<IFilterName> = Vue.ref(config.selectedFilter || 'collapseThenRecover');
  const rules: Vue.Ref<IRules> = Vue.ref(storedRules || { ...baseRules });
  
  const pendingMarkers: Vue.Ref<any[]> = Vue.ref([]);
  const simulationData: Vue.Ref<any> = Vue.ref({ markers: [], phases: {} });
  const dollarMarkers: Vue.Ref<any[]> = Vue.ref([]);
  
  worker.onmessage = (event) => {
    simulationData.value.markers.push(...event.data.markers);
    pendingMarkers.value.push(...event.data.markers);
    if (event.data.isFinished) {
      simulationData.value.phases = event.data.phases;
      setConfig({ isRunning: false });
      setToIdb('simulationData', JSON.stringify(simulationData.value));
      console.log('FINISHED');
    }
    console.log('updated markers', simulationData.value.markers.length);
  };

  function setConfig(data: any) {
    tourStep.value = data.tourStep ?? tourStep.value;
    completedWelcome.value = data.completedWelcome ?? completedWelcome.value;
    isRunning.value = data.isRunning ?? isRunning.value;
    selectedFilter.value = data.selectedFilter ?? selectedFilter.value;
    
    sessionStorage.setItem('config', JSON.stringify({
      tourStep: tourStep.value,
      completedWelcome: completedWelcome.value,
      isRunning: isRunning.value,
      selectedFilter: selectedFilter.value
    }));
  }

  function resetConfig() {
    sessionStorage.removeItem('config');
    sessionStorage.removeItem('rules');
    delFromIdb('simulationData');
  }

  function runEngine() {
    setConfig({ isRunning: true });
    simulationData.value.markers = [];
    simulationData.value.phases = {};
    pendingMarkers.value = [];
    needsRerun.value = false;
    const rulesStr = JSON.stringify(rules.value);
    sessionStorage.setItem('rules', rulesStr);
    worker.postMessage({ rules: JSON.parse(rulesStr), emitEvery: 5 });
  }
  
  Vue.watch(rules, () => {
    needsRerun.value = true;
  }, { deep: true });

  async function loadData() {
    if (isRunning.value) {
      runEngine();
    } else {
      const storedData = await getFromIdb('simulationData');
      if (storedData) {
        simulationData.value = JSON.parse(storedData);
      } else {
        data[selectedFilter.value] = data[selectedFilter.value] || await BaseScenario.get(selectedFilter.value);
        simulationData.value = data[selectedFilter.value];
      }

      const markers = simulationData.value.markers;
      const dollarInflation = new DollarInflation(rules.value);
      dollarMarkers.value = dollarInflation.generateMarkersForRange(markers[0].startingDate, markers[markers.length - 1].endingDate);  
    }
  
    isLoading.value = false;
  }

  return {
    isLoading,
    isReady,
    isRunning,
    tourStep,
    completedWelcome,
    selectedFilter, 
    rules,
    simulationData,
    dollarMarkers,
    needsRerun,
    pendingMarkers,
    loadData,
    setConfig,
    resetConfig,
    runEngine
  }
});
