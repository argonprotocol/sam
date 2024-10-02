import IRules from "../interfaces/IRules";
import { addCommas } from "./utils";
import Vault from "./Vault";

export const TERRA_BLOCKS_PER_HOUR = 3600 / 6; // 1 block every 6 seconds
export const ARGON_BLOCKS_PER_HOUR = 3600 / 60; // 1 block every 60 seconds

export const MINIMUM_PRICE = 0.001;
export const MAXIMUM_PRICE = 1.00;

export default class Marker {
  public id = ++Marker.idCount;
  public type: 'argon' | 'terra';
  public startingDate: Date;
  public durationInHours: number;
  public startingPrice: number;
  public startingCirculation: number;
  public startingBitcoinsVaulted: number;
  public previousMarkers: Marker[];
  // This tracks the amount of argon burned during bitcoin fusion
  public burnedByBitcoins: number[] = [];
  
  // This tracks the amount of argon burned during bitcoin fusion
  public burnedByTaxation: number[] = [];

  // This tracks the amount of bitcoins unvaulted during bitcoin fusion
  public bitcoinsUnvaulted: number[] = [];

  // This is used to remove terra from circulation during its collapse to match what actually happened  
  public bailoutReductionOnCirculation: number[] = [];

  // This track the amount of capital outflow during collapse
  public capitalOutflow: number[] = [];
  
  public certaintyGreedInflow: number[] = [];

  private vault: Vault;

  constructor(type: 'argon' | 'terra', startingDate: Date, durationInHours: number, startingPrice: number, startingCirculation: number, vault: Vault, previousMarkers: Marker[] = []) {
    this.type = type;
    this.startingDate = startingDate;
    this.durationInHours = durationInHours;
    this.startingPrice = startingPrice;
    this.startingCirculation = startingCirculation;
    this.vault = vault;
    this.previousMarkers = previousMarkers;
  }

  public get nextDate() {
    const millisecondsToAdd = (this.durationInHours * 60 * 60 * 1000);
    return new Date(this.startingDate.getTime() + millisecondsToAdd);
  }

  public get endingDate() {
    return new Date(this.nextDate.getTime() - 1);
  }

  public get currentPrice() {
    const currentSupply = this.currentCirculation;
    const currentDemand = this.currentStablecoinDemand;
    const price = this.calculatePriceFromSupplyAndDemand(currentSupply, currentDemand);
    return price;
  }

  public get currentCirculation() {
    const removedThroughBailout = this.bailoutReductionOnCirculation.reduce((acc, amount) => acc + amount, 0);
    const burnedByBitcoins = this.burnedByBitcoins.reduce((acc, amount) => acc + amount, 0);
    const burnedByTaxation = this.burnedByTaxation.reduce((acc, amount) => acc + amount, 0);
    return this.startingCirculation - (removedThroughBailout + burnedByBitcoins + burnedByTaxation);
  }

  public get currentBitcoinsVaulted() {
    const bitcoinsUnvaulted = this.bitcoinsUnvaulted.reduce((acc, amount) => acc + amount, 0);
    return this.startingBitcoinsVaulted - bitcoinsUnvaulted;
  }

  public get currentStablecoinDemand(): number {
    // We use starting values because the only thing that changes the value is bailoutReductionOnCirculation
    const currentCirculation = this.startingCirculation - this.bailoutReductionOnCirculation.reduce((acc, amount) => acc + amount, 0);
    const baseDemand = currentCirculation * this.startingPrice;
    const capitalOutflow = this.capitalOutflow.reduce((acc, outflow) => acc + outflow, 0);
    const capitalInflow = this.certaintyGreedInflow.reduce((acc, inflow) => acc + inflow, 0);
    return (baseDemand + capitalInflow) - capitalOutflow;
  }

  public get blockCount() {
    return this.durationInHours * (this.type === 'argon' ? ARGON_BLOCKS_PER_HOUR : TERRA_BLOCKS_PER_HOUR);
  }

  public get profitPotential() {
    return this.calculateProfitReturn(this.startingPrice, this.currentPrice);
  }

  public get profitPotentialCompoundedAnnually() {
    return Math.pow(this.profitPotential + 1, (365 * 24) / this.durationInHours) - 1;
  }

  public get isArgon() {
    return this.type === 'argon';
  }

  public get isTerra() {
    return this.type === 'terra';
  }

