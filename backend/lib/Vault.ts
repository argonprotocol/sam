import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import BtcPrices from "./BtcPrices";
import { cleanRound, divide } from "./Utils";
import IRules from "../interfaces/IRules";

dayjs.extend(utc);

interface IVaultItem {
  date: Dayjs;
  nonRatchetedQty: number, 
  ratchetedQty: number, 
  nonRatchetedPrice: number, 
  ratchetedPrice: number;
  pendingRatchetValue: number; // this allows us to keep track of bitcoins that would be ratcheted except there is no minting space (i.e., bitcoins cannot mint more than half)
}

type ILoadType = 'live' | 'cached';

export default class Vault {
  public loadType: ILoadType = null;
  
  private _byDate: { [date: string]: IVaultItem } = {};
  private _meta: Omit<IVaultMeta, 'unlockBurnPerBitcoinDollar'>;

  private currentDate: Dayjs;

  private pricePerBtcOverride: number;

  constructor(loadType: ILoadType, currentDate: Dayjs = dayjs.utc()) {
    this.loadType = loadType;
    this.currentDate = currentDate;
  }

  public get byDate() {
    if (this.loadType !== 'live') throw new Error('Invalid load type');
    return this._byDate;
  }

  public get meta() {
    if (this.loadType !== 'cached') throw new Error('Invalid load type');
    return this._meta;
  }

  public get pricePerBtc() {
    return this.pricePerBtcOverride ?? BtcPrices.get(this.currentDate).price;
  }

  public get bitcoinCount() {
    if (this.loadType === 'cached') {
      return this.meta.bitcoinCount;
    }

    return Object.values(this.byDate).reduce((value, item) => {
      return value + item.ratchetedQty + item.nonRatchetedQty;
    }, 0);
  }

  public setPricePerBtcOverride(price: number) {
    this.pricePerBtcOverride = price;
  }

  public setDate(date: Dayjs) {
    this.currentDate = date;
  }

  public loadForDate(currentCirculation: number, currentDate: Dayjs, rules: IRules) {
    if (this.loadType !== 'live') throw new Error('Invalid load type');
    if (!currentDate.isValid()) throw new Error('Invalid load date');

    const vaultCapacityDec = rules.btcVaultCapacityPct / 100;
    const ratchetingDec = rules.btcRatchetingPct / 100;
    const maxLockedValue = cleanRound(divide(currentCirculation, 2) * (vaultCapacityDec), 2);

    this.currentDate = currentDate;
    this.cleanupOldItems();
    this.updateRatchets(maxLockedValue, rules);

    const pricePerBtc = this.pricePerBtc;
    const currentLockValue = cleanRound(this.getTotalLockValue(), 2);
    const openValue = Math.max(maxLockedValue - currentLockValue, 0);
    if (openValue <= 0) {
      return;
    }

    const item = this.byDate[currentDate.format('YYYY-MM-DD')] ??= {
      date: currentDate,
      nonRatchetedQty: 0,
      nonRatchetedPrice: pricePerBtc,
      ratchetedQty: 0,
      ratchetedPrice: pricePerBtc,
      pendingRatchetValue: 0,
    };
    item.nonRatchetedQty += divide(openValue, pricePerBtc) * (1 - ratchetingDec);
    item.ratchetedQty += divide(openValue, pricePerBtc) * ratchetingDec;
  }

  public loadFromCache(meta: IVaultMeta) {
    if (this.loadType !== 'cached') throw new Error('Invalid load type');
    
    this._meta = {
      bitcoinCount: meta.bitcoinCount,
      lockPricePerBitcoin: meta.lockPricePerBitcoin,
      unlockPricePerBitcoin: meta.unlockPricePerBitcoin,
    }

    return this;
  }

  public getTotalLockValue() {
    if (this.loadType === 'cached') {
      return this.meta.lockPricePerBitcoin * this.meta.bitcoinCount;
    }
    return Object.values(this.byDate).reduce((value, item) => {
      const ratchetedValue = (item.ratchetedQty * item.ratchetedPrice) - item.pendingRatchetValue;
      const nonRatchetedValue = item.nonRatchetedQty * item.nonRatchetedPrice;
      return value + ratchetedValue + nonRatchetedValue;
    }, 0);
  }

  public getTotalUnlockValue() {
    if (this.loadType === 'cached') {
      return this.meta.unlockPricePerBitcoin * this.meta.bitcoinCount;
    }
    return Object.values(this.byDate).reduce((value, item) => {
      const ratchetedValue = (item.ratchetedQty * Math.min(item.ratchetedPrice, this.pricePerBtc)) - item.pendingRatchetValue;
      const nonRatchetedValue = item.nonRatchetedQty * Math.min(item.nonRatchetedPrice, this.pricePerBtc);
      return value + ratchetedValue + nonRatchetedValue;
    }, 0);
  }

