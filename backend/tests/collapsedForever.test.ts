import { expect, test } from 'bun:test';
import BlockchainRunner, { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../lib/BlockchainRunner';
import dayjs from 'dayjs';
import rules from './helpers/rules';
import Marker from '../lib/Marker';

const vaultMetaBeforeRecovery = {
  bitcoinCount: 254314.93824018317,
  lockPricePerBitcoin: 36702.5907271112,
  unlockPricePerBitcoin: 33123.6107271112,
  unlockBurnPerBitcoinDollar: 1,
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

