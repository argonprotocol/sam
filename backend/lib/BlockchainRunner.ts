import * as Fs from 'fs';
import * as Path from 'path';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import IRules from "../interfaces/IRules";
import Marker from "./Marker";
import Vault from "./Vault";
import loadCsvFile from './loadCsvFile';
import Reserve from './Reserve';
import { addCommas } from './Utils';

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);

export const MILLIS_PER_HOUR = 60 * 60 * 1000; // milliseconds in one hour

const POOL_DEPEG_PCT = 20;

export default class BlockchainRunner {
  public hourlyMarkers: any[] = [];
  public dailyMarkers: any[] = [];

  private rules: IRules;
  private vault: Vault;
  private reserve: Reserve;

  constructor(rules: IRules) {
    this.rules = rules;

    this.vault = new Vault(rules.btcVaulted, rules.btcRatcheting/100, rules.btcRatchetingAt/100, rules.btcLockDateStart, rules.btcLockDateEnd, rules.btcPrice);

    this.reserve = new Reserve(3_000_000_000);
  }

  public generateDailyMarkers() {
    const dailyMarkers = [];
    let markersToMerge = [];
    let dayToMerge = this.hourlyMarkers[0].startingDate;

    Marker.idCount = 0;
    for (const hourlyMarker of this.hourlyMarkers) {
      if (!dayToMerge.isSame(hourlyMarker.startingDate, 'day')) {
        dayToMerge = hourlyMarker.startingDate;
        const mergedDailyMarker = Marker.merge(markersToMerge);
        dailyMarkers.push(mergedDailyMarker);
        markersToMerge = [];
      }
      
      markersToMerge.push(hourlyMarker);
    }

    // Handle the last day
    if (markersToMerge.length > 0) {
      const mergedDailyMarker = Marker.merge(markersToMerge);
      dailyMarkers.push(mergedDailyMarker);
    }

    return dailyMarkers;
  }

  public runStart(startingDate: Dayjs, endingDate: Dayjs, startingPrice: number) {
    const durationInHours = 1;

    let currentDate = startingDate;
    let currentCirculationSupply = this.rules.circulation;
    let currentCapitalDemand = this.rules.circulation * startingPrice;

    while (currentDate < endingDate) {
      const marker = new Marker(currentDate, durationInHours, currentCirculationSupply, currentCapitalDemand);
      marker.setVaultAndReserve(this.rules, this.vault, this.reserve);
      marker.tryTaxation(this.rules);
      marker.mintIfNeeded(this.rules);

      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculationSupply = marker.currentCirculation;
      currentCapitalDemand = marker.currentCapital;
    }

    this.dailyMarkers = this.generateDailyMarkers();

    return this.dailyMarkers;
  }

