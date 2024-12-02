import { expect, test } from 'bun:test';
import BlockchainRunner, { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../src/engine/BlockchainRunner';
import dayjs from 'dayjs';
import rules from './helpers/rules';

const vaultMetaBeforeRecovery = {
  argonBurnCapacity: 645_664_424_0.317682,
  argonRatioPrice: 1,
  argonsBurnedPerBitcoinDollar: 1,
  bitcoinCount: 198_423.6610318361,
  dollarsPerBitcoinLock: 35_788.661922,
  dollarsPerBitcoinUnlock: 32_539.6891013,
  profitsToDate: 700_794_416.2318723,
  argonsMintedByBitcoins: 9_350_000_000.000013,
}

test.only("test collapsing recovery", () => {
  const customRules = { ...rules, btcMaxTxnsPerHour: 1000 };
  const startingPrice = 1.00;
  const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  const runner = new BlockchainRunner(customRules);
  const { markers } = runner.runCollapsingRecovery(startingPrice, startingDate, vaultMetaBeforeRecovery);
  const lastMarker = markers[markers.length - 1];

  let daysToRecover = 0;
  let daysStable = 0;
  for (const marker of dailyMarkers) {
    daysStable = marker.currentPrice === 1 ? daysStable + 1 : 0;
    if (daysStable < 5) daysToRecover++;
  }

  expect(daysToRecover).toBe(18);
  expect(lastMarker.endingVaultMeta.bitcoinCount).toBe(91061.35181167797);
  expect(lastMarker.startingPrice).toBe(1.00);
  expect(lastMarker.currentPrice).toBe(1.00);
});

test("test collapsing recovery with high txns", () => {
  const customRules = {
    circulation: 18_700_000_000,
    startDateOfTerraCollapse: '2022/05/09',
  
    dollarInflation: 3.5,
  
    enableTaxation: true,
    transactionsAnnually: 1_000_000_000,
    micropaymentsAnnually: 18_700_000,
  
    enableBitcoinVaulting: true,
    btcVaultCapacityPct: 100,
    btcRatchetingPct: 100,
    btcRatchetWhenPriceChangePct: 10,
    btcPriceOverride: 34_082.21,
    btcMaxTxnsPerHour: 4000,
    unvaultLatencyInHours: 120,
  
    enableCertaintyGreed: false,
    certaintyGreedLow: 2,
    certaintyGreedHigh: 20,
    certaintyLatencyLow: 24,
    certaintyLatencyHigh: 48,
    certaintyMaxDailyIncrease: 0.5,
  
    enableSpeculativeGreed: false,
    speculativeGreedLow: 10,
    speculativeGreedHigh: 20,
    speculativeGreedWithinHours: 24,
    speculativeLatencyLow: 24,
    speculativeLatencyHigh: 48,
    speculativeMaxDailyIncrease: 0.5,
  };
  const startingPrice = 1.00;
  const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  const runner = new BlockchainRunner(customRules, { bypassCache: true });
  const dailyMarkers = runner.runCollapsingRecovery(startingPrice, startingDate, vaultMetaBeforeRecovery);
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];

  expect(lastMarker.startingPrice).toBe(1.00);
  expect(lastMarker.currentPrice).toBe(1.00);
});