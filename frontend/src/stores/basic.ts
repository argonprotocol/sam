import * as Vue from 'vue';
import { defineStore } from 'pinia'
import baseRules, { IRules } from '../lib/RulesConfig';
import { IStageName } from '../lib/API';
import CompressedStorage from 'compressedstorage';

export type IPanelName = 'tour' | 'runner' | 'base';
export type IFilterName = 'collapsedForever' | 'collapseThenRecover' | 'collapsingRecovery';

const compressedStorage = CompressedStorage(window.sessionStorage);

export const useBasicStore = defineStore('help', () => {
  const selectedPanel: Vue.Ref<IPanelName> = Vue.ref(compressedStorage.getItem('selectedPanel') as IPanelName || 'tour');
  const selectedFilter: Vue.Ref<IFilterName> = Vue.ref(compressedStorage.getItem('selectedFilter') as IFilterName || 'collapseThenRecover');
  
  const rules: Vue.Ref<IRules> = Vue.ref({ ...baseRules });
  
  const simulationData: Vue.Ref<any> = Vue.ref({
    start: getSimulationDataFromLocalStorage('start'),
    collapseThenRecover: getSimulationDataFromLocalStorage('collapseThenRecover'),
    collapsingRecovery: getSimulationDataFromLocalStorage('collapsingRecovery'),
    collapsedForever: getSimulationDataFromLocalStorage('collapsedForever'),
    dollar: getSimulationDataFromLocalStorage('dollar'),
  });

  const tourStep: Vue.Ref<number> = Vue.ref(0);

  function switchToPanel(name: IPanelName) {
    selectedPanel.value = name;
    compressedStorage.setItem('selectedPanel', name);
  }

  function saveFilter(name: IFilterName) {
    selectedFilter.value = name;
    compressedStorage.setItem('selectedFilter', name);
  }

  function saveSimulationData(stage: IStageName, data: any) {
    compressedStorage.setItem(`simulationData-${stage}`, JSON.stringify(data));
  }

  function getSimulationData(stage: IStageName) {
    return simulationData.value[stage as keyof typeof simulationData.value] || getSimulationDataFromLocalStorage(stage);
  }

  function resetToDefault() {
    sessionStorage.removeItem('selectedPanel');
    sessionStorage.removeItem('selectedFilter');
    sessionStorage.removeItem('simulationData-start');
    sessionStorage.removeItem('simulationData-collapseThenRecover');
    sessionStorage.removeItem('simulationData-collapsingRecovery');
    sessionStorage.removeItem('simulationData-collapsedForever');
    sessionStorage.removeItem('simulationData-dollar');
  }
  
  return { selectedPanel, selectedFilter, rules, tourStep, switchToPanel, saveFilter, saveSimulationData, getSimulationData, resetToDefault }
});

function getSimulationDataFromLocalStorage(stage: IStageName) {
  const dataString = compressedStorage.getItem(`simulationData-${stage}`);
  if (dataString) {
    return JSON.parse(dataString);
  }
  return undefined;
}
