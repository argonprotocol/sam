import path from 'path';
import dayjs from 'dayjs';
import loadCsvFile from './loadCsvFile';
import FeeRecord from '../interfaces/FeeRecord';
import BtcPrices from './BtcPrices';

const historicalFees = loadCsvFile(path.join(__dirname, '../data-input/bitcoin_transaction_fees_per_tx.csv'));
const feeByDate = Object.fromEntries(historicalFees.map((record: FeeRecord) => [record.date, Number(record.feeInBitcoins)]));

export default class BtcFees {
  static getInBitcoins(date: string): number {
    return feeByDate[date];
  }

  static get(date: string): number {
    const feeInBitcoins = this.getInBitcoins(date);
    if (!feeInBitcoins) {
      const lastDate = dayjs.utc(date).subtract(1, 'day').format('YYYY-MM-DD')
      return this.get(lastDate);
    }
    const dollarToBitcoin = BtcPrices.get(date).price;
    const fee = feeInBitcoins * dollarToBitcoin;
    return fee;
  }
}