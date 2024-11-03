import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import IRules from "../interfaces/IRules";
import Reserve, { IReserveMeta } from "./Reserve";
import { divide } from "./Utils";
import Vault, { IVaultMeta } from "./Vault";

dayjs.extend(utc);

export const ARGON_BLOCKS_PER_HOUR = 3600 / 60; // 1 block every 60 seconds

export const MINIMUM_PRICE = 0.001;
export const MAXIMUM_PRICE = 1.00;
export const DEFAULT_PRICE = 1.00;

export default class Marker {
  public id = ++Marker.idCount;
  public startingDate: Dayjs;
  public durationInHours: number;
  
  public startingCirculation: number;
  public startingCapital: number;

  public lowestPrice: number = 1.00;

  public startingVaultMeta: IVaultMeta;

  public endingVaultMeta: IVaultMeta;
  
  public startingReserveMeta: IReserveMeta;

  public endingReserveMeta: IReserveMeta;

  public circulationAdded: number = 0;
  public circulationRemoved: number = 0;
  
  public circulationAddedMap: { [key: string]: number } = {};
  public circulationRemovedMap: { [key: string]: number } = {};

  public capitalAdded: number = 0;
  public capitalRemoved: number = 0;

  public capitalAddedMap: { [key: string]: number } = {};
  public capitalRemovedMap: { [key: string]: number } = {};

  public seigniorageMap: { [key: string]: number } = {};

  public pctIncreaseFromTaxation: number = 0;
  public pctIncreaseFromAllSources: number = 0;

  private annualTransactions: number = 0;
  private annualMicropayments: number = 0;

  private disabledMechanisms: IDisabledMechanisms;

  constructor(startingDate: Dayjs, durationInHours: number, startingCirculation: number, startingCapital: number) {
    this.startingDate = startingDate;
    this.durationInHours = durationInHours;
    this.startingCirculation = startingCirculation;
    this.startingCapital = startingCapital;
    this.updateLowestPrice();
  }

  public get startingPrice(): number {
    return Marker.calculatePriceFromSupplyAndDemand(this.startingCirculation, this.startingCapital);
  }

  public get endingDate(): Dayjs {
    return this.nextDate.subtract(1, 'millisecond');
  }

  public get nextDate(): Dayjs {
    const millisecondsToAdd = this.durationInHours * 60 * 60 * 1000;
    return this.startingDate.add(millisecondsToAdd, 'millisecond');
  }

  public get currentPrice(): number {
    const currentSupply = this.currentCirculation;
    const currentDemand = this.currentCapital;
    return Marker.calculatePriceFromSupplyAndDemand(currentSupply, currentDemand);
  }

  public get currentCirculation(): number {
    return this.startingCirculation - this.circulationRemoved + this.circulationAdded;
  }

  public get currentCapital(): number {
    return this.startingCapital - this.capitalRemoved + this.capitalAdded;
  }

  public get blockCount(): number {
    return this.durationInHours * ARGON_BLOCKS_PER_HOUR;
  }

  public get pctIncreaseFromTaxationCompoundedAnnually(): number {
    if (this.pctIncreaseFromTaxation === 0) return 0;
    const compoundingPeriodsPerYear = divide(365 * 24, this.durationInHours);
    return (Math.pow(1 + this.pctIncreaseFromTaxation / 100, compoundingPeriodsPerYear) - 1) * 100;
  }

  public updateLowestPrice() {
    const currentPrice = this.currentPrice;
    if (currentPrice < this.lowestPrice) {
      this.lowestPrice = currentPrice;
    }
  }

  public addCirculation(amount: number, source: IAddCirculationKeys) {
    this.circulationAdded += amount;
    this.circulationAddedMap[source] = (this.circulationAddedMap[source] || 0) + amount;
    this.updateLowestPrice();
  }