  public getTotalPendingRatchetValue() {
    return Object.values(this.byDate).reduce((value, item) => {
      return value + item.pendingRatchetValue;
    }, 0);
  }

  public calculateUnlockBurnPerBitcoinDollar1(argonRatioPrice: number): number {
    const r = argonRatioPrice;
    const b = 1;
    if (argonRatioPrice >= 1.00) {
      return b;
    } else if (r >= 0.01) {
      return (b * divide(0.258725, (r - 0.000459)) + (1.367952 * r * r) - (1.628474 * r) +1)
    } else {
      return divide(b, r) * ((0.702 * r) + 0.274);
    }
  }


  public calculateUnlockBurnPerBitcoinDollar(argonRatioPrice: number): number {
    const r = argonRatioPrice;
    const b = 1;
    if (argonRatioPrice >= 1.00) {
      return b;
    } else if (r >= 0.90) {
      return 20 * Math.pow(r, 2) - 38 * r + 19;
    } else if (r >= 0.01) {
      return divide(0.5618 * r + 0.3944, r);
    } else {
      return divide(b, r) * (0.576 * r + 0.40);
    }
  }

  public unvault(bitcoinsToUnvault: number): number {
    if (this.loadType !== 'cached') throw new Error('Invalid load type');

    const bitcoinsUnvaulted = Math.min(bitcoinsToUnvault, this.meta.bitcoinCount);
    this.meta.bitcoinCount -= bitcoinsUnvaulted;

    return bitcoinsUnvaulted;
  }

  public exportMeta(argonRatioPrice: number): IVaultMeta {
    return {
      bitcoinCount: this.bitcoinCount,
      lockPricePerBitcoin: this.bitcoinCount ? divide(this.getTotalLockValue(), this.bitcoinCount) : 0,
      unlockPricePerBitcoin: this.bitcoinCount ? divide(this.getTotalUnlockValue(), this.bitcoinCount) : 0,
      unlockBurnPerBitcoinDollar: this.calculateUnlockBurnPerBitcoinDollar(argonRatioPrice),
    }
  }

  private cleanupOldItems() {
    if (this.loadType !== 'live') throw new Error('Invalid load type');

    for (const item of Object.values(this.byDate)) {
      if (item.date.isBefore(this.currentDate.subtract(1, 'year'))) {
        delete this.byDate[item.date.format('YYYY-MM-DD')];
      }
    }
  }

  private updateRatchets(maxLockedValue: number, rules: IRules) {
    if (this.loadType !== 'live') throw new Error('Invalid load type');

    const ratchetWhenPriceChangeDec = rules.btcRatchetWhenPriceChangePct / 100;
    const currentLockValue = this.getTotalLockValue();    
    const pricePerBtc = this.pricePerBtc;

    let openValue = Math.max(maxLockedValue - currentLockValue, 0);

    for (const item of Object.values(this.byDate)) {
      const changeDec = Math.abs(calculateProfit(item.ratchetedPrice, pricePerBtc));
      if (changeDec >= ratchetWhenPriceChangeDec) {
        const totalValueBefore = (item.ratchetedQty * item.ratchetedPrice);
        item.ratchetedPrice = pricePerBtc;

        const totalValueAfter = (item.ratchetedQty * item.ratchetedPrice);
        const totalValueAdjustment = totalValueAfter - totalValueBefore;
        if (totalValueAdjustment <= openValue) {
          item.pendingRatchetValue += totalValueAdjustment;
          openValue += totalValueAdjustment;
        } else {
          item.pendingRatchetValue += totalValueAdjustment - openValue;
          openValue = 0;
        }
      }
    }

    for (const item of Object.values(this.byDate)) {
      if (openValue <= 0) {
        return;
      } else if (!item.pendingRatchetValue) {
        continue;
      } else if (item.pendingRatchetValue <= openValue) {
        openValue -= item.pendingRatchetValue;
        item.pendingRatchetValue = 0;
      } else {
        item.pendingRatchetValue -= openValue;
        openValue = 0;
      }
    }
  }
}

function calculateProfit(buyPrice: number, sellPrice: number): number {
  return divide((sellPrice - buyPrice), buyPrice);
}

export interface IVaultMeta {
  bitcoinCount: number;
  lockPricePerBitcoin: number;
  unlockPricePerBitcoin: number;
  unlockBurnPerBitcoinDollar: number;
}