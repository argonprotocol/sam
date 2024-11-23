import * as Fs from 'fs';
import * as Path from 'path';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import IRules from "../interfaces/IRules";
import Marker from "./Marker";
import Vault, { IVaultMeta } from "./Vault";
import loadCsvFile from './loadCsvFile';
import Reserve from './Reserve';
import { divide, log } from './Utils';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const TERRA_LAUNCH_DATE = '2020-10-01T00:00:00Z';
export const TERRA_COLLAPSE_DATE = '2022-05-09T00:00:00Z';
export const DEFAULT_ENDING_DATE = '2025-12-31T00:00:00Z';
export const MUST_END_BEFORE_DATE = '2120-10-01T00:00:00Z';

export const TERRA_RESERVE_FUND = 3_000_000_000;
export const MILLIS_PER_HOUR = 60 * 60 * 1000; // milliseconds in one hour

export default class BlockchainRunner {
  public hourlyMarkers: any[] = [];
  public dailyMarkers: any[] = [];

  private rules: IRules;
  private reserve: Reserve;
  private config: { bypassCache?: boolean };

  constructor(rules: IRules, config: { bypassCache?: boolean } = {}) {
    this.rules = rules;
    this.reserve = new Reserve(TERRA_RESERVE_FUND);
    this.config = config;
  }

  public runStart(startingPrice: number, startOnDate: Dayjs, endBeforeDate: Dayjs) {
    const durationInHours = 24;
    const lengthInDays = endBeforeDate.diff(startOnDate, 'days');
    const vault = new Vault('live');

    const annualTransactionsToAddPerDay = divide(this.rules.transactionsAnnually, lengthInDays);
    const annualMicropaymentsToAddPerDay = divide(this.rules.micropaymentsAnnually, lengthInDays);

    const circulationToAddPerDay = divide(this.rules.circulation, lengthInDays);
    const capitalToAddPerDay = circulationToAddPerDay * startingPrice;

    let annualTransactions = 0;
    let annualMicropayments = 0;

    let currentDate = startOnDate;
    let currentCirculationSupply = 0;
    let currentCapitalDemand = 0;

    while (currentDate.isBefore(endBeforeDate)) {
      annualTransactions += annualTransactionsToAddPerDay;
      annualMicropayments += annualMicropaymentsToAddPerDay;
      
      const marker = new Marker(currentDate, durationInHours, currentCirculationSupply, currentCapitalDemand);
      marker.addCirculation(circulationToAddPerDay, 'TerraLaunch');
      marker.addCapital(capitalToAddPerDay, 'TerraLaunch');
      marker.setAnnualTransactions(annualTransactions);
      marker.setAnnualMicropayments(annualMicropayments);
      
      marker.setVaultAndReserve(this.rules, vault, this.reserve);
      vault.loadForDate(marker.currentCirculation, currentDate, this.rules);
      marker.setVault(this.rules, vault);

      marker.tryTaxation(this.rules);
      marker.manageSeigniorageProfits(this.rules, this.reserve);

      this.dailyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculationSupply = marker.currentCirculation;
      currentCapitalDemand = marker.currentCapital;
    }

    return this.dailyMarkers;
  }

  private implementTerraCollapse(startingPrice: number, startingDate: Dayjs, vault: Vault, onDay: (marker: Marker) => void) {
    const durationInHours = 24;
    const terraScenario = loadCsvFile(Path.join(__dirname, '../data-input/terra-scenario.csv'));

    let currentDate = startingDate;
    let currentCirculation = this.rules.circulation;
    let currentCapital = this.rules.circulation * startingPrice;

    for (const terraDay of terraScenario) {
      if (terraDay.date === 'May 8, 2022') continue;

      const terraDate = dayjs.utc(terraDay.date).startOf('day');

      if (!terraDate.isSame(currentDate)) {
        throw new Error(`Terra scenario date (${terraDate.toISOString()}) does not match current date (${currentDate.toISOString()})`);
      }

      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      const circulationBurned = Number(terraDay.circulationBurned.replace(/,/g, ''));
      const capitalOutflow = Number(terraDay.capitalOutflow.replace(/,/g, ''));
      marker.removeCapital(capitalOutflow, 'TerraCollapse');

      marker.removeCirculationUsingReserveCapital(circulationBurned, this.reserve);
      marker.setVault(this.rules, vault);
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
      durationInHours
    };
  }

