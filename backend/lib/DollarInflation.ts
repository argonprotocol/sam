import path from 'path';
import loadCsvFile from './loadCsvFile';
import IRules from '../interfaces/IRules';

const cpiMap: any = {}
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

loadCsvFile(path.join(__dirname, '../data-input/CPI.csv')).forEach(obj => {
  const year = obj.Year;
  cpiMap[year] = {};
  for (const month of months) {
    cpiMap[year][month] = Number(obj[month]);
  }
});

export default class DollarInflation {
  private rules: IRules;
  constructor(rules: any) {
    this.rules = rules;
  }

  get(year: string, month: string): number {
    const monthIndex = months.indexOf(month);
    const previousMonthIndex = (monthIndex - 1 + 12) % 12;
    const previousMonth = months[previousMonthIndex];

    if (!cpiMap[year] || !cpiMap[year][month]) {
      return this.rules.inflation / 12;
    }

    const currentCpi = cpiMap[year][month];
    const yearOfPreviousMonth = previousMonth === 'December' ? (parseInt(year) - 1).toString() : year;
    const previousCpi = cpiMap[yearOfPreviousMonth][previousMonth];

    return ((currentCpi - previousCpi) / previousCpi) * 100;
  }
}
