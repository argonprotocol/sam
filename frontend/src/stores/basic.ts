import * as Vue from 'vue';
import { defineStore } from 'pinia'

export const useBasicStore = defineStore('help', () => {
  const isHelpOpen = Vue.ref(false);
  const asset: Vue.Ref<'terra' | 'argon'> = Vue.ref('argon');
  const rulesToHighlight = Vue.ref('');

  const rules = Vue.reactive({
    terra: {
      circulation: 18_700_000_000,
      inflation: 3.5,
      taxableEvents: '--',
      micropayments: '--',
      poolDepegPct: 20,
      poolDepegDate: '05/09/2022',
      sellerFearLow: 1,
      sellerFearHigh: 10,
      sellerFearWithinHours: 24,
      sellerLatencyLow: 0,
      sellerLatencyHigh: 1,
      btcVaulted: '--',
      btcLockDateStart: '--',
      btcLockDateEnd: '--',
      btcRatcheting: '--',
      btcRatchetingAt: '--',
      btcPrice: '--',
      unvaultBots: '--',
      btcMaxTxns: '--',
      unvaultGreedLow: '--',
      unvaultGreedHigh: '--',
      unvaultLatencyLow: '--',
      unvaultLatencyHigh: '--',
      certaintyGreedEnabled: false,
      certaintyGreedLow: '--',
      certaintyGreedHigh: '--',
      certaintyLatencyLow: '--',
      certaintyLatencyHigh: '--',
      speculativeGreedLow: 10,
      speculativeGreedHigh: 20,
      speculativeGreedWithinHours: 24,
      speculativeLatencyLow: 2,
      speculativeLatencyHigh: 24,
      enableRecoveryDuringFall: true,
    },
    argon: {
      circulation: 18_700_000_000,
      inflation: 3.5,
      taxableEvents: 1_000_000_000,
      micropayments: 18_700_000,
      poolDepegPct: 20,
      poolDepegDate: '2022/05/09',
      sellerFearLow: 1,
      sellerFearHigh: 10,
      sellerFearWithinHours: 24,
      sellerLatencyLow: 0,
      sellerLatencyHigh: 1,
      btcVaulted: 18_700_000_000 / 2,
      btcLockDateStart: '2021/05/08',
      btcLockDateEnd: '2022/05/08',
      btcRatcheting: 10,
      btcRatchetingAt: 10,
      btcPrice: 62_000,
      unvaultBots: 3,
      btcMaxTxns: 4_000,
      unvaultGreedLow: 10,
      unvaultGreedHigh: 20,
      unvaultLatencyLow: 2,
      unvaultLatencyHigh: 24,
      certaintyGreedEnabled: true,
      certaintyGreedLow: 5,
      certaintyGreedHigh: 20,
      certaintyLatencyLow: 2,
      certaintyLatencyHigh: 24,
      speculativeGreedLow: 10,
      speculativeGreedHigh: 20,
      speculativeGreedWithinHours: 24,
      speculativeLatencyLow: 2,
      speculativeLatencyHigh: 24,
      enableRecoveryDuringFall: false,
    },
  });

  function toggleHelp() {
    isHelpOpen.value = !isHelpOpen.value;
  }

  function setAsset(name: 'terra' | 'argon') {
    asset.value = name;
  }

  return { isHelpOpen, asset, rulesToHighlight, rules, toggleHelp, setAsset }
});