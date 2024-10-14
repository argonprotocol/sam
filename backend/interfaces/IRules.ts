export default interface IRules {
  circulation: number;

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
  enableReservePurchasingPower: number;
}