  public removeCirculation(amount: number | number, source: IRemoveCirculationKeys) {
    this.circulationRemoved += amount;
    this.circulationRemovedMap[source] = (this.circulationRemovedMap[source] || 0) + amount;
  }

  public addCapital(amount: number, source: IAddCapitalKeys) {
    this.capitalAdded += amount;
    this.capitalAddedMap[source] = (this.capitalAddedMap[source] || 0) + amount;
  }

  public removeCapital(amount: number, source: IRemoveCapitalKeys) {
    this.capitalRemoved += amount;
    this.capitalRemovedMap[source] = (this.capitalRemovedMap[source] || 0) + amount;
    this.updateLowestPrice();
  }

  public updatePctIncreaseFromAllSources() {
    this.pctIncreaseFromAllSources = Math.max(0, Marker.calculateProfitReturn(this.lowestPrice, this.currentPrice) * 100);
  }

  public removeCirculationUsingReserveCapital(tokensToBurn: number, reserve: Reserve) {
    this.startingReserveMeta = reserve.exportMeta(this.currentPrice);
    
    const excessTokens = Math.max(this.currentCirculation - this.currentCapital, 0);
    tokensToBurn = Math.min(tokensToBurn, excessTokens);

    const amountToSpend = tokensToBurn * this.currentPrice;
    
    reserve.spend(amountToSpend);
    this.removeCirculation(tokensToBurn, 'ReserveSpend');
    this.endingReserveMeta = reserve.exportMeta(this.currentPrice);
  }

  public setAnnualTransactions(transactionsAnnually: number) {
    this.annualTransactions = transactionsAnnually;
  }

  public setAnnualMicropayments(micropaymentsAnnually: number) {
    this.annualMicropayments = micropaymentsAnnually;
  }

  public setVault(rules: IRules, vault: Vault) {
    if (!rules.enableBitcoinVaulting) return;
    vault.setDate(this.startingDate);
    this.startingVaultMeta ??= vault.exportMeta(this.startingPrice);
    this.endingVaultMeta = vault.exportMeta(this.currentPrice);
  }

  public setReserve(rules: IRules, reserve: Reserve) {
    this.startingReserveMeta ??= reserve.exportMeta(this.startingPrice);
    this.endingReserveMeta = reserve.exportMeta(this.currentPrice);
  }

  public setVaultAndReserve(rules: IRules, vault: Vault, reserve: Reserve) {
    this.setVault(rules, vault);
    this.setReserve(rules, reserve);
  }

  public tryTaxation(rules: IRules) {
    if (!rules.enableTaxation) return;
    this.runTaxation(rules);
  }

