import { expect, test } from 'bun:test';
import { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../lib/BlockchainRunner';
import dayjs from 'dayjs';
import Vault from '../lib/Vault';
import { cleanRound, divide } from '../lib/Utils';
import rules from './helpers/rules';

test("basic vault", () => {
  const vault = new Vault('live');

  const terraCollapseDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const twoDaysBeforeCollapse = terraCollapseDate.subtract(2, 'day')
  vault.loadForDate(rules.circulation, twoDaysBeforeCollapse, rules);
  
  const maxLockedValue = Math.round(divide(rules.circulation, 2));
  const expectedBitcoinCount = Math.round(divide(maxLockedValue, vault.pricePerBtc));

  expect(Math.round(vault.getTotalLockValue())).toBe(maxLockedValue);
  expect(Math.round(vault.bitcoinCount)).toBe(expectedBitcoinCount);
  expect(Math.round(Object.values(vault.byDate).length)).toBe(1);
});

test("expired bitcoins to unlock and be replaced", () => {
  const vault = new Vault('live');

  const terraCollapseDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const twoYearsBeforeCollapse = terraCollapseDate.subtract(2, 'years')
  vault.loadForDate(divide(rules.circulation, 2), twoYearsBeforeCollapse, rules);
  vault.loadForDate(rules.circulation, twoYearsBeforeCollapse.add(1, 'day'), rules);
  expect(Object.values(vault.byDate).length).toBe(2);
  expect(Object.values(vault.byDate)[0].ratchetedQty === Object.values(vault.byDate)[1].ratchetedQty).toBe(false);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));

  const twoDaysBeforeCollapse = terraCollapseDate.subtract(2, 'day')
  vault.loadForDate(rules.circulation, twoDaysBeforeCollapse, rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(Object.values(vault.byDate)[0].ratchetedPrice * Object.values(vault.byDate)[0].ratchetedQty)).toBe(Math.round(divide(rules.circulation, 2)));
});

test("ratcheting down", () => {
  const vault = new Vault('live');
  const terraCollapseDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  const firstVaultDate = terraCollapseDate.subtract(20, 'days');
  vault.loadForDate(rules.circulation, firstVaultDate, rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(vault.bitcoinCount)).toBe(225_262);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));

  const secondVaultDate = terraCollapseDate;
  vault.loadForDate(rules.circulation, secondVaultDate, rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(vault.bitcoinCount)).toBe(225_262);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));
});

test("ratcheting up", () => {
  const vault = new Vault('live');

  const firstVaultDate = dayjs.utc('2022-03-11');
  vault.loadForDate(rules.circulation, firstVaultDate, rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(vault.bitcoinCount)).toBe(241_346);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));

  const pricePerBtc = vault.pricePerBtc;

  const secondVaultDate = dayjs.utc('2022-03-27');
  vault.loadForDate(rules.circulation, secondVaultDate, rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(vault.bitcoinCount)).toBe(241_346);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));
  expect(Object.values(vault.byDate)[0].pendingRatchetValue).toBe(1959124780.8547153);

  vault.setPricePerBtcOverride(pricePerBtc);
  vault.loadForDate(rules.circulation, secondVaultDate.add(1, 'day'), rules);
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Math.round(vault.bitcoinCount)).toBe(241_346);
  expect(Math.round(vault.getTotalLockValue())).toBe(Math.round(divide(rules.circulation, 2)));
});

test("from terra launch to collapse", () => {
  const startOnDate = dayjs.utc(TERRA_LAUNCH_DATE);
  const endBeforeDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const lengthInDays = endBeforeDate.diff(startOnDate, 'days');
  const lengthInHours = lengthInDays * 24;
  
  const vault = new Vault('live');
  const circulationToAddPerHour = divide(rules.circulation, lengthInHours);
  const circulationToAddPerDay = divide(rules.circulation, lengthInDays);
  
  let currentDate = startOnDate;
  let currentCirculation = 0;

  while (currentDate.isBefore(endBeforeDate)) {
    currentCirculation += circulationToAddPerHour;
    vault.loadForDate(currentCirculation, currentDate, rules);
    currentDate = currentDate.add(1, 'hour');
  }

  expect(Object.values(vault.byDate).length).toBe(31);
  expect(Math.round(vault.bitcoinCount)).toBe(255_688);
  expect(Math.round(vault.getTotalLockValue())).toBe(9_350_000_000);
});

test("vault from meta", () => {
  const terraCollapseDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const vault = new Vault('cached', terraCollapseDate);
  vault.loadFromCache({
    bitcoinCount: 218_089.61840633707,
    lockPricePerBitcoin: 43_789.716223343,
    unlockPricePerBitcoin: 34_082.210000052,
    unlockBurnPerBitcoinDollar: 0.9983218090000001,
  });

  expect(Math.round(vault.bitcoinCount)).toBe(218_090);
  expect(Math.round(vault.getTotalLockValue())).toBe(9_550_082_501);

  let bitcoinsUnvaulted = vault.unvault(200_000);
  expect(bitcoinsUnvaulted).toBe(200_000);

  bitcoinsUnvaulted = vault.unvault(9_000_000_000);
  expect(cleanRound(bitcoinsUnvaulted, 5)).toBe(18_089.61841);
});