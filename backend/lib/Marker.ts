import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import IRules from "../interfaces/IRules";
import Reserve, { IReserveMeta } from "./Reserve";
import { addCommas } from "./Utils";
import Vault, { IVaultMeta } from "./Vault";

dayjs.extend(utc);

export const ARGON_BLOCKS_PER_HOUR = 3600 / 60; // 1 block every 60 seconds

export const MINIMUM_PRICE = 0.001;
export const MAXIMUM_PRICE = 1.00;

export default class Marker {
  public id = ++Marker.idCount;
  public startingDate: Dayjs;
  public durationInHours: number;
  
  public startingCirculation: number;
  public startingCapital: number;

  public startingVaultMeta: IVaultMeta = {
    bitcoins: 0,
    lockedValue: 0,
    leveragePerDollar: 0,
  };

  public endingVaultMeta: IVaultMeta = {
    bitcoins: 0,
    lockedValue: 0,
    leveragePerDollar: 0,
  };
  
  public startingReserveMeta: IReserveMeta = {
    amountRemaining: 0,
    amountSpent: 0,
    leveragePerDollar: 0,
  };

  public endingReserveMeta: IReserveMeta = {
    amountRemaining: 0,
    amountSpent: 0,
    leveragePerDollar: 0,
  };

  public circulationAdded: number = 0;
  public circulationRemoved: number = 0;
  
  public circulationAddedMap: { [key: string]: number } = {};
  public circulationRemovedMap: { [key: string]: number } = {};

  public capitalAdded: number = 0;
  public capitalRemoved: number = 0;

  public capitalAddedMap: { [key: string]: number } = {};
  public capitalRemovedMap: { [key: string]: number } = {};

  public seigniorage: number = 0;

  public profitFromTaxation: number;
  public profitFromChanges: number;

  constructor(startingDate: Dayjs, durationInHours: number, startingCirculation: number, startingCapital: number) {
    this.startingDate = startingDate;
    this.durationInHours = durationInHours;
    this.startingCirculation = startingCirculation;
    this.startingCapital = startingCapital;
  }

  public get startingPrice(): number {
    return Marker.calculatePriceFromSupplyAndDemand(this.startingCirculation, this.startingCapital);
  }

  public get endingDate() {
    return this.nextDate.subtract(1, 'millisecond');
  }

  public get nextDate() {
    const millisecondsToAdd = (this.durationInHours * 60 * 60 * 1000);
    return this.startingDate.add(millisecondsToAdd, 'millisecond');
  }

  public get currentPrice() {
    const currentSupply = this.currentCirculation;
    const currentDemand = this.currentCapital;
    const price = Marker.calculatePriceFromSupplyAndDemand(currentSupply, currentDemand);
    return price;
  }

  public get currentCirculation() {    
    return this.startingCirculation - this.circulationRemoved + this.circulationAdded + this.seigniorage;
  }

  public get currentCapital(): number {
    return this.startingCapital - this.capitalRemoved + this.capitalAdded;
  }

  public get blockCount() {
    return this.durationInHours * ARGON_BLOCKS_PER_HOUR;
  }

  public get profitFromTaxationCompoundedAnnually() {
    return Math.pow(this.profitFromTaxation + 1, (365 * 24) / this.durationInHours) - 1;
  }

  public addCirculation(amount: number, source: string) {
    this.circulationAdded += amount;
    this.circulationAddedMap[source] = (this.circulationAddedMap[source] || 0) + amount;
  }

  public removeCirculation(amount: number, source: string) {
    this.circulationRemoved += amount;
    this.circulationRemovedMap[source] = (this.circulationRemovedMap[source] || 0) + amount;
  }

  public addCapital(amount: number, source: string) {
    this.capitalAdded += amount;
    this.capitalAddedMap[source] = (this.capitalAddedMap[source] || 0) + amount;
  }

  public removeCapital(amount: number, source: string) {
    this.capitalRemoved += amount;
    this.capitalRemovedMap[source] = (this.capitalRemovedMap[source] || 0) + amount;
  }

  public updateProfitFromTaxation() {
    const transactionTaxes = this.circulationRemovedMap['TransactionalTaxes'] || 0;
    const micropaymentTaxes = this.circulationRemovedMap['MicropaymentTaxes'] || 0;
    const allTaxes = transactionTaxes + micropaymentTaxes;
    const currentCirculation = this.startingCirculation - allTaxes;
    
    const endingPrice = Marker.calculatePriceFromSupplyAndDemand(currentCirculation, this.startingCapital);

    this.profitFromTaxation = Marker.calculateProfitReturn(this.startingPrice, endingPrice);
  }

