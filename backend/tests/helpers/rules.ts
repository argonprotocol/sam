import IRules from "../../interfaces/IRules";

const rules: IRules = {
  circulation: 18_700_000_000,
  startDateOfTerraCollapse: "2022/05/09",

  dollarInflation: 3.5,

  enableTaxation: true,
  transactionsAnnually: 1_000_000_000,
  micropaymentsAnnually: 150_000_000,

  enableBitcoinVaulting: true,
  btcVaultCapacityPct: 100,
  btcRatchetingPct: 100,
  btcRatchetWhenPriceChangePct: 10,
  btcPriceOverride: 34_082.21,
  btcMaxTxnsPerHour: 1000,
  unvaultLatencyInHours: 240,
  
  enableCertaintyGreed: true,
  certaintyGreedLow: 2,
  certaintyGreedHigh: 20,
  certaintyLatencyLow: 24,
  certaintyLatencyHigh: 48,
  certaintyMaxDailyIncrease: 0.5,
  
  enableSpeculativeGreed: true,
  speculativeGreedLow: 10,
  speculativeGreedHigh: 20,
  speculativeGreedWithinHours: 24,
  speculativeLatencyLow: 24,
  speculativeLatencyHigh: 48,
  speculativeMaxDailyIncrease: 0.5,
};

export default rules;