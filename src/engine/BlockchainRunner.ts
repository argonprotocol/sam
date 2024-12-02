import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import IRules from "../interfaces/IRules";
import Marker, { IMarkerJson } from "./Marker";
import Vault from "./Vault";
import Reserve from './Reserve';
import { divide, log } from './Utils';
import terraScenario from '../data/terraScenario.json';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface IPhaseIndexes {
  launch?: { firstItem: number, lastItem: number };
  collapse?: { firstItem: number, lastItem: number };
  recovery?: { firstItem: number, lastItem: number };
  collapsingRecovery?: { firstItem: number, lastItem: number };
  collapsedForever?: { firstItem: number, lastItem: number };
  regrowth?: { firstItem: number, lastItem: number };
}

export const TERRA_LAUNCH_DATE = '2020-10-01T00:00:00Z';
export const TERRA_COLLAPSE_DATE = '2022-05-09T00:00:00Z';
export const DEFAULT_ENDING_DATE = '2025-12-31T00:00:00Z';
export const MUST_END_BEFORE_DATE = '2120-10-01T00:00:00Z';

export const TERRA_RESERVE_FUND = 3_000_000_000;
export const MILLIS_PER_HOUR = 60 * 60 * 1000; // milliseconds in one hour

export default class BlockchainRunner {
  private markers: Marker[] = [];

  private phaseIndexes: IPhaseIndexes = {};

  private durationInHours = 24;

  private rules: IRules;
  private reserve: Reserve;
  private vault = new Vault();

  private emitsPending: number = 0;
  private emitEvery: number = 0;

  private annualTransactionsToAddPerDay: number;
  private annualMicropaymentsToAddPerDay: number;

  private circulationToAddPerDay: number;
  private capitalToAddPerDay: number;

  private capitalAtEndOfLaunchPhase: number;
  private circulationAtEndOfLaunchPhase: number;

  private maxRecentMarkers: number = 0;

  constructor(rules: IRules, emitEvery: number = 0) {
    this.rules = rules;
    this.reserve = new Reserve(TERRA_RESERVE_FUND);
    this.emitEvery = emitEvery;

    const startingPrice = 1.00;
    const terraLaunchDate = dayjs.utc(TERRA_LAUNCH_DATE);
    const terraCollapseDate = dayjs.utc(TERRA_COLLAPSE_DATE);
    const lengthInDays = terraCollapseDate.diff(terraLaunchDate, 'days');

    this.annualTransactionsToAddPerDay = divide(rules.transactionsAnnually, lengthInDays);
    this.annualMicropaymentsToAddPerDay = divide(rules.micropaymentsAnnually, lengthInDays);

    this.circulationToAddPerDay = divide(rules.circulation, lengthInDays);
    this.capitalToAddPerDay = this.circulationToAddPerDay * startingPrice;

    this.maxRecentMarkers = Math.max(Math.round(rules.speculativeLatencyHigh/24), Math.round(rules.certaintyLatencyHigh/24)) || 1;
  }

  public onMarkers: (markers: IMarkerJson[]) => void = () => {};

  public async runCollapseThenRecover(): Promise<{ markers: IMarkerJson[], phases: IPhaseIndexes }> {
    this.reset();
    this.runStart();

    const lastStartMarker = this.latestMarker;
    
    // Collapse phase /////////
    this.runCollapse(lastStartMarker.currentPrice, lastStartMarker.nextDate);
    const lastCollapseMarker = this.latestMarker;

    // Recovery phase /////////
    let firstMarker: Marker;
    let currentDate = lastCollapseMarker.nextDate;
    let currentCirculation = lastCollapseMarker.currentCirculation;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(currentCirculation, lastCollapseMarker.currentPrice);
    let daysFlatlined = 0;

    this.vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    while (daysFlatlined < 20 && currentDate.isBefore(dayjs.utc(MUST_END_BEFORE_DATE))) {
      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      marker.setReserve(this.reserve);
      marker.runRecovery(this.rules, this.markers, this.vault);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      marker.runDisabledMechanisms(this.rules, false);
      
      if (!marker.currentCirculation) {
        throw new Error('No starting circulation');
      }

      this.addMarker(marker);

      (firstMarker ??= marker).showPointOnChart = true;

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;

      const isAfterDesiredDate = currentDate.isAfter(dayjs.utc(DEFAULT_ENDING_DATE));
      if (isAfterDesiredDate && marker.currentPrice <= this.markers[this.markers.length - 20].startingPrice) {
        log(`Recovery stopped at ${currentDate} because there is no hope of recovery`);
        break;
      }

      if (marker.startingCapital >= 1.00 && marker.currentPrice >= 1.00) {
        daysFlatlined++;
      } else {
        daysFlatlined = 0;
      }
    }
    
    this.vault.setPricePerBtcOverride(undefined);
    this.phaseIndexes.recovery = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    };

    // Regrowth phase /////////
    this.runRegrowth(this.latestMarker.currentPrice, this.latestMarker.nextDate, this.latestMarker.currentCirculation);
    this.latestMarker.showPointOnChart = true;

