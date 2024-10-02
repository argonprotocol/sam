import IRules from "../interfaces/IRules";
import BlockchainRunner, { MILLIS_PER_HOUR } from "../lib/BlockchainRunner";
import DollarInflation from "../lib/DollarInflation";

const TERRA_LAUNCH_DATE = '2020-10-01T00:00:00Z';
const TERRA_POOL_DEPEG_DATE = '2022-05-09T00:00:00Z';

export default class StartController {
  public async start(asset: 'argon' | 'terra', rules: IRules) {    
    const runner = new BlockchainRunner(asset, rules);
    const startingDate = new Date(TERRA_LAUNCH_DATE);
    const endingDate = new Date(TERRA_POOL_DEPEG_DATE);
    const price = 1.00;
    
    runner.runStart(startingDate, endingDate, price);

    return {
      chartMarkers: runner.dailyMarkers.map(m => [m.startingDate, m.currentPrice]),
      stats: runner.stats,
    };
  }

  public async collapse(asset: 'argon' | 'terra', rules: IRules, lastDate: string, lastPrice: number) {
    const runner = new BlockchainRunner(asset, rules);
    const startingDate = new Date(new Date(lastDate).getTime() + 24 * 60 * 60 * 1000);

    startingDate.setUTCHours(0, 0, 0, 0);    
    runner.runCollapse(startingDate, lastPrice);
 
    return {
      chartMarkers: runner.dailyMarkers.map(m => [m.startingDate, m.currentPrice]),
      stats: runner.stats,
    };
  }

  public async recovery(asset: 'argon' | 'terra', rules: IRules, lastDate: string, lastPrice: number) {
    const runner = new BlockchainRunner(asset, rules);
    const startingDate = new Date(new Date(lastDate).getTime() + 24 * 60 * 60 * 1000);
    
    startingDate.setUTCHours(0, 0, 0, 0);    
    runner.runRecovery(startingDate, lastPrice);
    
    return {
      chartMarkers: runner.dailyMarkers.map(m => [m.startingDate, m.currentPrice]),
      stats: runner.stats,
    };
  }

  public async dollar(endingDate: Date, rules: IRules) {
    const startingDate = new Date(TERRA_LAUNCH_DATE);
    const dollarMarkers: any[] = [];
    const dollarInflation = new DollarInflation(rules);

    let currentDate = new Date(startingDate);
    let currentPrice = 1.0;
    
    while (currentDate <= endingDate) {
      const year = currentDate.getFullYear().toString();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      
      const monthlyInflation = dollarInflation.get(year, month);

      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const dailyInflation = monthlyInflation / daysInMonth;

      for (let day = 1; day <= daysInMonth; day++) {
        const dailyDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (dailyDate > endingDate) break;

        currentPrice = currentPrice - (currentPrice * (dailyInflation / 100));
        
        dollarMarkers.push({
          date: dailyDate.toISOString().split('T')[0],
          inflation: dailyInflation,
          price: currentPrice,
        });

        console.log(dailyDate.toISOString().split('T')[0], currentPrice);
      }

      // Move to the next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      dollarMarkers,
    };
  }
}
