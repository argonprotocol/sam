import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import IRules from "../interfaces/IRules";
import BlockchainRunner, { TERRA_LAUNCH_DATE, TERRA_COLLAPSE_DATE, DEFAULT_ENDING_DATE } from "../lib/BlockchainRunner";
import DollarInflation from "../lib/DollarInflation";
import { IVaultMeta } from '../lib/Vault';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

export default class StartController {  
  public async start(rules: IRules) {    
    const startingPrice = 1.00;
    const startOnDate = dayjs.utc(TERRA_LAUNCH_DATE);
    const endBeforeDate = dayjs.utc(rules.startDateOfTerraCollapse);
    const runner = new BlockchainRunner(rules);
    
    console.log('RUNNING START');
    runner.runStart(startingPrice, startOnDate, endBeforeDate);

    return runner.dailyMarkers.map(m => m.toJson())
  }

  public async collapseThenRecover(rules: IRules, startingVaultMeta: IVaultMeta) {
    const startingPrice = 1.00;
    const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE)

    const runner1 = new BlockchainRunner(rules);
    runner1.runCollapse(startingPrice, startingDate, startingVaultMeta);
 
    const lastMarker = runner1.dailyMarkers[runner1.dailyMarkers.length - 1];        
    const { currentPrice, nextDate: currentDate, currentCirculation, endingVaultMeta: lastVaultMeta } = lastMarker;

    const runner2 = new BlockchainRunner(rules);
    console.log('currentCirculation', currentCirculation);
    runner2.runRecovery(currentPrice, currentDate, currentCirculation, lastVaultMeta);
    
    return {
      collapse: runner1.dailyMarkers.map(m => m.toJson()),
      recover: runner2.dailyMarkers.map(m => m.toJson()),
    };
  }

  public async collapsedForever(rules: IRules, startingVaultMeta: IVaultMeta) {
    const startingPrice = 1.00;
    const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

    const runner1 = new BlockchainRunner(rules);
    runner1.runCollapse(startingPrice, startingDate, startingVaultMeta);
 
    const lastMarker = runner1.dailyMarkers[runner1.dailyMarkers.length - 1];
    const runner2 = new BlockchainRunner(rules);
    runner2.runCollapsedForever(lastMarker.nextDate, lastMarker.currentCirculation, lastMarker.currentCapital, lastMarker.endingVaultMeta);

    return [
      ...runner1.dailyMarkers.map(m => m.toJson()),
      ...runner2.dailyMarkers.map(m => m.toJson())
    ];
  }

  public async collapsingRecovery(rules: IRules, startingVaultMeta: IVaultMeta) {
    const startingPrice = 1.00;
    const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

    const runner = new BlockchainRunner(rules);
    runner.runCollapsingRecovery(startingPrice, startingDate, startingVaultMeta);
 
    return runner.dailyMarkers.map(m => m.toJson());
  }

  public async dollar(endingDateStr: string, rules: IRules) {
    const endingDate = dayjs.utc(endingDateStr || DEFAULT_ENDING_DATE);
    const dollarMarkers: any[] = [];
    const dollarInflation = new DollarInflation(rules);

    let currentPrice = 1.00;
    let currentDate = dayjs.utc(TERRA_LAUNCH_DATE);
    
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