  public updateProfitFromChanges() {
    this.profitFromChanges = Marker.calculateProfitReturn(this.startingPrice, this.currentPrice);  
  }

  public removeCirculationUsingReserveCapital(amountToBurn: number, reserve: Reserve) {
    this.startingReserveMeta = reserve.exportMeta(this.currentPrice);
    const amountToSpend = reserve.spend(amountToBurn);
    const tokensToBurn = amountToSpend * this.currentPrice;
    this.removeCirculation(tokensToBurn, 'ReserveSpend');
    this.endingReserveMeta = reserve.exportMeta(this.currentPrice);
  }

  public runContinuingCollapse(previousReturn: number) {
    const startingDemand = this.startingCirculation * this.startingPrice;
    const nextPrice = Marker.calculateNextPrice(this.startingPrice, previousReturn);
    const nextDemand = this.startingCirculation * nextPrice;
    const capitalOutflow = startingDemand - nextDemand;
    if (capitalOutflow <= 0) return;

    this.removeCapital(capitalOutflow, 'ContinuingCollapse');
  }


  public setVault(rules: IRules, vault: Vault) {
    if (rules.enableBitcoinVaulting) {
      this.startingVaultMeta = vault.exportMeta(this.startingPrice);
      this.endingVaultMeta = vault.exportMeta(this.currentPrice);
    }
  }

  public setReserve(rules: IRules, reserve: Reserve) {
    if (rules.enableReservePurchasingPower) {
      this.startingReserveMeta = reserve.exportMeta(this.startingPrice);
      this.endingReserveMeta = reserve.exportMeta(this.currentPrice);
    }
  }

  public setVaultAndReserve(rules: IRules, vault: Vault, reserve: Reserve) {
    this.setVault(rules, vault);
    this.setReserve(rules, reserve);
  }


  public tryTaxation(rules: IRules) {
    if (rules.enableTaxation) {
      this.runTaxation(rules.transactionsAnnually, rules.micropaymentsAnnually);
      this.updateProfitFromTaxation();
    }
  }

  public mintIfNeeded(rules: IRules) {
    if (this.currentPrice > 1.0) {
      const currentSupply = this.currentCirculation;
      const currentDemand = this.currentCapital;
      this.seigniorage += currentDemand - currentSupply;
    }
  }

  public runRecovery(rules: IRules, previousMarkers: Marker[], vault: Vault) {
    this.tryTaxation(rules);

    if (rules.enableCertaintyGreed && this.currentPrice < MAXIMUM_PRICE) {
      this.runCertaintyGreed(rules, previousMarkers);
    }

    this.startingVaultMeta = vault.exportMeta(this.startingPrice);
    if (rules.enableBitcoinVaulting && this.currentPrice < MAXIMUM_PRICE) {
      this.runBitcoinFusion(rules, vault);
    }
    this.endingVaultMeta = vault.exportMeta(this.currentPrice);

    this.updateProfitFromChanges();

    if (rules.enableSpeculativeGreed && this.currentPrice < MAXIMUM_PRICE) {
      this.runSpeculativeGreed(rules, previousMarkers);
      this.updateProfitFromChanges();
    }
  }

  public runTaxation(transactionsAnnually: number, micropaymentsAnnually: number) {
    const transactionsHourly = transactionsAnnually / 365 / 24;
    const micropaymentsHourly = micropaymentsAnnually / 365 / 24;

    const transactionsToTax = transactionsHourly * this.durationInHours;
    const micropaymentsToTax = micropaymentsHourly * this.durationInHours;

    this.removeCirculation(transactionsToTax * 0.20, 'TransactionalTaxes');
    this.removeCirculation(Marker.calculateWageProtectedPrice(micropaymentsToTax, this.startingPrice) * 0.20, 'MicropaymentTaxes');
  }


