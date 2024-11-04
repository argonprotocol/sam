import { expect, test } from 'bun:test';
import BlockchainRunner, { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../lib/BlockchainRunner';
import dayjs from 'dayjs';
import rules from './helpers/rules';
import IRules from '../interfaces/IRules';

const vaultMetaBeforeRecovery = {
  argonBurnCapacity: 645_664_424_0.317682,
  argonRatioPrice: 1,
  argonsBurnedPerBitcoinDollar: 1,
  bitcoinCount: 198_423.6610318361,
  dollarsPerBitcoinLock: 35_788.661922,
  dollarsPerBitcoinUnlock: 32_539.6891013,
  profitsToDate: 700_794_416.2318723,
  bitcoinMintedArgons: 9_350_000_000.000013,
}

test("test start", () => {
  const startingPrice = 1.00;
  const startingDate = dayjs.utc(TERRA_LAUNCH_DATE);
  const endingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  const runner = new BlockchainRunner(rules, { bypassCache: true });
  const dailyMarkers = runner.runStart(startingPrice, startingDate, endingDate);
  const firstMarker = dailyMarkers[0];
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];

  for (const marker of dailyMarkers) {
    expect(marker.currentPrice).toBe(1.00);
  }

  expect(lastMarker.toJson().endingVaultMeta).toEqual(vaultMetaBeforeRecovery);
  expect(firstMarker.startingDate.toISOString()).toBe('2020-10-01T00:00:00.000Z');
  expect(lastMarker.nextDate.toISOString()).toBe('2022-05-09T00:00:00.000Z');
  expect(lastMarker.currentPrice).toBe(1.00);
  expect(Math.round(lastMarker.currentCirculation)).toBe(18_700_000_000);
  expect(Math.round(lastMarker.currentCapital)).toBe(18_700_000_000);
});

test("test collapse", () => {
  const startingPrice = 1.00;
  const startingDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  const runner = new BlockchainRunner(rules, { bypassCache: true });
  const dailyMarkers = runner.runCollapse(startingPrice, startingDate, vaultMetaBeforeRecovery);
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];

  expect(lastMarker.nextDate.toISOString()).toBe('2022-06-30T00:00:00.000Z');
  expect(lastMarker.currentPrice).toBe(0.001);
});

test("test recovery", () => {
  const customRules = { ...rules };
  const startingPrice = 0.001;
  const startingDate = dayjs.utc('2022-06-30');

  const stopDate = startingDate.add(6, 'days');

  const startingCirculation = customRules.circulation;
  const runner = new BlockchainRunner(customRules, { bypassCache: true });
  const dailyMarkers = runner.runRecovery(startingPrice, startingDate, startingCirculation, vaultMetaBeforeRecovery, stopDate);
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];

  expect(lastMarker.startingPrice).toBe(1.00);
  expect(lastMarker.currentPrice).toBe(1.00);
});

test("test recovery without bitcoin", () => {
  const customRules: IRules = { ...rules, enableBitcoinVaulting: false, enableSpeculativeGreed: false };
  const startingPrice = 0.001;
  const startingDate = dayjs.utc('2022-06-30');

  const stopDate = startingDate.add(100, 'years');

  const startingCirculation = customRules.circulation;
  const runner = new BlockchainRunner(customRules, { bypassCache: true });
  const dailyMarkers = runner.runRecovery(startingPrice, startingDate, startingCirculation, vaultMetaBeforeRecovery, stopDate);
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];
  const yearsToRecover = lastMarker.nextDate.diff(startingDate, 'years');

  expect(lastMarker.currentPrice).toBe(1.00);
  expect(yearsToRecover).toBe(84);
});