  public manageSeigniorageProfits(rules: IRules, reserve: Reserve) {
    if (this.capitalAddedMap['TerraLaunch']) {
      this.seigniorageMap['TerraLaunch'] = (this.seigniorageMap['TerraLaunch'] || 0) + this.capitalAddedMap['TerraLaunch'];
    }
  
    let excessCapital = this.currentCapital - this.currentCirculation;
    if (excessCapital <= 0.001) return;

    if (this.circulationRemovedMap['ReserveSpend']) {
      const spendToReverse = Math.min(excessCapital, this.circulationRemovedMap['ReserveSpend']);
      this.seigniorageMap['ReserveSpend'] -= spendToReverse;
      reserve.reverseSpend(spendToReverse);
      this.setReserve(rules, reserve);
      excessCapital -= spendToReverse;
    }
    if (excessCapital <= 0.001) return;

    const transactionTaxes = this.circulationRemovedMap['TransactionalTaxes'] || 0;
    const micropaymentTaxes = this.circulationRemovedMap['MicropaymentTaxes'] || 0;
    const circulationRemovedUsingTaxes = transactionTaxes + micropaymentTaxes;

    if (circulationRemovedUsingTaxes) {
      const taxPctToShift = divide(Math.min(circulationRemovedUsingTaxes, excessCapital), circulationRemovedUsingTaxes);
      const transactionTaxToShift = transactionTaxes * taxPctToShift;
      const micropaymentTaxToShift = micropaymentTaxes * taxPctToShift;
      
      this.seigniorageMap['TransactionalTaxes'] = (this.seigniorageMap['TransactionalTaxes'] || 0) + transactionTaxToShift;
      this.seigniorageMap['MicropaymentTaxes'] = (this.seigniorageMap['MicropaymentTaxes'] || 0) + micropaymentTaxToShift;
      this.circulationRemovedMap['TransactionalTaxes'] = transactionTaxes - transactionTaxToShift;
      this.circulationRemovedMap['MicropaymentTaxes'] = micropaymentTaxes - micropaymentTaxToShift;

      this.circulationRemoved -= transactionTaxToShift + micropaymentTaxToShift;
    }

    excessCapital = this.currentCapital - this.currentCirculation;
    if (excessCapital <= 0.001) return;

    for (const key of ['SpeculativeGreed', 'CertaintyGreed']) {
      excessCapital = this.currentCapital - this.currentCirculation;
      if (excessCapital <= 0.001) break;

      const capitalToShift = Math.max((this.capitalAddedMap[key] || 0) - excessCapital, 0);
      if (!capitalToShift) continue;

      this.seigniorageMap[key] = (this.seigniorageMap[key] || 0) + capitalToShift;
      this.capitalAddedMap[key] = (this.capitalAddedMap[key] || 0) - capitalToShift;
      this.capitalAdded -= capitalToShift;
    }
  }

  public runTaxation(rules: IRules) {
    const currentCirculationPct = divide(this.currentCirculation, rules.circulation);

    const transactionsHourly = divide(this.annualTransactions, 365 * 24);
    const micropaymentsHourly = divide(this.annualMicropayments, 365 * 24);

    const transactionsToTax = transactionsHourly * this.durationInHours * currentCirculationPct;
    const micropaymentsToTax = micropaymentsHourly * this.durationInHours;

    const beforeCirculation = this.currentCirculation;
    const beforeTaxationPrice = this.currentPrice;
    const averagePrice = divide(this.startingPrice + beforeTaxationPrice, 2);

    this.removeCirculation(transactionsToTax * 0.20, 'TransactionalTaxes');
    this.removeCirculation(Marker.calculateWageProtectedPrice(micropaymentsToTax, averagePrice) * 0.20, 'MicropaymentTaxes');
    this.pctIncreaseFromTaxation = Math.max(0, Marker.calculateProfitReturn(beforeTaxationPrice, this.currentPrice) * 100);
  }

  public runRecovery(rules: IRules, previousMarkers: Marker[], vault: Vault) {
    this.tryTaxation(rules);

    if (rules.enableCertaintyGreed && this.currentPrice < MAXIMUM_PRICE) {
      this.runCertaintyGreed(rules, previousMarkers);
    }

    vault.setDate(this.startingDate);
    this.startingVaultMeta = vault.exportMeta(this.startingPrice);
    if (rules.enableBitcoinVaulting && this.currentPrice < MAXIMUM_PRICE) {
      this.runBitcoinFusion(rules, vault);
    }
    this.endingVaultMeta = vault.exportMeta(this.currentPrice);

    this.updatePctIncreaseFromAllSources();

    if (rules.enableSpeculativeGreed && this.currentPrice < MAXIMUM_PRICE) {
      this.runSpeculativeGreed(rules, previousMarkers);
      this.updatePctIncreaseFromAllSources();
    }
  }

  public runDisabledMechanisms(rules: IRules, isFullyDisabled: boolean = false) {
    // if (this.disabledMechanisms.bitcoinFusion) {
    //   this.runBitcoinFusion(rules, this.vault);
    // }
  }

