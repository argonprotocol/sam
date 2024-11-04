import { expect, test } from 'bun:test';
import dayjs from 'dayjs';
import rules from './helpers/rules';
import Marker from '../lib/Marker';
import Vault, { IVaultMeta } from '../lib/Vault';
import { TERRA_RESERVE_FUND } from '../lib/BlockchainRunner';
import Reserve from '../lib/Reserve';

test("test single day recovery", () => {
  const currentDate = dayjs.utc('2022-07-04');
  const durationInHours = 24;
  const currentCirculation = 55_775_508.70968893;
  const currentCapital = 18_700_000;
  const vaultMeta: IVaultMeta = {
    bitcoinCount: 244714.93824018317,
    dollarsPerBitcoinLock: 36702.5907271,
    dollarsPerBitcoinUnlock: 33123.6107271,
    argonsBurnedPerBitcoinDollar: 1.3805290397670733,
    argonBurnCapacity: 6_000_000_000,
    profitsToDate: 0,
    argonRatioPrice: 1.00,
  };

  const reserve = new Reserve(TERRA_RESERVE_FUND, TERRA_RESERVE_FUND);
  const vault = new Vault('cached', currentDate);
  vault.loadFromCache(vaultMeta);
  vault.setPricePerBtcOverride(rules.btcPriceOverride);

  const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

  marker.setAnnualTransactions(rules.transactionsAnnually);
  marker.setAnnualMicropayments(rules.micropaymentsAnnually);

  marker.runRecovery(rules, [], vault);
  marker.manageSeigniorageProfits(rules, reserve);

  expect(marker.startingPrice).toBe(0.335272603202);
  expect(marker.currentPrice).toBe(1.00);
});

test("almost recovered while collapsing 1", () => {
  const currentDate = dayjs.utc('2022-06-11');
  const durationInHours = 24;
  const startingCirculation = 11334940.58600068;
  const startingCapital = 11334940.58600071;
  const vaultMeta: IVaultMeta = {
    bitcoinCount: 176394.81949172003,
    dollarsPerBitcoinLock: 36702.5907271,
    dollarsPerBitcoinUnlock: 33123.6107271,
    argonsBurnedPerBitcoinDollar: 1,
    argonBurnCapacity: 6_000_000_000,
    profitsToDate: 0,
    argonRatioPrice: 1.00,
  };

  const reserve = new Reserve(TERRA_RESERVE_FUND, TERRA_RESERVE_FUND);
  const vault = new Vault('cached', currentDate);
  vault.loadFromCache(vaultMeta);
  vault.setPricePerBtcOverride(rules.btcPriceOverride);

  const marker = new Marker(currentDate, durationInHours, startingCirculation, startingCapital);

  marker.setAnnualTransactions(rules.transactionsAnnually);
  marker.setAnnualMicropayments(rules.micropaymentsAnnually);

  marker.runRecovery(rules, [], vault);
  marker.manageSeigniorageProfits(rules, reserve);

  expect(marker.startingPrice).toBe(1.00);
  expect(marker.currentPrice).toBe(1.00);
});

test("almost recovered while collapsing 2", () => {
  const currentDate = dayjs.utc('2022-06-08');
  const durationInHours = 24;
  const startingCirculation = 152239587.0105677;
  const startingCapital = 152239587.0105667;
  const vaultMeta: IVaultMeta = {
    bitcoinCount: 27742.39778409606,
    dollarsPerBitcoinLock: 36702.5907271,
    dollarsPerBitcoinUnlock: 33123.6107271,
    argonsBurnedPerBitcoinDollar: 1,
    argonBurnCapacity: 6_000_000_000,
    profitsToDate: 0,
    argonRatioPrice: 1.00,
  };

  const reserve = new Reserve(TERRA_RESERVE_FUND, TERRA_RESERVE_FUND);
  const vault = new Vault('cached', currentDate);
  vault.loadFromCache(vaultMeta);
  vault.setPricePerBtcOverride(rules.btcPriceOverride);

  const marker = new Marker(currentDate, durationInHours, startingCirculation, startingCapital);

  marker.setAnnualTransactions(rules.transactionsAnnually);
  marker.setAnnualMicropayments(rules.micropaymentsAnnually);
  
  marker.removeCapital(86542271.37411, 'TerraCollapse');

  marker.runRecovery(rules, [], vault);
  marker.manageSeigniorageProfits(rules, reserve);

  expect(marker.startingPrice).toBe(1.00);
  expect(marker.currentPrice).toBe(1.00);
});

test("started recovering while collapsing", () => {
  const currentDate = dayjs.utc('2022-05-10');
  const durationInHours = 24;
  const startingCirculation = 17075324894.055326;
  const startingCapital = 14245274221.944801;
  const vaultMeta: IVaultMeta = {
    bitcoinCount: 230314.93823991003,
    dollarsPerBitcoinLock: 36702.5907271,
    dollarsPerBitcoinUnlock: 33123.6107271,
    argonsBurnedPerBitcoinDollar: 1.03455384337,
    argonBurnCapacity: 6_000_000_000,
    profitsToDate: 0,
    argonRatioPrice: 1.00,
  };
  const previousMarkers = [
    { durationInHours: 24, currentCapital: 14245274221.944801, pctIncreaseFromTaxationCompoundedAnnually: 6.319735450124361e+21 } as Marker
  ];
  
  const reserve = new Reserve(TERRA_RESERVE_FUND, TERRA_RESERVE_FUND);
  const vault = new Vault('cached', currentDate);
  vault.loadFromCache(vaultMeta);
  vault.setPricePerBtcOverride(rules.btcPriceOverride);

  const marker = new Marker(currentDate, durationInHours, startingCirculation, startingCapital);

  marker.setAnnualTransactions(rules.transactionsAnnually);
  marker.setAnnualMicropayments(rules.micropaymentsAnnually);
  
  marker.removeCapital(529640323.298, 'TerraCollapse');

  marker.runRecovery(rules, previousMarkers, vault);
  marker.manageSeigniorageProfits(rules, reserve);

  expect(marker.startingPrice).toBe(0.834260800912);
  // expect(marker.currentPrice).toBe(1.00);
});
