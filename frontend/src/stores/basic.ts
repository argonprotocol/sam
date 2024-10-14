import * as Vue from 'vue';
import { defineStore } from 'pinia'
import { getScenario, IScenarioId, IScenario } from '../lib/PrebuiltScenarios';

export type IToggleView = 'formula' | 'chart';

export const useBasicStore = defineStore('help', () => {
  const isHelpOpen = Vue.ref(false);
  const mainPanel: Vue.Ref<IToggleView> = Vue.ref('formula');
  const scenarioId: Vue.Ref<IScenarioId> = Vue.ref(localStorage.getItem('scenarioId') as IScenarioId || 'terra');  
  const rules: Vue.Ref<IScenario> = Vue.ref(getScenario(scenarioId.value));
  
  function toggleHelp() {
    isHelpOpen.value = !isHelpOpen.value;
  }

  function setMainPanel(name: IToggleView) {
    mainPanel.value = name;
  }

  function setScenarioId(id: IScenarioId) {
    scenarioId.value = id;
    localStorage.setItem('scenarioId', id);
    rules.value = getScenario(id);
  }
  


  return { isHelpOpen, mainPanel, rules, scenarioId, toggleHelp, setMainPanel, setScenarioId }
});