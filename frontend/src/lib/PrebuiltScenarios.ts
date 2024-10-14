export interface IScenario {
  circulation: number;
  enableDollarSeries: boolean;
  dollarInflation: number;
  enableTaxation: boolean;
  transactionsAnnually: number;
  micropaymentsAnnually: number;
  enableBitcoinVaulting: boolean;
  btcVaulted: number;
  btcLockDateStart: string;
  btcLockDateEnd: string;
  btcRatcheting: number;
  btcRatchetingAt: number;
  btcPrice: number;
  unvaultBots: number;
  btcMaxTxns: number;
  unvaultGreedLow: number;
  unvaultGreedHigh: number;
  unvaultLatencyLow: number;
  unvaultLatencyHigh: number;
  enableCertaintyGreed: boolean;
  certaintyGreedLow: number;
  certaintyGreedHigh: number;
  certaintyLatencyLow: number;
  certaintyLatencyHigh: number;
  certaintyMaxDailyIncrease: number;
  enableSpeculativeGreed: boolean;
  speculativeGreedLow: number;
  speculativeGreedHigh: number;
  speculativeGreedWithinHours: number;
  speculativeLatencyLow: number;
  speculativeLatencyHigh: number;
  speculativeMaxDailyIncrease: number;
  disableRecoveryDuringFall: boolean;
  enableReservePurchasingPower: boolean;
}

const scenarios: { [key: string]: IScenario } = {
  terra: {
    circulation: 18_700_000_000,

    enableDollarSeries: false,
    dollarInflation: 3.5,
    
    enableTaxation: false,
    transactionsAnnually: 10_000_000_000,
    micropaymentsAnnually: 0,
    
    enableBitcoinVaulting: false,
    btcVaulted: 0,
    btcLockDateStart: '----/--/--',
    btcLockDateEnd: '----/--/--',
    btcRatcheting: 0,
    btcRatchetingAt: 0,
    btcPrice: 0,
    unvaultBots: 0,
    btcMaxTxns: 0,
    unvaultGreedLow: 0,
    unvaultGreedHigh: 0,
    unvaultLatencyLow: 0,
    unvaultLatencyHigh: 0,

    enableCertaintyGreed: true, 
    certaintyGreedLow: 0,
    certaintyGreedHigh: 0,
    certaintyLatencyLow: 0,
    certaintyLatencyHigh: 0,
    certaintyMaxDailyIncrease: 0,

    enableSpeculativeGreed: true,
    speculativeGreedLow: 10,
    speculativeGreedHigh: 20,
    speculativeGreedWithinHours: 24,
    speculativeLatencyLow: 2,
    speculativeLatencyHigh: 24,
    speculativeMaxDailyIncrease: 0.5,

    enableReservePurchasingPower: true,
    disableRecoveryDuringFall: false,
  },
  argon: {
    circulation: 18_700_000_000,
  
    enableDollarSeries: true,
    dollarInflation: 3.5,
  
    enableTaxation: true,
    transactionsAnnually: 1_000_000_000,
    micropaymentsAnnually: 18_700_000,
  
    enableBitcoinVaulting: true,
    btcVaulted: 18_700_000_000 / 2,
    btcLockDateStart: '2021/05/08',
    btcLockDateEnd: '2022/05/08',
    btcRatcheting: 10,
    btcRatchetingAt: 10,
    btcPrice: 62_000,
    unvaultBots: 3,
    btcMaxTxns: 100,
    unvaultGreedLow: 10,
    unvaultGreedHigh: 20,
    unvaultLatencyLow: 2,
    unvaultLatencyHigh: 24,
  
    enableCertaintyGreed: true,
    certaintyGreedLow: 5,
    certaintyGreedHigh: 20,
    certaintyLatencyLow: 2,
    certaintyLatencyHigh: 24,
    certaintyMaxDailyIncrease: 0.5,
  
    enableSpeculativeGreed: true,
    speculativeGreedLow: 10,
    speculativeGreedHigh: 20,
    speculativeGreedWithinHours: 24,
    speculativeLatencyLow: 2,
    speculativeLatencyHigh: 24,
    speculativeMaxDailyIncrease: 0.5,
  
    enableReservePurchasingPower: false,
    disableRecoveryDuringFall: false,
  },
};

scenarios.argonForcedCollapse = {
  ...scenarios.argon,
  disableRecoveryDuringFall: true,
};

export function getScenario(id: IScenarioId): IScenario {
  return scenarios[id];
}

export type IScenarioId = 'terra' | 'argon' | 'argonForcedCollapse';