  public runBeginningOfCollapse(capitalOutflow: number) {
    this.capitalOutflow.push(capitalOutflow);
  }

  public runRemainingCollapse(previousReturn: number) {
    const startingDemand = this.startingCirculation * this.startingPrice;
    const nextPrice = this.calculateNextPrice(this.startingPrice, previousReturn);
    const nextDemand = this.startingCirculation * nextPrice;
    const capitalOutflow = startingDemand - nextDemand;
    if (capitalOutflow <= 0) return;

    this.capitalOutflow.push(capitalOutflow);
  }

  public runRecovery(rules: IRules) {
    this.runTaxation(rules.taxableEvents, rules.micropayments);

    if (rules.certaintyGreedEnabled && this.currentPrice < MAXIMUM_PRICE) {
      this.runCertaintyGreed(rules.certaintyGreedLow, rules.certaintyGreedHigh, rules.certaintyLatencyLow, rules.certaintyLatencyHigh);
    }

    if (this.currentPrice < MAXIMUM_PRICE) {
      this.runSpeculativeGreed();
    }

    if (this.isArgon && this.currentPrice < MAXIMUM_PRICE) {
      this.runBitcoinFusion(rules);
    }
  }

  public runBitcoinFusion(rules: IRules) {
    const excessArgons = this.calculateExcessSupply(this.currentCirculation);
    const burnPerBitcoinDollar = this.vault.calculateBurnPerBitcoinDollar(this.startingPrice);
    const bitcoinsNeeded = excessArgons / (burnPerBitcoinDollar * this.vault.pricePerBtc);
    const bitcoinsToUnvault = Math.min(bitcoinsNeeded, rules.btcMaxTxns, this.vault.bitcoins);

    // Calculate the minimum price per bitcoin that would still burn the excess supply
    const minPricePerBitcoin = excessArgons / burnPerBitcoinDollar / (this.vault.bitcoins || 1);

    const bitcoinSnapshot = {
      excessArgons,
      valueOfStablecoinDemand: this.currentStablecoinDemand,
      bitcoinsVaulted: this.vault.bitcoins,
      burnPerBitcoinDollar,
      bitcoinsNeeded,
      minPricePerBitcoin,
      bitcoinsUnvaulted: bitcoinsToUnvault,
    }

    this.vault.unvault(bitcoinsToUnvault);
    this.burnedByBitcoins.push(bitcoinsToUnvault * (burnPerBitcoinDollar * this.vault.pricePerBtc));
    this.bitcoinsUnvaulted.push(bitcoinsToUnvault);
  }

  public runSpeculativeGreed() {

  }

  public runTaxation(taxableTransactionsAnnually: number, micropaymentsAnnually: number) {
    const taxableTransactionsHourly = taxableTransactionsAnnually / 365 / 24;
    const micropaymentRevenueHourly = micropaymentsAnnually / 365 / 24;

    const taxableTransactions = taxableTransactionsHourly * this.durationInHours;
    const micropaymentRevenue = micropaymentRevenueHourly * this.durationInHours;

    const burnFromTransactions = taxableTransactions * 0.20;
    const burnFromMicropaymentRevenue = this.calculateWageProtectedPrice(micropaymentRevenue) * 0.20;

    let burnTotal = burnFromTransactions + burnFromMicropaymentRevenue;
    if (this.startingCirculation - burnTotal < this.currentStablecoinDemand) {
      // If the burn is too much, we need to reduce it to the amount that is needed to match the demand. In the real world,
      // this would push the argon above 1.00 and profit the Ownership Tokens through minting. However, that is beyond the scope of
      // SAM, so in this simulation we're just going to ignore it.
      burnTotal = this.startingCirculation - this.currentStablecoinDemand;
    }

    this.burnedByTaxation.push(burnTotal);
  }