  public runCollapse(startingPrice: number, startingDate: Dayjs, vaultMeta: IVaultMeta) {
    const vault = new Vault('cached', startingDate);
    vault.loadFromCache(vaultMeta);
    vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    const afterTerra = this.implementTerraCollapse(startingPrice, startingDate, vault, (marker) => {
      this.dailyMarkers.push(marker);
    });

    const durationInHours = afterTerra.durationInHours;

    let currentDate = afterTerra.currentDate;
    let currentCirculation = afterTerra.currentCirculation;
    let currentCapital = afterTerra.currentCapital;
    let daysFlatlined = 0;
    
    // Next days
    while (daysFlatlined < 20) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);
      this.dailyMarkers.push(marker);
      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);
      marker.setVaultAndReserve(this.rules, vault, this.reserve);
      marker.runDisabledMechanisms(this.rules, true);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
      daysFlatlined++;
    }

    return this.dailyMarkers;
  }

  public runCollapsingRecovery(startingPrice: number, startingDate: Dayjs, vaultMeta: IVaultMeta) {
    const vault = new Vault('cached', startingDate);
    vault.loadFromCache(vaultMeta);
    vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    const afterTerra = this.implementTerraCollapse(startingPrice, startingDate, vault, (marker) => {
      marker.runRecovery(this.rules, this.dailyMarkers, vault);
      marker.manageSeigniorageProfits(this.rules, this.reserve);

      this.dailyMarkers.push(marker);
    });

    const durationInHours = afterTerra.durationInHours;

    let currentDate = afterTerra.currentDate;
    let currentCirculation = afterTerra.currentCirculation;
    let currentCapital = afterTerra.currentCapital;
    let daysFlatlined = 0;

    while (daysFlatlined < 20 && currentDate.isBefore(dayjs.utc(MUST_END_BEFORE_DATE))) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      marker.runRecovery(this.rules, this.dailyMarkers, vault);
      marker.setReserve(this.rules, this.reserve);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      marker.runDisabledMechanisms(this.rules, false);

      this.dailyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;

      if (marker.startingCapital >= 1.00 && marker.currentPrice >= 1.00) {
        daysFlatlined++;
      } else {
        daysFlatlined = 0;
      }
    }

    return this.dailyMarkers;
  }

  public runRecovery(startingPrice: number, startingDate: Dayjs, currentCirculation: number, vaultMeta: IVaultMeta): Marker[] {
    const durationInHours = 24;
    const maxRecentMarkers = Math.max(Math.round(this.rules.speculativeLatencyHigh/24), Math.round(this.rules.certaintyLatencyHigh/24));

    let currentDate = startingDate;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(currentCirculation, startingPrice);
    let daysFlatlined = 0;

    const vault = new Vault('cached', currentDate);
    vault.loadFromCache(vaultMeta);
    vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    let recentMarkers: Marker[] = [];
  
    while (daysFlatlined < 20 && currentDate.isBefore(dayjs.utc(MUST_END_BEFORE_DATE))) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      marker.setReserve(this.rules, this.reserve);
      marker.runRecovery(this.rules, recentMarkers, vault);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      marker.runDisabledMechanisms(this.rules, false);
      
      recentMarkers = [...recentMarkers.slice(-maxRecentMarkers), marker];
      this.dailyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;

      const isAfterDesiredDate = currentDate.isAfter(dayjs.utc(DEFAULT_ENDING_DATE));
      if (isAfterDesiredDate && marker.currentPrice <= this.dailyMarkers[this.dailyMarkers.length - 20].startingPrice) {
        log(`Recovery stopped at ${currentDate} because there is no hope of recovery`);
        break;
      }

      if (marker.startingCapital >= 1.00 && marker.currentPrice >= 1.00) {
        daysFlatlined++;
      } else {
        daysFlatlined = 0;
      }
    }

    return this.dailyMarkers;
  }

  public runCollapsedForever(currentDate: Dayjs, currentCirculation: number, currentCapital: number, vaultMeta: IVaultMeta) {
    const durationInHours = 24;
    const defaultEndingDate = dayjs.utc(DEFAULT_ENDING_DATE);
    const endingDate = currentDate.isBefore(defaultEndingDate) ? defaultEndingDate : currentDate.endOf('year');
    
    const vault = new Vault('cached', currentDate);
    vault.loadFromCache(vaultMeta);
    vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    while (currentDate.isSameOrBefore(endingDate)) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);
      this.dailyMarkers.push(marker);
      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);
      marker.setVaultAndReserve(this.rules, vault, this.reserve);
      marker.runDisabledMechanisms(this.rules, true);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    return this.dailyMarkers;
  }

  public runRegrowth(startingPrice: number, currentDate: Dayjs, currentCirculation: number, vaultMeta: IVaultMeta, finalStopDate?: Dayjs): Marker[] {
    const durationInHours = 24;
    const defaultEndingDate = dayjs.utc(DEFAULT_ENDING_DATE);
    const endingDate = currentDate.isBefore(defaultEndingDate) ? defaultEndingDate : currentDate.endOf('year');

    const vault = new Vault('cached', currentDate);
    vault.loadFromCache(vaultMeta);
    vault.setPricePerBtcOverride(this.rules.btcPriceOverride);

    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(currentCirculation, startingPrice);

    while (currentDate.isSameOrBefore(endingDate)) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      marker.setAnnualTransactions(this.rules.transactionsAnnually);
      marker.setAnnualMicropayments(this.rules.micropaymentsAnnually);

      marker.runRecovery(this.rules, this.dailyMarkers, vault);
      marker.setReserve(this.rules, this.reserve);
      marker.manageSeigniorageProfits(this.rules, this.reserve);
      marker.runDisabledMechanisms(this.rules, false);

      this.dailyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    return this.dailyMarkers;
  }

  public fetchFromCached(filePath: string) {
    // const pauseDate = currentDate.add(1, 'year');
    // const rulesKey = JSON.stringify(this.rules);
    // const rulesHash = require('crypto').createHash('md5').update(rulesKey).digest('hex');
    // const filePath = Path.join(__dirname, `../data-cache/recovery-${rulesHash}-${pauseDate.unix()}.json`);



    // if (false && !this.config.bypassCache && Fs.existsSync(filePath)) {
    //   log(`Reading cached recovery data from ${filePath}`);
    //   const fileContent = Fs.readFileSync(filePath, 'utf8');
    //   const parsedData = JSON.parse(fileContent);
    //   this.hourlyMarkers = parsedData.map(markerData => {
    //     return Marker.fromJsonCache(markerData);
    //   });
    //   const lastMarker = this.hourlyMarkers[this.hourlyMarkers.length - 1];
    //   currentDate = dayjs.utc(lastMarker.nextDate);
    //   currentCirculation = lastMarker.currentCirculation;
    //   currentCapital = lastMarker.currentCapital;
    // }
  }

  public saveToCache(filePath: string) {
    if (!this.config.bypassCache) {
      const toSave = this.hourlyMarkers.map(m => m.toJsonCache());
      Fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2));
    }
  }
}
