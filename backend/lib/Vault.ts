import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import BtcPrices from "./BtcPrices";
import { addCommas, formatDateAsYYYYMMDD } from "./Utils";

dayjs.extend(utc);

const TERRA_COLLAPSE_DATE = '2022-05-09T00:00:00Z';
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

interface IVaultItem {
  date: Dayjs;
  nonRatchetedQty: number, 
  ratchetedQty: number, 
  nonRatchetedPrice: number, 
  ratchetedPrice: number;
}

export default class Vault {
  private vaultItems: IVaultItem[] = [];
  pctRatcheting: number;
  startDate: Dayjs;
  ratchetAt: number;
  endDate: Dayjs;
  pricePerBtc: number;

  constructor(btcValueToLoad: number, pctRatcheting: number, ratchetAt: number, startDate?: string, endDate?: string, pricePerBtc?: number) {
    this.pctRatcheting = pctRatcheting;
    this.ratchetAt = ratchetAt;

    const startDateIsValid = startDate && dayjs.utc(startDate).isValid();
    const endDateIsValid = endDate && dayjs.utc(endDate).isValid();

    this.endDate = dayjs.utc(endDateIsValid ? endDate : TERRA_COLLAPSE_DATE);
    this.startDate = dayjs.utc(startDateIsValid ? startDate : this.endDate.subtract(1, 'year')); // One year before endDate
    this.pricePerBtc = pricePerBtc || BtcPrices.get(this.endDate).price;

    // Calculate the number of days between startDate and endDate
    const daysToRun = this.endDate.diff(this.startDate, 'day');
    const btcValueToLoadPerDay = btcValueToLoad / daysToRun;

    for (let i = 0; i < daysToRun; i++) {
      const date = this.startDate.add(i, 'day');
      const currentBtcPrice = BtcPrices.get(date).price;

      this.updateRatchets(currentBtcPrice);
      this.vaultItems.push({
        date,
        nonRatchetedQty: (btcValueToLoadPerDay / currentBtcPrice) * (1 - this.pctRatcheting),
        nonRatchetedPrice: currentBtcPrice,
        ratchetedQty: (btcValueToLoadPerDay / currentBtcPrice) * this.pctRatcheting,
        ratchetedPrice: currentBtcPrice,
      });
    }
  }

  public get value() {
    return this.vaultItems.reduce((value, item) => {
      const ratchetedValue = item.ratchetedQty * Math.min(item.ratchetedPrice, this.pricePerBtc);
      const nonRatchetedValue = item.nonRatchetedQty * Math.min(item.nonRatchetedPrice, this.pricePerBtc);
      return value + ratchetedValue + nonRatchetedValue;
    }, 0);
  }

  public get bitcoins() {
    return this.vaultItems.reduce((value, item) => {
      return value + item.ratchetedQty + item.nonRatchetedQty;
    }, 0);
  }

  public calculateBurnPerBitcoinDollar(argonRatioPrice: number) {
    const r = argonRatioPrice;
    const b = 1;
    if (argonRatioPrice > 1.00) {
      return b;
    } else if (r > 0.001) {
      return (b * (0.258725 / (r - 0.000459)) + (1.367952 * Math.pow(r, 2)) - (1.628474 * r) +1)
    } else {
      return (b/r) * ((0.702 * r) +0.274);
    }
  }

  public unvault(bitcoinsToUnvault: number) {
    let bitcoinValueToUnvault = bitcoinsToUnvault * this.pricePerBtc;

    for (const item of this.vaultItems) {
      if (bitcoinValueToUnvault <= 0) break;
      let unlockPrice = Math.min(item.ratchetedPrice, this.pricePerBtc);
      let qtyToUnvault = Math.min(bitcoinValueToUnvault / unlockPrice, item.ratchetedQty);
      item.ratchetedQty -= qtyToUnvault;
      bitcoinValueToUnvault -= qtyToUnvault * unlockPrice;

      if (bitcoinValueToUnvault <= 0) break;
      unlockPrice = Math.min(item.nonRatchetedPrice, this.pricePerBtc);
      qtyToUnvault = Math.min(bitcoinValueToUnvault / unlockPrice, item.nonRatchetedQty);
      item.nonRatchetedQty -= qtyToUnvault;
      bitcoinValueToUnvault -= qtyToUnvault * unlockPrice;
    }
  }

  public exportMeta(argonRatioPrice: number): IVaultMeta {
    const burnPerBitcoinDollar = this.calculateBurnPerBitcoinDollar(argonRatioPrice);
    return {
      bitcoins: this.bitcoins,
      lockedValue: this.value,
      leveragePerDollar: burnPerBitcoinDollar,
    }
  }

  public print() {
    console.log('DATE'.padEnd(20), 'START VALUE'.padEnd(20), 'CURRENT VALUE'.padEnd(20));
    for (const item of this.vaultItems) {
      const date = item.date.format('YYYY-MM-DD');
      const startValue = (item.ratchetedQty * item.nonRatchetedPrice) + (item.nonRatchetedQty * item.nonRatchetedPrice);
      const currentValue = (item.ratchetedQty * item.ratchetedPrice) + (item.nonRatchetedQty * item.nonRatchetedPrice);
      console.log(date.padEnd(20), addCommas(startValue.toFixed(0)).padEnd(20), addCommas(currentValue.toFixed(0)).padEnd(20));
    }
    console.log('-----------');
    console.log('TOTAL VALUE', addCommas(this.value.toFixed(0)));
  }

  private updateRatchets(btcPrice: number) {
    for (const item of this.vaultItems) {
      const change = Math.abs(calculateProfit(item.ratchetedPrice, btcPrice));
      if (change >= this.ratchetAt) {
        item.ratchetedPrice = btcPrice;
      }
    }
  }
}

function calculateProfit(buyPrice: number, sellPrice: number): number {
  return (sellPrice - buyPrice) / buyPrice;
}

export interface IVaultMeta {
  bitcoins: number;
  lockedValue: number;
  leveragePerDollar: number;
}