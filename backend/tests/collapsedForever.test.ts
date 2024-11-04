import { expect, test } from 'bun:test';
import BlockchainRunner, { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../lib/BlockchainRunner';
import dayjs from 'dayjs';
import rules from './helpers/rules';
import Marker from '../lib/Marker';
import { IVaultMeta } from '../lib/Vault';

const vaultMetaBeforeRecovery: IVaultMeta = {
  bitcoinCount: 200_000,
  dollarsPerBitcoinLock: 30_000,
  dollarsPerBitcoinUnlock: 30_000,
  argonsBurnedPerBitcoinDollar: 1,
  argonBurnCapacity: 6_000_000_000,
  profitsToDate: 0,
  argonRatioPrice: 1.00,
}

test("test collapse forever", () => {
  const startingPrice = 0.001;
  const startingDate = dayjs.utc('2022-06-30');

  const startingCirculation = rules.circulation;
  const startingCapital = Marker.calculateCapitalFromCirculationAndPrice(startingCirculation, startingPrice);

  const runner = new BlockchainRunner(rules, { bypassCache: true });
  const dailyMarkers = runner.runCollapsedForever(startingDate, startingCirculation, startingCapital, vaultMetaBeforeRecovery);
  const lastMarker = dailyMarkers[dailyMarkers.length - 1];

  expect(lastMarker.startingPrice).toBe(0.001);
  expect(lastMarker.currentPrice).toBe(0.001);
});