  public runSpeculativeGreed(rules: IRules, previousMarkers: Marker[]) {
    const profitPotentials = [];

    const cappedMarkers = previousMarkers.slice(-rules.speculativeLatencyHigh);
    if (cappedMarkers.length < rules.speculativeLatencyLow || 1) {
      // The minimum timeframe must have passed
      return;
    }

    for (let index = cappedMarkers.length - 1; index >= 0; index--) {
      const marker = cappedMarkers[index];
      const hoursPassed = (cappedMarkers.length - 1) - index;
      if (marker.profitFromChanges < rules.speculativeGreedLow && hoursPassed < rules.speculativeLatencyLow) {
        /*
         * If any of the markers within latencyLow have a profit lower than greedLow,
         * then we must completely bail. This ensures we only proceed when all recent
         * markers meet the minimum profit threshold.
         */
        return;
      }
      // only accept markers that had profit above greedLow, otherwise treat profit as zero
      const profitPotential = marker.profitFromChanges;
      profitPotentials.push(profitPotential >= rules.speculativeGreedLow ? profitPotential : 0);
    }

    const averageProfitPotential = profitPotentials.reduce((acc, potential) => acc + potential, 0) / profitPotentials.length;

    /**
     * Calculates the greed factor based on the average profit potential.
     * The greed factor is a normalized value between 0 and 1, representing
     * the relative position of the average profit potential between the
     * greedLow and greedHigh thresholds. It is divided by 24 to adjust
     * for hourly calculations.
     */
    const greedFactor = Math.min((averageProfitPotential - rules.speculativeGreedLow) / (rules.speculativeGreedHigh - rules.speculativeGreedLow), 1) / 24;
    
    /**
     * Convert speculativeMaxDailyIncrease to an hourly increase. Then use
     * currentCapital from yesterday's markers so it doesn't
     * compound over 24 hours into a return that's larger than the max.
     */
    const maxHourlyIncrease = rules.speculativeMaxDailyIncrease / 24;
    const yesterdaysMarker = cappedMarkers[cappedMarkers.length - 24];

    if (averageProfitPotential >= rules.speculativeGreedHigh) {
      this.addCapital(maxHourlyIncrease * yesterdaysMarker.currentCapital, 'SpeculativeGreed');
    } else if (averageProfitPotential > rules.speculativeGreedLow) {
      const additionalDemand = maxHourlyIncrease * yesterdaysMarker.currentCapital * greedFactor;
      this.addCapital(additionalDemand, 'SpeculativeGreed');
    }
  }

  public runCertaintyGreed(rules: IRules, previousMarkers: Marker[]) {    
    /**
     * CertaintyGreed predicts new capital inflows based on guaranteed annual profits
     * calculated only on taxation burning the excess capital.
     * 
     * This mechanism models investor behavior in response to predictable returns,
     * encouraging capital inflow when profit potentials are consistently high.
     */

    const profitPotentials = [];

    const cappedMarkers = previousMarkers.slice(-rules.certaintyLatencyHigh);
    if (cappedMarkers.length < rules.certaintyLatencyLow || 1) {
      // The minimum timeframe must have passed
      return;
    }

    for (let index = cappedMarkers.length - 1; index >= 0; index--) {
      const marker = cappedMarkers[index];
      const hoursPassed = (cappedMarkers.length - 1) - index;
      if (marker.profitFromTaxationCompoundedAnnually < rules.certaintyGreedLow && hoursPassed < rules.certaintyLatencyLow) {
        /*
         * If any of the markers within latencyLow have a profit lower than greedLow,
         * then we must completely bail. This ensures we only proceed when all recent
         * markers meet the minimum profit threshold.
         */
        return;
      }
      // only accept markers that had profit above greedLow, otherwise treat profit as zero
      const profitPotential = marker.profitFromTaxationCompoundedAnnually;
      profitPotentials.push(profitPotential >= rules.certaintyGreedLow ? profitPotential : 0);
    }

    const averageProfitPotential = profitPotentials.reduce((acc, potential) => acc + potential, 0) / profitPotentials.length;

    /**
     * Calculates the greed factor based on the average profit potential.
     * The greed factor is a normalized value between 0 and 1, representing
     * the relative position of the average profit potential between the
     * greedLow and greedHigh thresholds. It is divided by 24 to adjust
     * for hourly calculations.
     */
    const greedFactor = Math.min((averageProfitPotential - rules.certaintyGreedLow) / (rules.certaintyGreedHigh - rules.certaintyGreedLow), 1) / 24;
    
    /**
     * Convert certaintyMaxDailyIncrease to an hourly increase. Then use
     * currentCapital from yesterday's markers so it doesn't
     * compound over 24 hours into a return that's larger than the max.
     */
    const maxHourlyIncrease = rules.certaintyMaxDailyIncrease / 24;
    const yesterdaysMarker = cappedMarkers[cappedMarkers.length - 24];

    console.log(yesterdaysMarker)

    if (averageProfitPotential >= rules.certaintyGreedHigh) {
      this.addCapital(maxHourlyIncrease * yesterdaysMarker.currentCapital, 'CertaintyGreed');
    } else if (averageProfitPotential > rules.certaintyGreedLow) {
      const additionalDemand = maxHourlyIncrease * yesterdaysMarker.currentCapital * greedFactor;
      this.addCapital(additionalDemand, 'CertaintyGreed');
    }
  }

