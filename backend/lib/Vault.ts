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
  private _meta: Omit<IVaultMeta, 'unlockBurnPerBitcoinDollar' | 'bitcoinMintedArgons'>;
  
  private _bitcoinMintedArgons: number = 0;
  private _ratchetMintingSpace: number = 0;

  private currentDate: Dayjs;
  private pricePerBtcOverride: number;
  private profitsByDate: { [date: string]: number } = {};

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

  public get bitcoinMintedArgons() {
    return this._bitcoinMintedArgons;
  }

  public get ratchetMintingSpace() {
    return this._ratchetMintingSpace;
  }

  public get bitcoinCount() {
    if (this.loadType === 'cached') {
      return this.meta.bitcoinCount;
    }

    return Object.values(this.byDate).reduce((value, item) => {
      return value + item.ratchetedQty + item.nonRatchetedQty;
    }, 0);
  }

  public get dollarsPerBitcoinUnlock(): number {
    if (this.loadType === 'cached') {
      return this.meta.dollarsPerBitcoinUnlock;
    }
    return this.bitcoinCount ? divide(this.getTotalUnlockValue(), this.bitcoinCount) : 0
  }

  public get profitsToDate() {
    if (this.loadType === 'cached') {
      return this.meta.profitsToDate;
    }

    return Object.entries(this.profitsByDate).reduce((value, [date, profit]) => {
      return dayjs(date).isAfter(this.currentDate) ? value : value + profit;
    }, 0)
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
    const maxMintingCapacity = cleanRound(divide(currentCirculation, 2) * (vaultCapacityDec), 2);

    this.currentDate = currentDate;
    this.cleanupOldItems();
    this.updateRatchets(maxMintingCapacity, rules);

    const pricePerBtc = this.pricePerBtc;
    const availableMintingSpace = Math.max(maxMintingCapacity - this.bitcoinMintedArgons, 0);
    if (availableMintingSpace <= 0) return;

    const nonRatchetedQty = divide(availableMintingSpace, pricePerBtc) * (1 - ratchetingDec);
    const ratchetedQty = divide(availableMintingSpace, pricePerBtc) * ratchetingDec;
    const item = this.byDate[currentDate.format('YYYY-MM-DD')] ??= {
      date: currentDate,
      nonRatchetedQty: 0,
      nonRatchetedPrice: pricePerBtc,
      ratchetedQty: 0,
      ratchetedPrice: pricePerBtc,
      pendingRatchetValue: 0,
    };
    item.nonRatchetedQty += nonRatchetedQty;
    item.ratchetedQty += ratchetedQty;
    
    this._bitcoinMintedArgons += (nonRatchetedQty + ratchetedQty) * pricePerBtc;
  }

  public loadFromCache(meta: IVaultMeta) {
    if (this.loadType !== 'cached') throw new Error('Invalid load type');
    
    this._meta = {
      bitcoinCount: meta.bitcoinCount,
      dollarsPerBitcoinLock: meta.dollarsPerBitcoinLock,
      dollarsPerBitcoinUnlock: meta.dollarsPerBitcoinUnlock,
      argonBurnCapacity: meta.argonBurnCapacity,
      profitsToDate: meta.profitsToDate,
      argonRatioPrice: meta.argonRatioPrice,
      argonsBurnedPerBitcoinDollar: meta.argonsBurnedPerBitcoinDollar,
    }

    this._bitcoinMintedArgons = meta.bitcoinMintedArgons;

    return this;
  }

  public getTotalLockValue() {
    if (this.loadType === 'cached') {
      return this.meta.dollarsPerBitcoinLock * this.meta.bitcoinCount;
    }
    return Object.values(this.byDate).reduce((value, item) => {
      const ratchetedValue = (item.ratchetedQty * item.ratchetedPrice) - item.pendingRatchetValue;
      const nonRatchetedValue = item.nonRatchetedQty * item.nonRatchetedPrice;
      return value + ratchetedValue + nonRatchetedValue;
    }, 0);
  }

  public getTotalUnlockValue() {
    if (this.loadType === 'cached') {
      return this.meta.dollarsPerBitcoinUnlock * this.meta.bitcoinCount;
    }
    return Object.values(this.byDate).reduce((value, item) => value + this.getUnlockValue(item), 0);
  }

  private getUnlockValue(item: IVaultItem) {
    const ratchetedValue = (item.ratchetedQty * Math.min(item.ratchetedPrice, this.pricePerBtc)) - item.pendingRatchetValue;
    const nonRatchetedValue = item.nonRatchetedQty * Math.min(item.nonRatchetedPrice, this.pricePerBtc);
    return ratchetedValue + nonRatchetedValue;
  }

  public getTotalPendingRatchetValue() {
    return Object.values(this.byDate).reduce((value, item) => {
      return value + item.pendingRatchetValue;
    }, 0);
  }

  public unvaultBitcoins(numToUnvault: number, argonRatioPrice: number): number {
    if (this.loadType !== 'cached') throw new Error('Invalid load type');

    const bitcoinsUnvaulted = Math.min(numToUnvault, this.meta.bitcoinCount);
    this.meta.bitcoinCount -= bitcoinsUnvaulted;

    const unlockBurnPerBitcoinDollar = Vault.calculateUnlockBurnPerBitcoinDollar(argonRatioPrice);
    const argonsNeededPerBitcoin = unlockBurnPerBitcoinDollar * this.dollarsPerBitcoinUnlock;
    const argonsNeededForUnvault = argonsNeededPerBitcoin * bitcoinsUnvaulted;
    this._bitcoinMintedArgons -= argonsNeededForUnvault;

    const lossAmountAverted = Math.max(this.dollarsPerBitcoinUnlock - this.pricePerBtc, 0);
    this.recordProfit(lossAmountAverted * bitcoinsUnvaulted);

    if (argonRatioPrice) {
      const dollarsPerBitcoinUnlock = argonsNeededPerBitcoin * argonRatioPrice;
      const savingsFromUnlock = this.dollarsPerBitcoinUnlock - dollarsPerBitcoinUnlock;
      this.recordProfit(savingsFromUnlock * bitcoinsUnvaulted);
    }

    return bitcoinsUnvaulted;
  }

  public exportMeta(argonRatioPrice: number): IVaultMeta {
    const bitcoinCount = this.bitcoinCount;
    const argonsBurnedPerBitcoinDollar = Vault.calculateUnlockBurnPerBitcoinDollar(argonRatioPrice);
    const dollarsPerBitcoinUnlock = this.dollarsPerBitcoinUnlock;
    const dollarsPerBitcoinLock = this.bitcoinCount ? divide(this.getTotalLockValue(), this.bitcoinCount) : 0;
    const argonBurnCapacity = bitcoinCount * dollarsPerBitcoinUnlock * argonsBurnedPerBitcoinDollar;
    
    return {
      bitcoinCount,
      dollarsPerBitcoinLock,
      dollarsPerBitcoinUnlock,
      argonsBurnedPerBitcoinDollar,
      argonBurnCapacity,
      profitsToDate: this.profitsToDate,
      argonRatioPrice,
      bitcoinMintedArgons: this.bitcoinMintedArgons,
    }
  }

  private cleanupOldItems() {
    if (this.loadType !== 'live') throw new Error('Invalid load type');

    for (const item of Object.values(this.byDate)) {
      if (item.date.isBefore(this.currentDate.subtract(1, 'year'))) {
        const unlockValue = this.getUnlockValue(item);
        this._bitcoinMintedArgons -= unlockValue;
        delete this.byDate[item.date.format('YYYY-MM-DD')];
      }
    }
  }

  private updateRatchets(maxMintingCapacity: number, rules: IRules) {
    if (this.loadType !== 'live') throw new Error('Invalid load type');

    const ratchetWhenPriceChangeDec = rules.btcRatchetWhenPriceChangePct / 100;
    const pricePerBtc = this.pricePerBtc;

    // We're running the ratcheting code before running the new bitcoin vaulting code. In order to ensure
    // an even distribution, we will throttle the ratcheting space.
    let availableMintingSpace = Math.max(maxMintingCapacity - this.bitcoinMintedArgons, 0) / 2;
    let mintingSpaceToReleaseAfterRatcheting = 0;

    for (const item of Object.values(this.byDate)) {
      const changeDec = Math.abs(calculateProfit(item.ratchetedPrice, pricePerBtc));
      if (changeDec >= ratchetWhenPriceChangeDec) {
        const totalValueBefore = (item.ratchetedQty * item.ratchetedPrice);
        item.ratchetedPrice = pricePerBtc;

        const totalValueAfter = (item.ratchetedQty * item.ratchetedPrice);
        const pendingRatchetValue = totalValueAfter - totalValueBefore;

        if (pendingRatchetValue >= availableMintingSpace) {
          // the user is wanting to mint more than we have space for
          const argonsToMint = availableMintingSpace;
          this.recordProfit(argonsToMint);
          this._bitcoinMintedArgons += argonsToMint;
          this._ratchetMintingSpace += argonsToMint;
          item.pendingRatchetValue += pendingRatchetValue - argonsToMint;
          availableMintingSpace = 0;
        } else if (pendingRatchetValue > 0) {
          // we can mint everything the user wants
          const argonsToMint = pendingRatchetValue;
          this.recordProfit(argonsToMint);
          this._bitcoinMintedArgons += argonsToMint;
          this._ratchetMintingSpace += argonsToMint;
          availableMintingSpace -= pendingRatchetValue;
        } else {
          // the user is down ratcheting, so no new minting. We only need to update the pending ratchet value
          item.pendingRatchetValue = Math.max(item.pendingRatchetValue + pendingRatchetValue, 0);
          
          // Vaulting/ratcheting works differently in real-life than this modeled scenario, and we must
          // do an offset to account for this. In real-life, an equal number of argons are locked in vault
          // security during ratcheting, which takes them out of circulation and also frees up minting space.
          // This this._ratchetMintingSpace does something similar, although it's not exact.
          mintingSpaceToReleaseAfterRatcheting = Math.min(mintingSpaceToReleaseAfterRatcheting + Math.abs(pendingRatchetValue), this._ratchetMintingSpace);
        }
      }
    }

    this._bitcoinMintedArgons -= mintingSpaceToReleaseAfterRatcheting;
    this._ratchetMintingSpace -= mintingSpaceToReleaseAfterRatcheting;
  }

  private recordProfit(profit: number) {
    if (profit <= 0) return;
    if (this.loadType === 'cached') {
      this.meta.profitsToDate += profit;
    } else {
      this.profitsByDate[this.currentDate.format('YYYY-MM-DD')] ??= 0;
      this.profitsByDate[this.currentDate.format('YYYY-MM-DD')] += profit;  
    }
  }

  public static calculateUnlockBurnPerBitcoinDollar(argonRatioPrice: number): number {
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
}

function calculateProfit(buyPrice: number, sellPrice: number): number {
  return divide((sellPrice - buyPrice), buyPrice);
}

export interface IVaultMeta {
  bitcoinCount: number;
  dollarsPerBitcoinLock: number;
  dollarsPerBitcoinUnlock: number;
  argonsBurnedPerBitcoinDollar: number;
  argonBurnCapacity: number;
  profitsToDate: number;
  argonRatioPrice: number;
  bitcoinMintedArgons: number;
}