  private runSpeculativeGreed(rules: IRules, previousMarkers: Marker[]) {
    const profitPotentials = [];

    const maxCapMarkers = Math.round(rules.speculativeLatencyHigh/(this.durationInHours === 24 ? 24 : 1));
    const cappedMarkers = previousMarkers.slice(-maxCapMarkers);
    const cappedMarkerHours = cappedMarkers.length * this.durationInHours; // we're assuming all markers are the same duration

    if (cappedMarkerHours < (rules.certaintyLatencyLow || 1)) {
      // The minimum timeframe must have passed
      return;
    }

    for (let index = cappedMarkers.length - 1; index >= 0; index--) {
      const marker = cappedMarkers[index];
      const hoursPassed = (cappedMarkers.length - (index + 1)) * this.durationInHours;

      if (marker.pctIncreaseFromAllSources < rules.speculativeGreedLow && hoursPassed < rules.speculativeLatencyLow) {
        /*
         * If any of the markers within latencyLow have a profit lower than greedLow,
         * then we must completely bail. This ensures we only proceed when all recent
         * markers meet the minimum profit threshold.
         */
        return;
      }
      // only accept markers that had profit above greedLow, otherwise treat profit as zero
      const profitPotential = marker.pctIncreaseFromAllSources;
      profitPotentials.push(profitPotential >= rules.speculativeGreedLow ? profitPotential : 0);
    }

    const averageProfitPotential: number = divide(profitPotentials.reduce((acc, potential) => acc + potential, 0), profitPotentials.length);

    /**
     * Calculates the greed factor based on the average profit potential.
     * The greed factor is a normalized value between 0 and 1, representing
     * the relative position of the average profit potential between the
     * greedLow and greedHigh thresholds. It is divided by 24 to adjust
     * for hourly calculations.
     */
    const greedFactor = divide(Math.min(divide(averageProfitPotential - rules.speculativeGreedLow, rules.speculativeGreedHigh - rules.speculativeGreedLow), 1), 24);
    
    /**
     * Convert speculativeMaxDailyIncrease to an hourly increase. Then use
     * currentCapital from yesterday's markers so it doesn't
     * compound over 24 hours into a return that's larger than the max.
     */
    const maxIncreasePerMarker = divide(rules.speculativeMaxDailyIncrease, 24) * this.durationInHours;
    const yesterdaysMarker = cappedMarkers[cappedMarkers.length - (this.durationInHours === 24 ? 1 : 24)];
    const excessCirculation = this.calculateExcessSupply(this.currentCirculation);

    if (averageProfitPotential >= rules.speculativeGreedHigh) {
      const capitalToAdd = Math.min(maxIncreasePerMarker * yesterdaysMarker.currentCapital, excessCirculation);
      this.addCapital(capitalToAdd, 'SpeculativeGreed');
    } else if (averageProfitPotential > rules.speculativeGreedLow) {
      const capitalToAdd = Math.min(maxIncreasePerMarker * yesterdaysMarker.currentCapital * greedFactor, excessCirculation);
      this.addCapital(capitalToAdd, 'SpeculativeGreed');
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

    const maxCapMarkers = Math.round(rules.certaintyLatencyHigh/(this.durationInHours === 24 ? 24 : 1));
    const cappedMarkers = previousMarkers.slice(-maxCapMarkers);
    const cappedMarkerHours = cappedMarkers.length * this.durationInHours; // we're assuming all markers are the same duration

    if (cappedMarkerHours < (rules.certaintyLatencyLow || 1)) {
      // The minimum timeframe must have passed
      return;
    }

    for (let index = cappedMarkers.length - 1; index >= 0; index--) {
      const marker = cappedMarkers[index];
      const hoursPassed = (cappedMarkers.length - (index + 1)) * this.durationInHours;
      if (marker.pctIncreaseFromTaxationCompoundedAnnually < rules.certaintyGreedLow && hoursPassed < rules.certaintyLatencyLow) {
        /*
         * If any of the markers within latencyLow have a profit lower than greedLow,
         * then we must completely bail. This ensures we only proceed when all recent
         * markers meet the minimum profit threshold.
         */
        return;
      }
      // only accept markers that had profit above greedLow, otherwise treat profit as zero
      const profitPotential = marker.pctIncreaseFromTaxationCompoundedAnnually;
      profitPotentials.push(profitPotential >= rules.certaintyGreedLow ? profitPotential : 0);
    }

    const averageProfitPotential: number = divide(profitPotentials.reduce((acc, potential) => acc + potential, 0), profitPotentials.length);
    /**
     * Calculates the greed factor based on the average profit potential.
     * The greed factor is a normalized value between 0 and 1, representing
     * the relative position of the average profit potential between the
     * greedLow and greedHigh thresholds. It is divided by 24 to adjust
     * for hourly calculations.
     */
    const greedFactor = divide(Math.min(divide(averageProfitPotential - rules.certaintyGreedLow, rules.certaintyGreedHigh - rules.certaintyGreedLow), 1), 24);
    /**
     * Convert certaintyMaxDailyIncrease to an hourly increase. Then use
     * currentCapital from yesterday's markers so it doesn't
     * compound over 24 hours into a return that's larger than the max.
     */
    const maxIncreasePerMarker = divide(rules.certaintyMaxDailyIncrease, 24) * this.durationInHours;
    const yesterdaysMarker = cappedMarkers[cappedMarkers.length - (this.durationInHours === 24 ? 1 : 24)];
    const excessCirculation = this.calculateExcessSupply(this.currentCirculation);

    if (averageProfitPotential >= rules.certaintyGreedHigh) {
      const capitalToAdd = Math.min(maxIncreasePerMarker * yesterdaysMarker.currentCapital, excessCirculation);
      this.addCapital(capitalToAdd, 'CertaintyGreed');
    } else if (averageProfitPotential > rules.certaintyGreedLow) {
      const capitalToAdd = Math.min(maxIncreasePerMarker * yesterdaysMarker.currentCapital * greedFactor, excessCirculation);
      this.addCapital(capitalToAdd, 'CertaintyGreed');
    }
  }

  public runBitcoinFusion(rules: IRules, vault: Vault) {
    vault.setDate(this.startingDate);
    const excessCirculation = this.calculateExcessSupply(this.currentCirculation);
    if (excessCirculation <= 0) return;

    const unlockBurnPerBitcoinDollar = vault.calculateUnlockBurnPerBitcoinDollar(this.lowestPrice);
    const bitcoinsToUnvault = this.throttleBitcoinsToUnvault(divide(excessCirculation, (unlockBurnPerBitcoinDollar * vault.pricePerBtc), 20), vault, rules);
    if (!bitcoinsToUnvault) return;

    vault.unvault(bitcoinsToUnvault);
    this.removeCirculation(bitcoinsToUnvault * (unlockBurnPerBitcoinDollar * vault.pricePerBtc), 'BitcoinFusion');
  }

  private throttleBitcoinsToUnvault(bitcoinsToUnvault: number, vault: Vault, rules: IRules) {
    const currentUnlockValue = vault.getTotalUnlockValue();
    const currentUnlockValuePerBtc = divide(currentUnlockValue, vault.bitcoinCount);
    const maximumUnlockValue = divide(this.currentCirculation, 2);
    const maximumBitcoinCount = divide(maximumUnlockValue, currentUnlockValuePerBtc);

    const unlockBurnPerDollarAtHalfPrice = vault.calculateUnlockBurnPerBitcoinDollar(this.currentPrice / 2);
    const bitcoinsNeededAtHalfPrice = divide(this.currentCirculation, (unlockBurnPerDollarAtHalfPrice * vault.pricePerBtc), 20);
    
    const bitcoinsClearToUse = vault.bitcoinCount - bitcoinsNeededAtHalfPrice;
    const bitcoinsDesiredClear = maximumBitcoinCount - bitcoinsNeededAtHalfPrice;

    if (this.currentPrice < 0.98) {
      const latencyFactor = Math.min(divide(bitcoinsClearToUse, bitcoinsDesiredClear), 1);
      const hoursToFinishUnlocking = (rules.unvaultLatencyInHours - (rules.unvaultLatencyInHours * latencyFactor)) || 1;
      const bitcoinsToUnvaultPerHour = divide(Math.min(bitcoinsToUnvault, vault.bitcoinCount), hoursToFinishUnlocking);
      bitcoinsToUnvault = bitcoinsToUnvaultPerHour * (Math.min(hoursToFinishUnlocking, this.durationInHours));
    }

    return Math.min(bitcoinsToUnvault, rules.btcMaxTxnsPerHour * this.durationInHours);
  }

  public toJsonCache(): IJsonCache {
    return {
      id: this.id,
      startingDate: this.startingDate.toISOString(),
      durationInHours: this.durationInHours,
      startingCirculation: this.startingCirculation,
      startingCapital: this.startingCapital,
      lowestPrice: this.lowestPrice,
      startingVaultMeta: this.startingVaultMeta,
      endingVaultMeta: this.endingVaultMeta,
      startingReserveMeta: this.startingReserveMeta,
      endingReserveMeta: this.endingReserveMeta,
      circulationAddedMap: this.circulationAddedMap,
      circulationRemovedMap: this.circulationRemovedMap,
      capitalAddedMap: this.capitalAddedMap,
      capitalRemovedMap: this.capitalRemovedMap,
      seigniorageMap: this.seigniorageMap,
      annualTransactions: this.annualTransactions,
      annualMicropayments: this.annualMicropayments,
      pctIncreaseFromTaxation: this.pctIncreaseFromTaxation,
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
      lowestPrice: this.lowestPrice,
      endingPrice: this.currentPrice,
      startingVaultMeta: this.startingVaultMeta,
      endingVaultMeta: this.endingVaultMeta,
      startingReserveMeta: this.startingReserveMeta,
      endingReserveMeta: this.endingReserveMeta,
      circulationAddedMap: this.circulationAddedMap,
      circulationRemovedMap: this.circulationRemovedMap,
      capitalAddedMap: this.capitalAddedMap,
      capitalRemovedMap: this.capitalRemovedMap,
      pctIncreaseFromTaxation: this.pctIncreaseFromTaxation,
      pctIncreaseFromTaxationCompoundedAnnually: this.pctIncreaseFromTaxationCompoundedAnnually,
      pctIncreaseFromAllSources: this.pctIncreaseFromAllSources,
      seigniorageMap: this.seigniorageMap,
      annualTransactions: this.annualTransactions,
      annualMicropayments: this.annualMicropayments,
      disabledMechanisms: this.disabledMechanisms,
    };
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Static methods
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  public static calculateCapitalFromCirculationAndPrice(circulation: number, price: number): number {
    return circulation * price;
  }

  private static calculatePriceFromSupplyAndDemand(currentCirculationSupply: number, currentCapitalDemand: number): number {
    if (currentCapitalDemand === 0 && currentCirculationSupply === 0) {
      return DEFAULT_PRICE;
    }
    return divide(currentCapitalDemand, currentCirculationSupply);
  }

  public calculateExcessSupply(circulation: number): number {
    return circulation - this.currentCapital;
  }

  public static calculateProfitReturn(startingPrice: number, endingPrice: number): number {
    return divide(endingPrice - startingPrice, startingPrice);
  }

  private static calculateWageProtectedPrice(micropaymentAmount: number, priceAsRatio: number): number {
    const inflationIndex = this.calculateInflationIndex(priceAsRatio);
    if (inflationIndex <= 100) {
      return micropaymentAmount;
    } else {
      return micropaymentAmount * (1 + divide(inflationIndex - 100, 100));
    }
  }

  private static calculateInflationIndex(priceAsRatio: number): number {
    return 100 * (1 + divide(1 - priceAsRatio, priceAsRatio));
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
    marker.seigniorageMap = obj.seigniorageMap;
    marker.endingVaultMeta = obj.endingVaultMeta;
    marker.startingReserveMeta = obj.startingReserveMeta;
    marker.endingReserveMeta = obj.endingReserveMeta;
    marker.pctIncreaseFromTaxation = obj.pctIncreaseFromTaxation;

    marker.setAnnualTransactions(obj.annualTransactions);
    marker.setAnnualMicropayments(obj.annualMicropayments);
    marker.updatePctIncreaseFromAllSources();

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
      Object.entries(marker.seigniorageMap).forEach(([key, value]) => {
        merged.seigniorageMap[key] = (merged.seigniorageMap[key] || 0) + (value || 0);
      });
      Object.entries(marker.circulationAddedMap).forEach(([key, value]) => {
        merged.addCirculation(value || 0, key as IAddCirculationKeys);
      });
      Object.entries(marker.circulationRemovedMap).forEach(([key, value]) => {
        merged.removeCirculation(value || 0, key as IRemoveCirculationKeys);
      });
      Object.entries(marker.capitalAddedMap).forEach(([key, value]) => {
        merged.addCapital(value || 0, key as IAddCapitalKeys);
      });
      Object.entries(marker.capitalRemovedMap).forEach(([key, value]) => {
        merged.removeCapital(value || 0, key as IRemoveCapitalKeys);
      });
      merged.pctIncreaseFromTaxation += marker.pctIncreaseFromTaxation;
    });

    merged.setAnnualTransactions(lastMarker.annualTransactions);
    merged.setAnnualMicropayments(lastMarker.annualMicropayments);
    merged.updatePctIncreaseFromAllSources();
    return merged;
  }
} 