  public runBitcoinFusion(rules: IRules, vault: Vault) {
    const excessCirculationSupply = this.calculateExcessSupply(this.currentCirculation);
    const burnPerBitcoinDollar = vault.calculateBurnPerBitcoinDollar(this.startingPrice);
    const bitcoinsNeeded = excessCirculationSupply / (burnPerBitcoinDollar * vault.pricePerBtc);
    const bitcoinsToUnvault = Math.min(bitcoinsNeeded, rules.btcMaxTxns, vault.bitcoins);

    vault.unvault(bitcoinsToUnvault);
    this.removeCirculation(bitcoinsToUnvault * (burnPerBitcoinDollar * vault.pricePerBtc), 'BitcoinFusion');
  }

  public toJsonCache(): IJsonCache {
    return {
      id: this.id,
      startingDate: this.startingDate.toISOString(),
      durationInHours: this.durationInHours,
      startingCirculation: this.startingCirculation,
      startingCapital: this.startingCapital,
      startingVaultMeta: this.startingVaultMeta,
      endingVaultMeta: this.endingVaultMeta,
      startingReserveMeta: this.startingReserveMeta,
      endingReserveMeta: this.endingReserveMeta,
      circulationAddedMap: this.circulationAddedMap,
      circulationRemovedMap: this.circulationRemovedMap,
      capitalAddedMap: this.capitalAddedMap,
      capitalRemovedMap: this.capitalRemovedMap,
    };
  }