    return {
      markers: this.markers.map((m: Marker) => m.toJson()),
      phases: this.phaseIndexes,
    };
  }

  public runCollapsingRecovery(): { markers: IMarkerJson[], phases: IPhaseIndexes } {
    this.reset();
    this.runStart();

    const lastStartMarker = this.latestMarker;

    // Collapsing Recovery phase /////////
    let firstMarker: Marker | null;

    this.vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    const afterTerra = this.implementTerraCollapse(lastStartMarker.currentPrice, lastStartMarker.nextDate, (marker) => {
      marker.runRecovery(this.rules, this.markers, this.vault);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      this.addMarker(marker);
      (firstMarker ??= marker).showPointOnChart = true;
    });

    // Recovery phase /////////
    let firstRecoveredMarker: Marker;
    let currentDate = afterTerra.currentDate;
    let currentCirculation = afterTerra.currentCirculation;
    let currentCapital = afterTerra.currentCapital;
    let daysFlatlined = 0;

    while (daysFlatlined < 20 && currentDate.isBefore(dayjs.utc(MUST_END_BEFORE_DATE))) {
      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      marker.runRecovery(this.rules, this.markers, this.vault);
      marker.setReserve(this.reserve);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      marker.runDisabledMechanisms(this.rules, false);

      this.addMarker(marker);

      (firstRecoveredMarker ??= marker).showPointOnChart = true;

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;

      if (marker.startingCapital >= 1.00 && marker.currentPrice >= 1.00) {
        daysFlatlined++;
      } else {
        daysFlatlined = 0;
      }
    }
    
    this.vault.setPricePerBtcOverride(undefined);
    this.phaseIndexes.collapsingRecovery = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    };

    // Regrowth phase /////////
    this.runRegrowth(this.latestMarker.currentPrice, this.latestMarker.nextDate, this.latestMarker.currentCirculation);
    this.latestMarker.showPointOnChart = true;

    return {
      markers: this.markers.map((m: Marker) => m.toJson()),
      phases: this.phaseIndexes,
    };
  }

  public runCollapseForever(): { markers: IMarkerJson[], phases: IPhaseIndexes } {
    this.reset();
    this.runStart();

    const lastStartMarker = this.latestMarker;
    
    // Collapse phase /////////
    this.runCollapse(lastStartMarker.currentPrice, lastStartMarker.nextDate);
    const lastCollapseMarker = this.latestMarker;

    // Collapsed Forever phase /////////
    let firstMarker: Marker;
    let currentDate = lastCollapseMarker.nextDate;
    let currentCirculation = lastCollapseMarker.currentCirculation;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(currentCirculation, lastCollapseMarker.currentPrice);

    while (currentDate.isSameOrBefore(dayjs.utc(DEFAULT_ENDING_DATE))) {
      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);
      this.addMarker(marker);
      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);
      marker.setVaultAndReserve(this.vault, this.reserve);
      marker.runDisabledMechanisms(this.rules, true);

      (firstMarker ??= marker).showPointOnChart = true;

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }
    
    this.vault.setPricePerBtcOverride(undefined);

    this.phaseIndexes.collapsedForever = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    };

    this.latestMarker.showPointOnChart = true;

    return {
      markers: this.markers.map((m: Marker) => m.toJson()),
      phases: this.phaseIndexes,
    };
  }

  // PRIVATE //////////////////////////////////////////////////////////////

  private runStart() {
    if (this.latestMarker) throw new Error('Already ran');

    const startOnDate = dayjs.utc(TERRA_LAUNCH_DATE);
    const endBeforeDate = dayjs.utc(TERRA_COLLAPSE_DATE);

    let annualTransactions = 0;
    let annualMicropayments = 0;

    let firstMarker: Marker;
    let currentDate = startOnDate;
    let currentCirculation = 0;
    let currentCapital = 0;

    while (currentDate.isBefore(endBeforeDate)) {
      annualTransactions += this.annualTransactionsToAddPerDay;
      annualMicropayments += this.annualMicropaymentsToAddPerDay;
      
      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);

      marker.addCirculation(this.circulationToAddPerDay, 'TerraGrowth');
      marker.addCapital(this.capitalToAddPerDay, 'TerraGrowth');
      marker.setAnnualTransactions(annualTransactions);
      marker.setAnnualMicropayments(annualMicropayments);
      
      marker.setVaultAndReserve(this.vault, this.reserve);
      this.vault.loadForDate(marker.currentCirculation, currentDate, this.rules);
      marker.setVault(this.vault);

      marker.tryTaxation(this.rules);
      marker.manageSeigniorageProfits(this.rules, this.reserve);

      this.addMarker(marker);

      (firstMarker ??= marker).showPointOnChart = true;

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    this.phaseIndexes.launch = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    };

    this.capitalAtEndOfLaunchPhase = this.latestMarker.currentCapital;
    this.circulationAtEndOfLaunchPhase = this.latestMarker.currentCirculation;
  }

  private runRegrowth(startingPrice: number, currentDate: Dayjs, currentCirculation: number) {
    const tmpEndingDate = dayjs.utc(DEFAULT_ENDING_DATE);
    const endingDate = currentDate.isBefore(tmpEndingDate) ? tmpEndingDate : currentDate.endOf('year');

    let annualTransactions = 0;
    let annualMicropayments = 0;

    let firstMarker: Marker;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(currentCirculation, startingPrice);

    while (currentDate.isSameOrBefore(endingDate)) {
      annualTransactions = Math.min(annualTransactions + this.annualTransactionsToAddPerDay, this.rules.transactionsAnnually);
      annualMicropayments = Math.min(annualMicropayments + this.annualMicropaymentsToAddPerDay, this.rules.micropaymentsAnnually);

      const capitalToAdd = Math.min(this.capitalToAddPerDay, this.capitalAtEndOfLaunchPhase - currentCapital);
      const circulationToAdd = Math.min(this.circulationToAddPerDay, this.circulationAtEndOfLaunchPhase - currentCirculation);

      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);
      marker.addCirculation(circulationToAdd, 'TerraGrowth');
      marker.addCapital(capitalToAdd, 'TerraGrowth');
      marker.setAnnualTransactions(annualTransactions);
      marker.setAnnualMicropayments(annualMicropayments);

      marker.setVaultAndReserve(this.vault, this.reserve);
      this.vault.loadForDate(marker.currentCirculation, currentDate, this.rules);
      marker.setVault(this.vault);

      marker.tryTaxation(this.rules);
      marker.manageSeigniorageProfits(this.rules, this.reserve);

      this.addMarker(marker);

      (firstMarker ??= marker).showPointOnChart = true;

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    this.phaseIndexes.regrowth = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    }
  }

  private get latestMarker(): Marker {
    return this.markers[this.markers.length - 1];
  }

  private addMarker(marker: Marker) {
    const previousMarker = this.latestMarker;
    if (previousMarker) {
      const priceDiff = Math.abs(marker.currentPrice - previousMarker.currentPrice);    
      if (priceDiff >= 0.05) {
        previousMarker.showPointOnChart = true;
        marker.showPointOnChart = true;
      }
    }
    this.markers.push(marker);
    this.emitsPending++;
    
    if (this.onMarkers && this.emitEvery && this.emitsPending >= this.emitEvery) {
      const markersToEmit = this.markers.slice(this.markers.length - this.emitsPending);
      this.onMarkers(markersToEmit.map((m: Marker) => m.toJson()));
      this.emitsPending = 0;
    }

    if (this.markers.length > this.maxRecentMarkers && !this.emitsPending) {
      this.markers = this.markers.slice(-this.maxRecentMarkers);
    }
  }

  private runCollapse(startingPrice: number, startingDate: Dayjs) {
    const afterTerra = this.implementTerraCollapse(startingPrice, startingDate, (marker) => {
      this.addMarker(marker);
    });

    let firstMarker: Marker;
    let currentDate = afterTerra.currentDate;
    let currentCirculation = afterTerra.currentCirculation;
    let currentCapital = afterTerra.currentCapital;
    let daysFlatlined = 0;
    
    // Next days
    while (daysFlatlined < 20) {
      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);
      this.addMarker(marker);
      firstMarker ??= marker;
      firstMarker.showPointOnChart = true;
      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);
      marker.setVaultAndReserve(this.vault, this.reserve);
      marker.runDisabledMechanisms(this.rules, true);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
      daysFlatlined++;
    }
    this.phaseIndexes.collapse = {
      firstItem: firstMarker.idx,
      lastItem: this.latestMarker.idx,
    };
  }

  private implementTerraCollapse(startingPrice: number, startingDate: Dayjs, onDay: (marker: Marker) => void) {
    let currentDate = startingDate;
    let currentCirculation = this.rules.circulation;
    let currentCapital = this.rules.circulation * startingPrice;

    for (const terraDay of terraScenario) {
      if (terraDay.date === 'May 8, 2022') continue;

      const terraDate = dayjs.utc(terraDay.date).startOf('day');

      if (!terraDate.isSame(currentDate)) {
        throw new Error(`Terra scenario date (${terraDate.toISOString()}) does not match current date (${currentDate.toISOString()})`);
      }

      const marker = new Marker(currentDate, this.durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      const circulationBurned = terraDay.circulationBurned;
      const capitalOutflow = terraDay.capitalOutflow;
      marker.removeCapital(capitalOutflow, 'TerraCollapse');

      marker.removeCirculationUsingReserveCapital(circulationBurned, this.reserve);
      marker.setVault(this.vault);
      marker.manageSeigniorageProfits(this.rules, this.reserve);

      onDay(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    return {
      currentDate,
      currentCirculation,
      currentCapital,
    };
  }

  private reset() {
    this.markers = [];
    Marker.resetIdx();
  }
}
