import { expect, test } from 'bun:test';
import dayjs from 'dayjs';
import rules from './helpers/rules';
import Marker from '../lib/Marker';
import Vault, { IVaultMeta } from '../lib/Vault';
import { TERRA_RESERVE_FUND } from '../lib/BlockchainRunner';
import Reserve from '../lib/Reserve';

test.only("test single day recovery", () => {
  const customRules = {
    ...rules,
    btcMaxTxnsPerHour: 1000,
  };
  const currentDate = dayjs.utc('2022-07-04');
  const durationInHours = 24;
  const currentCirculation = 10_000_000;
  const currentCapital = 5_000_000;
  
  const vaultMeta: IVaultMeta = {
    bitcoinCount: 100_000,
    dollarsPerBitcoinLock: 10_000,
    dollarsPerBitcoinUnlock: 10_000,
    argonsBurnedPerBitcoinDollar: 1,
    argonBurnCapacity: 100_000_000,
    profitsToDate: 0,
    argonRatioPrice: 1.00,
    bitcoinMintedArgons: 0,
  };

  const reserve = new Reserve(TERRA_RESERVE_FUND, TERRA_RESERVE_FUND);
  const vault = new Vault('cached', currentDate);
  vault.loadFromCache(vaultMeta);
  vault.setPricePerBtcOverride(10_000);

  const marker = new Marker(currentDate, durationInHours, currentCirculation, currentCapital);

  marker.setAnnualTransactions(rules.transactionsAnnually);
  marker.setAnnualMicropayments(rules.micropaymentsAnnually);

  marker.runRecovery(rules, [], vault);
  marker.manageSeigniorageProfits(rules, reserve);

  console.log(marker.toJson());
  expect(marker.startingPrice.toFixed(2)).toBe('0.50');
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
    bitcoinMintedArgons: 0,
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
    bitcoinMintedArgons: 0,
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
    bitcoinMintedArgons: 0,
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