interface IJsonCache {
  id: number;
  durationInHours: number;
  startingDate: string;
  startingCirculation: number;
  startingCapital: number;
  lowestPrice: number;
  startingVaultMeta: IVaultMeta;
  endingVaultMeta: IVaultMeta;
  startingReserveMeta: IReserveMeta;
  endingReserveMeta: IReserveMeta;
  circulationAddedMap: { [key: string]: number };
  circulationRemovedMap: { [key: string]: number };
  capitalAddedMap: { [key: string]: number };
  capitalRemovedMap: { [key: string]: number };
  seigniorageMap: { [key: string]: number };
  annualTransactions: number;
  annualMicropayments: number;
  pctIncreaseFromTaxation: number;
}

interface IJson {
  id: number;
  blockCount: number;
  durationInHours: number;
  startingDate: string;
  endingDate: string;
  startingPrice: number;
  lowestPrice: number;
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
  pctIncreaseFromTaxation: number;
  pctIncreaseFromTaxationCompoundedAnnually: number;
  pctIncreaseFromAllSources: number;
  seigniorageMap: { [key: string]: number };
  annualTransactions: number;
  annualMicropayments: number;
  disabledMechanisms: IDisabledMechanisms;
}

interface IDisabledMechanisms {
  bitcoinFusion: boolean;
  micropaymentTaxation: boolean;
  transactionTaxation: boolean;
}

type IAddCirculationKeys = 'TerraLaunch';
type IRemoveCirculationKeys = 'ReserveSpend' | 'BitcoinFusion' | 'TransactionalTaxes' | 'MicropaymentTaxes';

type ISegniorageKeys = 'TransactionalTaxes' | 'MicropaymentTaxes' | 'TerraLaunch' | 'SpeculativeGreed' | 'CertaintyGreed';

type IAddCapitalKeys = 'TerraLaunch' | 'SpeculativeGreed' | 'CertaintyGreed';
type IRemoveCapitalKeys = 'TerraCollapse';
