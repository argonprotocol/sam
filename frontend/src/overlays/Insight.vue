<template>
  <div v-if="isOpen" :style="{ top: top, left: left, width: width, transform: `translate(${translateX}, ${translateY})` }" class="absolute z-[1000] border border-slate-500/30 flex flex-col rounded bg-white px-6 py-2 text-left shadow-xl transition-all pointer-events-none">
    
    <div :style="{ left: arrowLeft, top: arrowTop, bottom: arrowBottom, right: arrowRight, rotate: positionAt === 'top' ? '180deg' : '0deg' }" class="absolute -translate-x-1/2 -translate-y-full">
      <svg class="relative z-10" width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="white"/>
      </svg>
      <svg class="absolute z-0 -top-0.5 left-[-0.5px] opacity-20" width="26" height="14" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L24 12H0L12 0Z" fill="black"/>
      </svg>
    </div>
    
    <div class="grow">
      <div class="py-3 text-left text-sm text-slate-500 font-light">
        
        <div v-if="id === 'bitcoinCoverage'" class="space-y-2">
          <div class="border-b mb-2 pb-2 flex flex-row space-x-2">
            <div>Bitcoins {{ data.bitcoinChange < 0 ? 'Unlocked' : 'Added' }} Today: </div>
            <div>{{ addCommas(Math.round(Math.abs(data.bitcoinChange))) }}</div>
          </div>
          <div class="border-b mb-5 pb-2 flex flex-row space-x-2">
            <div>Minting Capacity at Start: </div>
            <div>{{ addCommas(Math.round(Math.abs(data.bitcoinMintingPct * 2))) }}%</div>
          </div>
          <div class="border-b mb-5 pb-2 flex flex-row space-x-2">
            <div>Minting Capacity at End: </div>
            <div>{{ addCommas(Math.round(Math.abs(data.bitcoinMintingPct * 2))) }}%</div>
          </div>
          <p v-if="data.bitcoinChange === 0">Bitcoins can only be added when the ratio of argons minted by bitcions is less than 50%. No bitcoins have been added since yesterday. This is because there is no minting space for new bitcoins.</p>
          <p v-else>{{ addCommas(Math.round(Math.abs(data.bitcoinChange))) }} bitcoins were {{ data.bitcoinChange < 0 ? 'unlocked from' : 'added to' }} the Argon Vaults today, which brings the total number of vaulted bitcoins to {{ addCommas(Math.round(data.bitcoinCount)) }}.</p>
          <p>For more details see pages 12-14 of<em>Whitepaper #2</em>.</p>
        </div>

        <div v-if="id === 'bitcoinProfits'" class="space-y-2">
          <p>Bitcoins play a pivotal role in the Argon ecosystem. The total number of bitcoins vaulted in the Argon Vaults is ---.</p>
          <p>The total value of the bitcoins vaulted is ---.</p>
        </div>


        <div v-if="id === 'argonRelativeToDollar'" class="space-y-2">
          <p>The price of Argon has increased by {{ data.dollarDiffPct > 0 ? '+' : '' }}{{ data.dollarDiffPct }}% compared to the dollar today.</p>
        </div>

        <div v-if="id === 'micropayments'" class="space-y-2">
          <p>The network's annual micropayments volume increased by ${{ currency(data.micropaymentsChange, 0) }} bringing the total volume to ${{ currency(data.annualMicropayments, 0) }} </p>
          <p>We expect the vast majority of this ${{ formatShorthandNumber(data.annualMicropayments, { mantissa: 0, optionalMantissa: false }) }} to be driven by demand from the Ulixee Data Network.</p>
        </div>

        <div v-if="id === 'seigniorage'" class="space-y-2">
          <p>Argon's seigniorage model accrues all incoming capital to the network's Ownership Tokens. This capital increased by ${{ currency(data.seigniorageChange, 0) }}, which brings the network's total profits to ${{ currency(data.seigniorageProfits, 0) }}.</p>
        </div>
        
        <div v-if="id === 'price'" class="space-y-2">
          <p v-if="data.startingPrice === data.lowestPrice && data.lowestPrice === data.endingPrice">The price of Argon has remained steady at ${{ formatPrice(data.startingPrice )}} throughout the entire day. Explore the rest of this page to see the details.</p>
          <p v-else>The price of Argon started at ${{ formatPrice(data.startingPrice )}} this morning, dropped to ${{ formatPrice(data.lowestPrice )}}, then finished at ${{ formatPrice(data.endingPrice )}}. The rest of this page shows you how this price was formed.</p>
        </div>

        <p v-if="id === 'speculativeGreed'" class="space-y-2">Capital increase from profit speculation is driven by price momentum from previous days. Yesterday's price increase was 0.2%, which is less than the configured minimum of 5% and therefore why no capital was added.</p>

        <p v-if="id === 'certaintyGreed'" class="space-y-2">Profit certainty is driven by taxation, which has little speculation and is therefore a more stable source of capital. So long as the Ulixee Data Network continues to be used, this will be a consistent burn of circulation and therefore a consistent upward increase in price.</p>

        <p v-if="id === 'terraCapitalIncrease'" class="space-y-2">Terra had $3B sitting in their Luna Foundation which they used during the Terra collapse. We're following the same process with Argon in order to create a realistic recreation of Terra's $18.7B implosion.</p>

        <p v-if="id === 'todaysCapital'" class="space-y-2">Capital in the Argon has increased from $14B to $14.2B since yesterday.</p>

        <p v-if="id === 'yesterdaysCapital'" class="space-y-2">Yesterday ended with $14B of capital sitting in the Argon.</p>

        <p v-if="id === 'todaysCirculation'" class="space-y-2">Capital in the Argon has increased from $14B to $14.2B since yesterday.</p>

        <p v-if="id === 'yesterdaysCirculation'" class="space-y-2">Capital in the Argon has increased from $14B to $14.2B since yesterday.</p>

        <div v-if="id === 'bitcoinUnlocking'" class="space-y-2">
          <p>This is circulation that has been removed using Argon's bitcoin unlocking mechanism. Although bitcoin owners can unlock at any time, the SAM model only triggers it when there is a guaranteed profit to be made due to Argon dropping below its target price.</p>
          
          <p>---- bitcoins were unlocked, which is the maximum amount that could be unlocked without pushing Argon's price above $1.00. The unlockers earned an average profit of 35%.</p>
          
          <p>No bitcoins were unlocked because Argon's price has remained stready at $1.00.</p>

          <p>For more details see pages 12-14 of <em>Whitepaper #2</em>.</p>
        </div>

        <div v-if="id === 'taxedMicropayments'" class="space-y-2">
          <p>This is circulation that has been removed using Argon's micropayments taxation mechanism.</p>
        </div>

        <p v-if="id === 'taxedTransactions'" class="space-y-2">This is circulation that has been removed using Argon's transaction taxation mechanism.</p>

        <p v-if="id === 'terraCirculationIncrease'" class="space-y-2">Capital in the Argon has increased from $14B to $14.2B since yesterday.</p>

      </div>
    </div>            
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import dayjs from 'dayjs';
import dayjsUtc from 'dayjs/plugin/utc';
import emitter from '../emitters/basic';
import { addCommas, currency, formatPrice, formatShorthandNumber } from '../lib/BasicUtils';