  public runTerraCollapse(startingDate: Dayjs, lastPrice: number) {
    const durationInHours = 24;

    let currentDate = startingDate;
    let currentCirculation = this.rules.circulation;
    let currentCapital = this.rules.circulation * lastPrice;

    const terraScenario = loadCsvFile(Path.join(__dirname, '../data-input/terra-scenario.csv'));
    // First day
    for (const terraDay of terraScenario) {
      const terraDate = dayjs.utc(terraDay.date).startOf('day');
      
      if (!terraDate.isSame(currentDate)) {
        throw new Error(`Terra scenario date (${terraDate.toISOString()}) does not match current date (${currentDate.toISOString()})`);
      }

      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      const circulationToBurn = Number(terraDay.circulationBurned.replace(/,/g, ''));
      marker.removeCirculationUsingReserveCapital(circulationToBurn, this.reserve);
      marker.setVault(this.rules, this.vault);

      const terraPrice = Number(terraDay.price);
      const capitalAtTerraPrice = marker.currentCirculation * terraPrice;
      const capitalOutflow = marker.currentCapital - capitalAtTerraPrice;
      marker.removeCapital(capitalOutflow, 'TerraCollapse');
      marker.mintIfNeeded(this.rules);

      this.dailyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    let hoursFlatlined = 0;
    // Next days
    while (hoursFlatlined < 20) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);
      this.dailyMarkers.push(marker);
      marker.setVaultAndReserve(this.rules, this.vault, this.reserve);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
      hoursFlatlined++;
    }
  }

  public runTerralikeCollapse(startingDate: Dayjs, lastPrice: number) {
    const durationInHours = 1;
    const capitalOutflowPerHour = ((this.rules.circulation * (POOL_DEPEG_PCT / 100))) / 24;

    let currentDate = startingDate;
    let currentCirculation = this.rules.circulation;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(this.rules.circulation, lastPrice);

    // First day
    for (let i = 0; i < 24; i++) {
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      marker.removeCapital(capitalOutflowPerHour, 'TerralikeCollapse');
      if (this.rules.disableRecoveryDuringFall) {
        marker.runRecovery(this.rules, this.hourlyMarkers, this.vault);
        marker.setReserve(this.rules, this.reserve);
      } else {
        marker.setVaultAndReserve(this.rules, this.vault, this.reserve);
      }
      
      marker.mintIfNeeded(this.rules);
      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;
    }

    let hoursFlatlined = 0;
    // Next days
    while (hoursFlatlined < (24 * 20)) {
      const previousMarker = this.hourlyMarkers[this.hourlyMarkers.length - 1];
      const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

      if (this.rules.disableRecoveryDuringFall) {
        marker.runRecovery(this.rules, this.hourlyMarkers, this.vault);
        marker.setReserve(this.rules, this.reserve);
      } else {
        marker.setVaultAndReserve(this.rules, this.vault, this.reserve);
      }

      const previousReturn = (marker.currentPrice - previousMarker.startingPrice) / previousMarker.startingPrice;
      marker.runContinuingCollapse(previousReturn);
      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentCirculation = marker.currentCirculation;
      currentCapital = marker.currentCapital;

      if (marker.startingPrice === marker.currentPrice) {
        hoursFlatlined++;
      } else {
        hoursFlatlined = 0;
      }
    }

    this.dailyMarkers = this.generateDailyMarkers();
  }

  public runRecovery(startingDate: Dayjs, startingPrice: number) {
    const durationInHours = 1;

    let currentDate = startingDate;
    let currentCirculation = this.rules.circulation;
    let currentCapital = Marker.calculateCapitalFromCirculationAndPrice(this.rules.circulation, startingPrice);

    while (true) {
      const stopDate = currentDate.add(1, 'year');
      const rulesKey = JSON.stringify(this.rules);
      const rulesHash = require('crypto').createHash('md5').update(rulesKey).digest('hex');
      const filePath = Path.join(__dirname, `../data-cache/recovery-${rulesHash}-${stopDate.unix()}.json`);
      const maxRecentMarkers = Math.max(this.rules.speculativeLatencyHigh, this.rules.certaintyLatencyHigh);
      let recentHourlyMarkers: Marker[] = [];

      if (Fs.existsSync(filePath)) {
        console.log(`Reading cached recovery data from ${filePath}`);
        const fileContent = Fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(fileContent);
        this.hourlyMarkers = parsedData.map(markerData => {
          return Marker.fromJsonCache(markerData);
        });
        const lastMarker = this.hourlyMarkers[this.hourlyMarkers.length - 1];
        currentDate = dayjs.utc(lastMarker.nextDate);
        currentCirculation = lastMarker.currentCirculation;
        currentCapital = lastMarker.currentCapital;
        
      } else {
        console.log(`Running recovery for ${currentDate} to ${stopDate}`);
        while (currentDate.isBefore(stopDate)) {
          const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);
          marker.runRecovery(this.rules, recentHourlyMarkers, this.vault);
          marker.mintIfNeeded(this.rules);

          recentHourlyMarkers = [...recentHourlyMarkers.slice(-maxRecentMarkers), marker];
          this.hourlyMarkers.push(marker);

          currentDate = marker.nextDate;
          currentCirculation = marker.currentCirculation;
          currentCapital = marker.currentCapital;

          const isPast2025 = currentDate.isSameOrAfter(dayjs.utc('2026-01-01T00:00:00.000Z'));
          if (isPast2025) {
            if (marker.currentPrice >= 1.0) {
              console.log(`Recovery stopped at ${currentDate} because price is >= 1.0`);
              break;
            }
            if (marker.currentPrice <= this.hourlyMarkers[0].startingPrice) {
              console.log(`Recovery stopped at ${currentDate} because there is no hope of recovery`);
              break;
            }
          }
        }
        const toSave = this.hourlyMarkers.map(m => m.toJsonCache());
        Fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2));  
      }

      const firstHourlyPrice = this.hourlyMarkers[0].startingPrice;
      const lastHourlyPrice = this.hourlyMarkers[this.hourlyMarkers.length - 1].currentPrice;
      const priceIsRecovering = lastHourlyPrice > firstHourlyPrice;

      this.dailyMarkers.push(...this.generateDailyMarkers());
      this.hourlyMarkers = [];

      const isMoreThan100Years = currentDate.isAfter(startingDate.add(100, 'year'));
      const isPast2025 = currentDate.isSameOrAfter(dayjs.utc('2026-01-01T00:00:00.000Z'));
      const isPast2025AndPriceHasRecovered = isPast2025 && lastHourlyPrice >= 1.0;
      const isPast2025AndPriceIsNotRecovering = isPast2025 && !priceIsRecovering;

      if (isPast2025AndPriceHasRecovered || isPast2025AndPriceIsNotRecovering) {
        break;
      } else if (isMoreThan100Years) {
        // do not run for more than 100 years
        console.log(`Stopping recovery after 100 years`);
        break;
      }
    }
  }
}