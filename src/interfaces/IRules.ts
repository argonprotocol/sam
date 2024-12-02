export default interface IRules {
  circulation: number;
  startDateOfTerraCollapse: string;

  dollarInflation: number;

  enableTaxation: boolean;
  transactionsAnnually: number;
  micropaymentsAnnually: number;

  enableBitcoinVaulting: boolean;
  btcVaultCapacityPct: number;
  btcRatchetingPct: number;
  btcRatchetWhenPriceChangePct: number;
  btcPriceOverride: number;
  btcMaxTxnsPerHour: number;
  unvaultLatencyInHours: number;

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
}