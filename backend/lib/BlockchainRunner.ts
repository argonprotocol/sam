import * as Fs from 'fs';
import * as Path from 'path';
import IRules from "../interfaces/IRules";
import Marker, { ARGON_BLOCKS_PER_HOUR } from "./Marker";
import Vault from "./Vault";

export const MILLIS_PER_HOUR = 60 * 60 * 1000; // milliseconds in one hour

export default class BlockchainRunner {
  public stats = {
    bitcoinsVaulted: 0,
    bitcoinsNeeded: 0,
    bitcoinsToUnvault: 0,
    burnPerBitcoinDollar: 0,
    excessArgons: 0,
    demandValue: 0,
    minPricePerBitcoin: 0,
    pricePerBitcoin: 0,
  };

  public hourlyMarkers: any[] = [];
  public dailyMarkers: any[] = [];

  private asset: 'argon' | 'terra';
  private rules: IRules;
  private vault: Vault;

  constructor(asset: 'argon' | 'terra', rules: IRules) {
    this.asset = asset;
    this.rules = rules;
    this.stats.pricePerBitcoin = rules.btcPrice;

    const btcStartDate = new Date(rules.btcLockDateStart.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
    const btcEndDate = new Date(rules.btcLockDateEnd.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
    this.vault = new Vault(rules.btcVaulted, rules.btcRatcheting/100, rules.btcRatchetingAt/100, btcEndDate, btcStartDate, rules.btcPrice);
  }

  public generateDailyMarkers() {
    const dailyMarkers = [];
    let markersToMerge = [];
    let currentDay = null;

    Marker.idCount = 0;
    for (const hourlyMarker of this.hourlyMarkers) {
      const markerDate = new Date(hourlyMarker.startingDate);
      const day = markerDate.toISOString().split('T')[0]; // Get the date part only

      if (currentDay !== day) {
        currentDay = day;
        if (markersToMerge.length > 0) {
          const mergedDailyMarker = Marker.merge(markersToMerge);
          dailyMarkers.push(mergedDailyMarker);
          markersToMerge = [];
        }
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

  public runStart(startingDate: Date, endingDate: Date, startingPrice: number) {
    const durationInHours = 1;

    let currentDate = startingDate;
    let currentPrice = startingPrice;
    let currentCirculation = this.rules.circulation;

    while (currentDate < endingDate) {
      const marker = new Marker(this.asset, currentDate, durationInHours, currentPrice, currentCirculation, this.vault, [...this.hourlyMarkers]);
      
      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentPrice = marker.currentPrice;
      currentCirculation = marker.currentCirculation;
    }

    this.dailyMarkers = this.generateDailyMarkers();
  }

  public runCollapse(startingDate: Date, lastPrice: number) {
    const durationInHours = 1;
    const capitalOutflowPerHour = ((this.rules.circulation * (this.rules.poolDepegPct / 100))) / 24;

    let currentDate = startingDate;
    let currentPrice = lastPrice;
    let currentCirculation = this.rules.circulation;

    // First day
    for (let i = 0; i < 24; i++) {
      const marker = new Marker(this.asset, currentDate, durationInHours, currentPrice, currentCirculation, this.vault, [...this.hourlyMarkers]);

      marker.runBeginningOfCollapse(capitalOutflowPerHour);
      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentPrice = marker.currentPrice;
      currentCirculation = marker.currentCirculation;
    }

    let hoursFlatlined = 0;
    // Next days
    while (hoursFlatlined < (24 * 20)) {
      const lastMarker = this.hourlyMarkers[this.hourlyMarkers.length - 1];
      const marker = new Marker(this.asset, currentDate, durationInHours, currentPrice, currentCirculation, this.vault, [...this.hourlyMarkers]);
      const previousReturn = (lastMarker.currentPrice - lastMarker.startingPrice) / lastMarker.startingPrice;
      marker.runRemainingCollapse(previousReturn);
      this.hourlyMarkers.push(marker);

      currentDate = marker.nextDate;
      currentPrice = marker.currentPrice;
      currentCirculation = marker.currentCirculation;


      if (marker.startingPrice === marker.currentPrice) {
        hoursFlatlined++;
      } else {
        hoursFlatlined = 0;
      }
    }
    
    if (this.asset === 'terra') {
      const dropTotal = this.rules.circulation - 11_300_000_000;
      const dropPerHour = dropTotal / this.hourlyMarkers.length;
      let currentCirculation = this.hourlyMarkers[0].startingCirculation;
      for (const marker of this.hourlyMarkers) {
        marker.startingCirculation = currentCirculation; 
        marker.manuallyRemoveCirculation(dropPerHour);
        currentCirculation -= dropPerHour;
      }
    }

    this.dailyMarkers = this.generateDailyMarkers();
  }

  public runRecovery(startingDate: Date, startingPrice: number) {
    const durationInHours = 1;
    const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;

    let currentDate = startingDate;
    let currentPrice = startingPrice;
    let currentCirculation = this.rules.circulation;

    while (true) {
      const stopDate = new Date(currentDate.getTime() + oneYearInMilliseconds);
      console.log(`Running recovery for ${currentDate} to ${stopDate}`);
      while (currentDate < stopDate) {
        const marker = new Marker(this.asset, currentDate, durationInHours, currentPrice, currentCirculation, this.vault, [...this.hourlyMarkers]);
        marker.runRecovery(this.rules);

        this.hourlyMarkers.push(marker);

        currentDate = marker.nextDate;
        currentPrice = marker.currentPrice;
        currentCirculation = marker.currentCirculation;
        if (currentDate >= new Date('2126-01-01T00:00:00.000Z') && marker.currentPrice >= 1.0) {
          console.log(`Recovery stopped at ${currentDate} because price is >= 1.0`);
          break;
        }
      }
      const toSave = this.hourlyMarkers.map(m => m.exportToJson());
      const filePath = Path.join(__dirname, `../data-cache/${stopDate.getTime()}.json`);
      Fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2));
      this.dailyMarkers.push(...this.generateDailyMarkers());
      this.hourlyMarkers = [];

      const isMoreThan100Years = currentDate > new Date(startingDate.getTime() + oneYearInMilliseconds * 100);
      const isPast2025AndPriceIs1 = currentDate > new Date('2026-01-01T00:00:00.000Z') && currentPrice >= 1.0;
      if (isPast2025AndPriceIs1) {
        break;
      } else if (isMoreThan100Years) {
        // do not run for more than 100 years
        console.log(`Stopping recovery after 100 years`);
        break;
      }
    }
  }
}