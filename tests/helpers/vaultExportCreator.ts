import dayjs, { Dayjs } from 'dayjs';
import Vault, { IVaultToJson } from '../../src/engine/Vault';

interface ICreateOptions {
  bitcoinCount: number,
  dollarsPerBitcoinLock: number,
  dollarsPerBitcoinUnlock: number,
  argonsBurnedPerBitcoinDollar: number,
  argonBurnCapacity: number,
  profitsToDate: number,
  argonRatioPrice: number,
  argonsMintedByBitcoins: number,
}

export default function vaultExportCreator(currentDate: string | Dayjs, options: ICreateOptions): IVaultToJson {
  currentDate = (dayjs.isDayjs(currentDate) ? currentDate : dayjs(currentDate).format('YYYY-MM-DD')) as string;
  const vaultExport: IVaultToJson = {
    argonsMintedByBitcoins: options.argonsMintedByBitcoins || 0,
    byDate: {
      [currentDate]: {
        date: currentDate,
        nonRatchetedQty: 0,
        nonRatchetedPrice: options.dollarsPerBitcoinLock,
        ratchetedQty: options.bitcoinCount,
        ratchetedPrice: options.dollarsPerBitcoinUnlock,
        pendingRatchetValue: 0,
      },
    },
    currentDate,
    ratchetMintingSpace: 0,
    pricePerBtcOverride: 0,
    profitsByDate: {},
  }
  return vaultExport;
}

