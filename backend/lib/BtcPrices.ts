import path from 'path';
import loadCsvFile from './loadCsvFile';
import BitcoinPriceRecord from '../interfaces/BitcoinPriceRecord';
import { formatDateAsYYYYMMDD } from './utils';

const allBitcoinPrices = loadCsvFile(path.join(__dirname, '../data-input/bitcoin_prices.csv')).map((x: any) => {
  x.price = Number(x.price);
  return x as BitcoinPriceRecord;
});

export default class BtcPrices {
  static getYear(yearToRun: string): BitcoinPriceRecord[] {
    return [...allBitcoinPrices.filter((row: BitcoinPriceRecord) => row.date.startsWith(yearToRun))];
  }
  static get(date: string | Date): BitcoinPriceRecord {
    if (date instanceof Date) {
      date = formatDateAsYYYYMMDD(date);
    }
    return allBitcoinPrices.find((row: BitcoinPriceRecord) => row.date === date);
  }
}