dayjs.extend(dayjsUtc);

const isOpen = Vue.ref(false);

const id = Vue.ref('');
const data = Vue.ref({} as any);

const positionAt = Vue.ref('');
const alignTo = Vue.ref('');

const left = Vue.ref('auto');
const top = Vue.ref('auto');
const translateY = Vue.ref('0');
const translateX = Vue.ref('0');

const width = Vue.ref('auto');

const arrowLeft = Vue.ref('auto');
const arrowRight = Vue.ref('auto');
const arrowTop = Vue.ref('auto');
const arrowBottom = Vue.ref('auto');

emitter.on('showInsight', (incoming: any) => {
  isOpen.value = true;
  id.value = incoming.id;
  positionAt.value = incoming.positionAt;
  alignTo.value = incoming.alignTo;
  width.value = incoming.width ? `${incoming.width}px` : '24rem';
  data.value = incoming.data;

  console.log('incoming', positionAt.value, alignTo.value);

  if (positionAt.value === 'top') {
    top.value = `${incoming.y - 5}px`;
    arrowTop.value = 'auto';
    arrowBottom.value = '0px';
    translateY.value = '-100%';
  } 

  if (positionAt.value === 'bottom') {
    top.value = `${incoming.y + 13}px`;
    arrowTop.value = '0px';
    arrowBottom.value = 'auto';
    translateY.value = '0';
  }

  if (alignTo.value === 'left') {
    left.value = `${incoming.x}px`;
    arrowLeft.value = `${incoming.arrowX}px`;
    arrowRight.value = 'auto';
    translateX.value = '0';
  }
  
  if (alignTo.value === 'right') {
    left.value = `${incoming.x}px`;
    arrowLeft.value = `${incoming.arrowX}px`;
    arrowRight.value = 'auto';
    translateX.value = '-100%';
  }
});

emitter.on('hideInsight', () => {
  isOpen.value = false;
});
</script>