  public toJson(): IJson {
    return {
      id: this.id,
      blockCount: this.blockCount,
      startingDate: this.startingDate.toISOString(),
      endingDate: this.endingDate.toISOString(),
      durationInHours: this.durationInHours,
      startingCirculation: this.startingCirculation,
      endingCirculation: this.currentCirculation,
      startingCapital: this.startingCapital,
      endingCapital: this.currentCapital,
      startingPrice: this.startingPrice,
      endingPrice: this.currentPrice,
      startingVaultMeta: this.startingVaultMeta,
      endingVaultMeta: this.endingVaultMeta,
      startingReserveMeta: this.startingReserveMeta,
      endingReserveMeta: this.endingReserveMeta,
      circulationAddedMap: this.circulationAddedMap,
      circulationRemovedMap: this.circulationRemovedMap,
      capitalAddedMap: this.capitalAddedMap,
      capitalRemovedMap: this.capitalRemovedMap,
      profitFromTaxation: this.profitFromTaxation,
      profitFromTaxationCompoundedAnnually: this.profitFromTaxationCompoundedAnnually,
      profitFromChanges: this.profitFromChanges,
      seigniorage: this.seigniorage,
    };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Static methods
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  public static calculateCapitalFromCirculationAndPrice(circulation: number, price: number): number {
    return circulation * price;
  }

  private static calculatePriceFromSupplyAndDemand(currentCirculationSupply: number, currentCapitalDemand: number): number {
    return currentCapitalDemand / currentCirculationSupply;
  }

  public calculateExcessSupply(circulation: number): number {
    return circulation - this.currentCapital;
  }

  public static calculateProfitReturn(startingPrice: number, endingPrice: number): number {
    return (endingPrice - startingPrice) / startingPrice;
  }

  private static calculateNextPrice(startingPrice: number, previousReturn: number): number {
    if (previousReturn >= 0) {
      return startingPrice;
    }
    // this creates a curve that looks very similar to Terra's collapse
    const quadraticTerm = -0.2;
    const linearTerm = 0.99;
    const constantTerm = -0.000223;

    const nextPrice = startingPrice * (1 + quadraticTerm * Math.pow(previousReturn, 2) + linearTerm * previousReturn + constantTerm);
    return Math.max(nextPrice, MINIMUM_PRICE);
  }

  private static calculateWageProtectedPrice(micropaymentAmount: number, priceAsRatio: number): number {
    const inflationIndex = this.calculateInflationIndex(priceAsRatio);
    if (inflationIndex <= 100) {
      return micropaymentAmount;
    } else {
      return micropaymentAmount * (1 + ((inflationIndex - 100) / 100));
    }
  }

  private static calculateInflationIndex(priceAsRatio: number): number {
    return 100 * (1 + (1 - priceAsRatio) / priceAsRatio);
  }

  public static idCount = 0;

  public static fromJsonCache(obj: IJsonCache): Marker {
    const marker = new Marker(
      dayjs.utc(obj.startingDate),
      obj.durationInHours,
      obj.startingCirculation,
      obj.startingCapital, 
    );
    marker.circulationAddedMap = obj.circulationAddedMap;
    marker.circulationRemovedMap = obj.circulationRemovedMap;
    marker.capitalAddedMap = obj.capitalAddedMap;
    marker.capitalRemovedMap = obj.capitalRemovedMap;
    marker.startingVaultMeta = obj.startingVaultMeta;
    marker.endingVaultMeta = obj.endingVaultMeta;
    marker.startingReserveMeta = obj.startingReserveMeta;
    marker.endingReserveMeta = obj.endingReserveMeta;

    marker.updateProfitFromTaxation();
    marker.updateProfitFromChanges();

    return marker;
  }

  public static merge(markers: Marker[]) {
    if (markers.length === 0) {
      throw new Error("Cannot merge an empty array of markers");
    }

    const firstMarker = markers[0];
    const lastMarker = markers[markers.length - 1];
    const durationInHours = lastMarker.nextDate.diff(firstMarker.startingDate, 'hour');
    const merged = new Marker(firstMarker.startingDate, durationInHours, firstMarker.startingCirculation, firstMarker.startingCapital);
    
    merged.startingVaultMeta = firstMarker.startingVaultMeta;
    merged.endingVaultMeta = lastMarker.endingVaultMeta;

    merged.startingReserveMeta = firstMarker.startingReserveMeta;
    merged.endingReserveMeta = firstMarker.endingReserveMeta;

    markers.forEach(marker => {
      merged.seigniorage += marker.seigniorage;
      Object.entries(marker.circulationAddedMap).forEach(([key, value]) => {
        merged.addCirculation(value || 0, key);
      });
      Object.entries(marker.circulationRemovedMap).forEach(([key, value]) => {
        merged.removeCirculation(value || 0, key);
      });
      Object.entries(marker.capitalAddedMap).forEach(([key, value]) => {
        merged.addCapital(value || 0, key);
      });
      Object.entries(marker.capitalRemovedMap).forEach(([key, value]) => {
        merged.removeCapital(value || 0, key);
      });
    });

    merged.updateProfitFromTaxation();
    merged.updateProfitFromChanges();

    return merged;
  }
} 

interface IJsonCache {
  id: number;
  durationInHours: number;
  startingDate: string;
  startingCirculation: number;
  startingCapital: number;
  startingVaultMeta: IVaultMeta;
  endingVaultMeta: IVaultMeta;
  startingReserveMeta: IReserveMeta;
  endingReserveMeta: IReserveMeta;
  circulationAddedMap: { [key: string]: number };
  circulationRemovedMap: { [key: string]: number };
  capitalAddedMap: { [key: string]: number };
  capitalRemovedMap: { [key: string]: number };
}

interface IJson {
  id: number;
  blockCount: number;
  durationInHours: number;
  startingDate: string;
  endingDate: string;
  startingPrice: number;
  endingPrice: number;
  startingCirculation: number;
  endingCirculation: number;
  startingCapital: number;
  endingCapital: number;
  startingVaultMeta: IVaultMeta;
  endingVaultMeta: IVaultMeta;
  startingReserveMeta: IReserveMeta;
  endingReserveMeta: IReserveMeta;
  circulationAddedMap: { [key: string]: number };
  circulationRemovedMap: { [key: string]: number };
  capitalAddedMap: { [key: string]: number };
  capitalRemovedMap: { [key: string]: number };
  profitFromTaxation: number;
  profitFromTaxationCompoundedAnnually: number;
  profitFromChanges: number;
  seigniorage: number;
}