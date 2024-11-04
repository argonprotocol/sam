import { expect, test, mock } from 'bun:test';
import { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../lib/BlockchainRunner';
import dayjs from 'dayjs';
import Vault from '../lib/Vault';
import { addCommas, cleanRound, divide } from '../lib/Utils';
import rules from './helpers/rules';
import BtcPrices from '../lib/BtcPrices';
import IRules from '../interfaces/IRules';

test("basic vault pricing", () => {
  const vault = new Vault('live', dayjs.utc(TERRA_COLLAPSE_DATE));
  expect(vault.pricePerBtc).toBe(30_175.71);
});

test("basic vault", () => {
  const vault = new Vault('live');
  const vaultStartDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  vault.setPricePerBtcOverride(10_000);
  vault.loadForDate(100_000, vaultStartDate, rules);

  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(5);
  expect(vault.getTotalLockValue()).toBe(50_000);
  expect(vault.getTotalUnlockValue()).toBe(50_000);
});

test("expired bitcoins to unlock and be replaced", () => {
  const vault = new Vault('live');
  const vaultStartEnd = dayjs.utc(TERRA_COLLAPSE_DATE);

  vault.setPricePerBtcOverride(10_000);
  vault.loadForDate(100_000, vaultStartEnd.subtract(380, 'days'), rules);
  vault.loadForDate(300_000, vaultStartEnd.subtract(379, 'days'), rules);

  expect(Object.values(vault.byDate).length).toBe(2);
  expect(Object.values(vault.byDate)[0].ratchetedQty).toBe(5);
  expect(Object.values(vault.byDate)[1].ratchetedQty).toBe(10);
  expect(vault.getTotalLockValue()).toBe(150_000);

  vault.loadForDate(100_000, vaultStartEnd, rules);

  expect(Object.values(vault.byDate).length).toBe(1);
  expect(Object.values(vault.byDate)[0].ratchetedPrice * Object.values(vault.byDate)[0].ratchetedQty).toBe(50_000);
});

test("ratcheting down with no extra bitcoins", () => {
  const vault = new Vault('live');
  const firstVaultDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  vault.setPricePerBtcOverride(10_000);
  vault.loadForDate(200_000, firstVaultDate, rules);
  
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(10);
  expect(vault.getTotalLockValue()).toBe(100_000);

  vault.setPricePerBtcOverride(5_000);
  vault.loadForDate(100_000, firstVaultDate.add(1, 'day'), rules);
  
  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(10);
  expect(vault.getTotalLockValue()).toBe(50_000);
  expect(Object.values(vault.byDate)[0].pendingRatchetValue).toBe(0);
  expect(vault.profitsToDate).toBe(0);
});

test("ratcheting down with room for extra bitcoins", () => {
  const vault = new Vault('live');
  const vaultStartDate = dayjs.utc(TERRA_COLLAPSE_DATE);

  vault.setPricePerBtcOverride(10_000);
  vault.loadForDate(200_000, vaultStartDate, rules);

  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(10);
  expect(vault.getTotalLockValue()).toBe(100_000);

  vault.setPricePerBtcOverride(20_000);
  vault.loadForDate(400_000, vaultStartDate.add(1, 'day'), rules);
  
  expect(Object.values(vault.byDate).length).toBe(2);
  expect(vault.bitcoinCount).toBe(12.5);
  expect(vault.getTotalLockValue()).toBe(200_000);

  vault.setPricePerBtcOverride(5_000);
  vault.loadForDate(400_000, vaultStartDate.add(2, 'day'), rules);

  expect(Object.values(vault.byDate).length).toBe(3);
  expect(vault.bitcoinCount).toBe(22.5);
  expect(vault.getTotalLockValue()).toBe(112_500);
  expect(Object.values(vault.byDate)[0].pendingRatchetValue).toBe(0);
  expect(vault.profitsToDate).toBe(50_000);
});

test("ratcheting up", () => {
  const vault = new Vault('live');
  const firstVaultDate = dayjs.utc('2022-03-11');

  vault.setPricePerBtcOverride(10_000);
  vault.loadForDate(100_000, firstVaultDate, rules);

  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(5);
  expect(vault.getTotalLockValue()).toBe(50_000);
  expect(vault.bitcoinMintedArgons).toBe(50_000);

  vault.setPricePerBtcOverride(20_000);
  vault.loadForDate(100_000, firstVaultDate.add(1, 'day'), rules);

  expect(Object.values(vault.byDate).length).toBe(1);
  expect(vault.bitcoinCount).toBe(5);
  expect(vault.getTotalLockValue()).toBe(50_000);
  expect(vault.bitcoinMintedArgons).toBe(50_000);
  expect(Object.values(vault.byDate)[0].pendingRatchetValue).toBe(50_000);
  expect(vault.profitsToDate).toBe(0);

  vault.loadForDate(400_000, firstVaultDate.add(2, 'day'), rules);

  expect(Object.values(vault.byDate).length).toBe(2);
  expect(vault.bitcoinCount).toBe(12.5);
  expect(vault.getTotalLockValue()).toBe(200_000);
  expect(vault.bitcoinMintedArgons).toBe(200_000);

  expect(Object.values(vault.byDate)[0].pendingRatchetValue).toBe(50_000);
  expect(vault.profitsToDate).toBe(0);
});

test("from terra launch to collapse", () => {
  const customRules: IRules = { ...rules, btcRatchetingPct: 20 };

  const startOnDate = dayjs.utc(TERRA_LAUNCH_DATE);
  const endBeforeDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const lengthInDays = endBeforeDate.diff(startOnDate, 'days');
  
  const vault = new Vault('live');
  const circulationToAddPerDay = divide(rules.circulation, lengthInDays);
  
  let currentDate = startOnDate;
  let currentCirculation = 0;

  while (currentDate.isBefore(endBeforeDate)) {
    currentCirculation += circulationToAddPerDay;
    vault.loadForDate(currentCirculation, currentDate, customRules);
    currentDate = currentDate.add(1, 'day');
  }

  // console.log('--------------------------------');
  // console.log('totalUnlockValue', addCommas(vault.getTotalUnlockValue()));
  // console.log('totalLockValue', addCommas(vault.getTotalLockValue()));
  // console.log('profitsToDate', addCommas(vault.profitsToDate));
  // console.log('bitcoinCount', addCommas(vault.bitcoinCount));
  // console.log('bitcoinMintedArgons', addCommas(vault.bitcoinMintedArgons));

  expect(Object.values(vault.byDate).length).toBe(366);
  expect(Math.round(vault.bitcoinCount)).toBe(205_790);
  expect(Math.round(vault.getTotalLockValue())).toBe(8_785_806_267);
  expect(Math.round(vault.getTotalUnlockValue())).toBe(6_945_574_436);
  expect(Math.round(vault.profitsToDate)).toBe(530_277_777);
  expect(Math.round(vault.bitcoinMintedArgons)).toBe(9_350_000_000);
});

test("vault from meta to unvault", () => {
  const vaultStartDate = dayjs.utc(TERRA_COLLAPSE_DATE);
  const vault = new Vault('cached', vaultStartDate);
  
  vault.loadFromCache({
    bitcoinCount: 10,
    dollarsPerBitcoinLock: 20_000,
    dollarsPerBitcoinUnlock: 20_000,
    argonsBurnedPerBitcoinDollar: 1,
    argonBurnCapacity: 200_000,
    profitsToDate: 100_000,
    argonRatioPrice: 1.00,
    bitcoinMintedArgons: 200_000,
  });

  expect(vault.bitcoinCount).toBe(10);
  expect(vault.getTotalLockValue()).toBe(200_000);
  expect(vault.profitsToDate).toBe(100_000);

  const bitcoinsUnvaulted1 = vault.unvaultBitcoins(2, 1.00);
  expect(bitcoinsUnvaulted1).toBe(2);
  expect(vault.profitsToDate).toBe(100_000);

  const bitcoinsUnvaulted2 = vault.unvaultBitcoins(2, 0.5);
  expect(bitcoinsUnvaulted2).toBe(2);
  expect(vault.profitsToDate).toBe(112_988);

  const bitcoinsUnvaulted3 = vault.unvaultBitcoins(6, 0.001);
  expect(bitcoinsUnvaulted3).toBe(6);
  expect(vault.profitsToDate).toBe(184_918.88);
});