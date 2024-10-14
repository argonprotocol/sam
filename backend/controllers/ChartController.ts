import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import IRules from "../interfaces/IRules";
import BlockchainRunner, { MILLIS_PER_HOUR } from "../lib/BlockchainRunner";
import DollarInflation from "../lib/DollarInflation";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
const TERRA_LAUNCH_DATE = '2020-10-01T00:00:00Z';
const TERRA_POOL_DEPEG_DATE = '2022-05-09T00:00:00Z';

export default class StartController {
  
  public async start(rules: IRules) {    
    const runner = new BlockchainRunner(rules);
    const startingDate = dayjs.utc(TERRA_LAUNCH_DATE);
    const endingDate = dayjs.utc(TERRA_POOL_DEPEG_DATE);
    const price = 1.00;
    
    runner.runStart(startingDate, endingDate, price);

    return runner.dailyMarkers.map(m => m.toJson())
  }

  public async collapse(rules: IRules, lastDateStr: string, lastPrice: number) {
    const runner = new BlockchainRunner(rules);
    const startingDate = dayjs.utc(lastDateStr).add(1, 'day').startOf('day');

    if (rules.enableReservePurchasingPower) {
      runner.runTerraCollapse(startingDate, lastPrice);
    } else {
      runner.runTerralikeCollapse(startingDate, lastPrice);
    }
 
    return runner.dailyMarkers.map(m => m.toJson());
  }

  public async recovery(rules: IRules, lastDateStr: string, lastPrice: number) {
    const runner = new BlockchainRunner(rules);
    const startingDate = dayjs.utc(lastDateStr).add(1, 'day').startOf('day');
    
    runner.runRecovery(startingDate, lastPrice);
    
    return runner.dailyMarkers.map(m => m.toJson());
  }

  public async dollar(endingDateString: string, rules: IRules) {
    const endingDate = dayjs.utc(endingDateString);
    const dollarMarkers: any[] = [];
    const dollarInflation = new DollarInflation(rules);

    let currentDate = dayjs.utc(TERRA_LAUNCH_DATE);
    let currentPrice = 1.0;
    
    while (currentDate.isSameOrBefore(endingDate)) {
      const year = currentDate.year().toString();
      const month = currentDate.format('MMMM');
      const monthlyInflation = dollarInflation.get(year, month);

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
