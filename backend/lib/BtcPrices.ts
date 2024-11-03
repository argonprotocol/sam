import path from 'path';
import dayjs, { type Dayjs } from "dayjs";
import loadCsvFile from './loadCsvFile';
import BitcoinPriceRecord from '../interfaces/BitcoinPriceRecord';

const allBitcoinPrices = loadCsvFile(path.join(__dirname, '../data-input/bitcoin_prices.csv')).map((x: any) => {
  x.price = Number(x.price);
  return x as BitcoinPriceRecord;
});

export default class BtcPrices {
  static getYear(yearToRun: string): BitcoinPriceRecord[] {
    return [...allBitcoinPrices.filter((row: BitcoinPriceRecord) => row.date.startsWith(yearToRun))];
  }
  static get(date: string | Dayjs): BitcoinPriceRecord {
    if (date instanceof dayjs) {
      date = date.format('YYYY-MM-DD');
    }
    return allBitcoinPrices.find((row: BitcoinPriceRecord) => row.date === date);
  }
}