  public runCertaintyGreed(greedLow: number, greedHigh: number, latencyLow: number, latencyHigh: number) {
    // There may be a better way to do this, but this is the current idea:
    // We look at the profit potential of the previous markers and only add to the current marker's certainty greed if the profit potential is
    // between the greedLow and greedHigh. We also only look at the previous markers up to the latencyHigh.

    const profitPotentials = [];
    const previousMarkers = this.previousMarkers.slice(-latencyHigh).reverse();
    if (previousMarkers.length < latencyLow) {
      return;
    }    

    for (let index = 0; index < previousMarkers.length; index++) {
      const marker = previousMarkers[index];
      if (marker.profitPotentialCompoundedAnnually < greedLow && index < latencyLow) {
        return;
      }
      const profitPotential = marker.profitPotentialCompoundedAnnually;
      profitPotentials.push(profitPotential >= greedLow ? profitPotential : 0);
    }

    const averageProfitPotential = profitPotentials.reduce((acc, potential) => acc + potential, 0) / profitPotentials.length;
    const greedFactor = Math.min((averageProfitPotential - greedLow) / (greedHigh - greedLow), 1) / 24;

    if (averageProfitPotential >= greedHigh) {
      this.certaintyGreedInflow.push(0.5 * this.currentStablecoinDemand);
    } else if (averageProfitPotential > greedLow) {
      const additionalDemand = 0.5 * this.currentStablecoinDemand * greedFactor;
      this.certaintyGreedInflow.push(additionalDemand);
    }
  }

  public runCertaintyLatency() {

  }

  public manuallyRemoveCirculation(amount: number) {
    this.bailoutReductionOnCirculation.push[amount];
  }

  private calculatePriceFromSupplyAndDemand(currentCirculationSupply: number, currentDemandValue: number): number {
    return currentDemandValue / currentCirculationSupply;
  }

  public calculateExcessSupply(circulation: number): number {
    return circulation - this.currentStablecoinDemand;
  }

  public calculateProfitReturn(startingPrice: number, endingPrice: number): number {
    return (endingPrice - startingPrice) / startingPrice;
  }

  private calculateNextPrice(startingPrice: number, previousReturn: number): number {
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

  private calculateWageProtectedPrice(micropayments: number): number {
    const inflationIndex = this.calculateInflationIndex(this.currentPrice);
    if (inflationIndex <= 100) {
      return micropayments;
    } else {
      return micropayments * (1 + ((inflationIndex - 100) / 100));
    }
  }

  private calculateInflationIndex(ratio: number): number {
    return 100 * (1 + (1 - ratio) / ratio);
  }


  public exportToJson() {
    return {
      id: this.id,
      type: this.type,
      startingDate: this.startingDate.toISOString(),
      durationInHours: this.durationInHours,
      startingPrice: this.startingPrice,
      startingCirculation: this.startingCirculation,
      startingBitcoinsVaulted: this.startingBitcoinsVaulted,
      burnedByBitcoins: this.burnedByBitcoins,
      burnedByTaxation: this.burnedByTaxation,
      bitcoinsUnvaulted: this.bitcoinsUnvaulted,
      bailoutReductionOnCirculation: this.bailoutReductionOnCirculation,
      capitalOutflow: this.capitalOutflow,
      certaintyGreedInflow: this.certaintyGreedInflow,
    };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Static methods
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  public static idCount = 0;

  public static merge(markers: Marker[]) {
    if (markers.length === 0) {
      throw new Error("Cannot merge an empty array of markers");
    }

    const firstMarker = markers[0];
    const lastMarker = markers[markers.length - 1];
    const durationInHours = Math.round((lastMarker.nextDate.getTime() - firstMarker.startingDate.getTime()) / (1000 * 60 * 60));

    const merged = new Marker(markers[0].type, markers[0].startingDate, durationInHours, markers[0].startingPrice, markers[0].startingCirculation, markers[0].vault);
    merged.startingBitcoinsVaulted = firstMarker.startingBitcoinsVaulted;
    merged.bailoutReductionOnCirculation = markers.reduce((acc, marker) => {
      acc.push(...marker.bailoutReductionOnCirculation);
      return acc;
    }, []);
    merged.burnedByBitcoins = markers.reduce((acc, marker) => {
      acc.push(...marker.burnedByBitcoins);
      return acc;
    }, []);
    merged.burnedByTaxation = markers.reduce((acc, marker) => {
      acc.push(...marker.burnedByTaxation);
      return acc;
    }, []);
    merged.bitcoinsUnvaulted = markers.reduce((acc, marker) => {
      acc.push(...marker.bitcoinsUnvaulted);
      return acc;
    }, []);
    merged.capitalOutflow = markers.reduce((acc, marker) => {
      acc.push(...marker.capitalOutflow);
      return acc;
    }, []);

    return merged;
  }
} 