import * as Vue from 'vue';
import { get as getFromIdb, set as setToIdb, del as delFromIdb, keys as getKeysFromIdb } from 'idb-keyval';
import EngineWorker from '../workers/engine.ts?worker';
import BaseScenario from '../lib/BaseScenario';
import DollarInflation from '../engine/DollarInflation';
import { IFilterName } from '../store';
import { IMarkerJson } from '../engine/Marker';
import IRules from '../interfaces/IRules';

let isStarted = false;
const worker = new EngineWorker();

export default class Engine {
  public isRunning: Vue.Ref<boolean>;
  public selectedFilter: Vue.Ref<IFilterName>;
  public simulationData: Vue.Ref<{ markers: IMarkerJson[], phases: any }>;
  public incomingMarkers: Vue.Ref<IMarkerJson[]>;
  public dollarMarkers: Vue.Ref<any[]>;
  public workerResponse: { markers: IMarkerJson[], phases: any } = { markers: [], phases: {} };
  public rules: IRules;

  private isInActiveMode = false;

  constructor(
    isRunning: Vue.Ref<boolean>,
    rules: IRules,
    selectedFilter: Vue.Ref<IFilterName>, 
    simulationData: Vue.Ref<{ markers: IMarkerJson[], phases: any }>, 
    incomingMarkers: Vue.Ref<IMarkerJson[]>, 
    dollarMarkers: Vue.Ref<any[]>,
  ) {
    if (isStarted) throw new Error('Cannot create more than one Engine instance');
    isStarted = true;

    this.isRunning = isRunning;
    this.rules = rules;
    this.selectedFilter = selectedFilter;
    this.simulationData = simulationData;
    this.incomingMarkers = incomingMarkers;
    this.dollarMarkers = dollarMarkers;

    worker.onmessage = (event) => this.handleWorkerMessage(event);
  }

  public async start(filterName: IFilterName) {
    this.isInActiveMode = (await getFromIdb('engineIsInActiveMode')) || false;
    await this.setFilter(filterName);
  }

  public run(filterName: IFilterName) {
    console.log('RUNing filter', filterName);
    if (!filterName) throw new Error('filterName is required');
    if (!this.isInActiveMode) {
      this.setActiveMode(true);
    }
    if (filterName === this.selectedFilter.value) {
      this.isRunning.value = true;
    }
    this.incomingMarkers.value = [];
    this.workerResponse = { markers: [], phases: {} };
    worker.postMessage({ rules: this.rules, emitEvery: 5, filterName });
  }

  public reset() {
    delFromIdb('engineData-collapseThenRecover');
    delFromIdb('engineData-collapsedForever');
    delFromIdb('engineData-collapsingRecovery');
    delFromIdb('engineIsInActiveMode');
    this.simulationData.value = { markers: [], phases: {} };
    this.dollarMarkers.value = [];
    this.incomingMarkers.value = [];
    this.isInActiveMode = false;
  }

  public async setFilter(filterName: IFilterName) {
    const storedData = await getFromIdb(`engineData-${filterName}`);
    if (storedData) {
      this.simulationData.value = JSON.parse(storedData);
      this.generateDollarMarkers();
      this.isRunning.value = false;
      if (this.isInActiveMode) {
        this.runNext();
      }
    } else if (!this.isInActiveMode) {
      this.simulationData.value = await BaseScenario.get(filterName);
      this.generateDollarMarkers();
    } else {
      this.run(filterName);
    }
  }

  private async runNext() {
    const keys = await getKeysFromIdb();
    console.log(keys);
    for (const filterName of ['collapseThenRecover', 'collapsedForever', 'collapsingRecovery'] as IFilterName[]) {
      if (!keys.includes(`engineData-${filterName}`)) {
        this.run(filterName);
        return;
      }
    }
    this.setActiveMode(false);
    console.log('no more filters');
  }

  private setActiveMode(isInActiveMode: boolean) {
    this.isInActiveMode = isInActiveMode;
    setToIdb('engineIsInActiveMode', isInActiveMode);
  }

  private generateDollarMarkers() {
    const markers = this.simulationData.value.markers;
    const dollarInflation = new DollarInflation(this.rules);
    this.dollarMarkers.value = dollarInflation.generateMarkersForRange(markers[0].startingDate, markers[markers.length - 1].endingDate);  
  }

  private handleWorkerMessage(event: MessageEvent) {
    this.incomingMarkers.value.push(...event.data.markers);
    this.workerResponse.markers.push(...event.data.markers.map((x: IMarkerJson) => ({ ...x })));
    
    if (event.data.isFinished) {
      this.workerResponse.phases = event.data.phases;
      setToIdb(`engineData-${event.data.filterName}`, JSON.stringify(this.workerResponse));

      if (this.selectedFilter.value === event.data.filterName) {
        this.simulationData.value = { markers: this.workerResponse.markers, phases: event.data.phases };
        this.generateDollarMarkers();
        this.isRunning.value = false;
      }

      this.runNext().catch(e => console.error(e));
    }
  }
}
