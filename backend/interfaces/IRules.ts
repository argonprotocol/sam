export default interface IRules {
  circulation: number;
  inflation: number;
  taxableEvents: number;
  micropayments: number;
  poolDepegPct: number;
  poolDepegDate: string;
  sellerFearLow: number;
  sellerFearHigh: number;
  sellerFearWithinHours: number;
  sellerLatencyLow: number;
  sellerLatencyHigh: number;
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
  certaintyGreedEnabled: boolean;
  certaintyGreedLow: number;
  certaintyGreedHigh: number;
  certaintyLatencyLow: number;
  certaintyLatencyHigh: number;
  speculationGreedLow: number;
  speculativeGreedHigh: number;
  speculativeGreedWithinHours: number;
  speculativeLatencyLow: number;
  speculativeLatencyHigh: number;
  enableRecoveryDuringFall: boolean;
}