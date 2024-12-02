import IRules from '../interfaces/IRules';
import cpiRaw from '../data/cpi.json';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

const cpiMap: any = {}
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

for (const [year, obj] of Object.entries(cpiRaw)) {
  cpiMap[year] = {};
  for (const month of months) {
    cpiMap[year][month] = Number((obj as any)[month]);
  }
}

export default class DollarInflation {
  private rules: IRules;
  
  constructor(rules: any) {
    this.rules = rules;
  }

  getByDate(year: string, month: string): number {
    const monthIndex = months.indexOf(month);
    const previousMonthIndex = (monthIndex - 1 + 12) % 12;
    const previousMonth = months[previousMonthIndex];

    if (!cpiMap[year] || !cpiMap[year][month]) {
      return this.rules.dollarInflation / 12;
    }

    const currentCpi = cpiMap[year][month];
    const yearOfPreviousMonth = previousMonth === 'December' ? (parseInt(year) - 1).toString() : year;
    const previousCpi = cpiMap[yearOfPreviousMonth][previousMonth];

    return ((currentCpi - previousCpi) / previousCpi) * 100;
  }

  generateMarkersForRange(startingDateStr: string, endingDateStr: string): any[] {
    const endingDate = dayjs.utc(endingDateStr);
    const dollarMarkers: any[] = [];

    let currentPrice = 1.00;
    let currentDate = dayjs.utc(startingDateStr);
    
    while (currentDate.isSameOrBefore(endingDate)) {
      const year = currentDate.year().toString();
      const month = currentDate.format('MMMM');
      const monthlyInflation = this.getByDate(year, month);

      const daysInMonth = currentDate.daysInMonth();
      const dailyInflation = monthlyInflation / daysInMonth;

      for (let day = 1; day <= daysInMonth; day++) {
        const dailyDate = currentDate.date(day);
        if (dailyDate.isAfter(endingDate)) break;

        currentPrice = currentPrice - (currentPrice * (dailyInflation / 100));
        
        dollarMarkers.push({
          startingDate: dailyDate.toISOString().split('T')[0],
          endingPrice: currentPrice,
          dailyInflation: dailyInflation,
        });
      }

      // Move to the next month
      currentDate = currentDate.add(1, 'month');
    }

    return dollarMarkers;
  }
}
