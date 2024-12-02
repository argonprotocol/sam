import dayjs from 'dayjs';
import IBitcoinFeeRecord from '../interfaces/IBitcoinFeeRecord';
import BtcPrices from './BtcPrices';
import bitcoinFeesPerTransaction from '../data/bitcoinFeesPerTransaction.json';

export default class BtcFees {
  public feeByDate: Record<string, number> = {};
  public btcPrices: BtcPrices = new BtcPrices();

  constructor() {
    this.feeByDate = Object.fromEntries(bitcoinFeesPerTransaction.map((record: IBitcoinFeeRecord) => [record.date, Number(record.feeInBitcoins)]));
  }

  public getInBitcoins(date: string): number {
    return this.feeByDate[date];
  }

  public getByDate(date: string): number {
    const feeInBitcoins = this.getInBitcoins(date);
    if (!feeInBitcoins) {
      const lastDate = dayjs.utc(date).subtract(1, 'day');
      if (lastDate.isBefore('2010-07-18')) {
        throw new Error('Date is before 2010-07-18');
      }
      return this.getByDate(lastDate.format('YYYY-MM-DD'));
    }
    const dollarToBitcoin = this.btcPrices.getByDate(date).price;
    const fee = feeInBitcoins * dollarToBitcoin;
    return fee;
  }
}