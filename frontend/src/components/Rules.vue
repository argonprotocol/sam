<template>
  <div class="relative h-full">
    <div class="GLOBAL-BOX absolute z-0 left-0 top-0 right-2 h-full"></div>
    <div class="text-left pb-3 pr-2 pt-1 overflow-scroll h-full flex flex-col relative">
      <div class="flex flex-row sticky z-10 top-0 bg-[#F9FAFD] mx-2 border-b border-slate-300 py-3 pl-2 items-center">
        <h2 class="text-xl font-extralight grow">THE CONDITIONS</h2>
        <ResetIcon class="h-5 mr-3" />
        <!-- <button class="bg-[#9428C6] border border-[#73179E] rounded px-3 text-white">Run &raquo;</button> -->
      </div>

      <div CONTAINER class="grid grid-cols-[auto_auto_auto_1fr] font-mono font-thin text-[12.5px] mx-3 whitespace-nowrap" :class="`${asset}`">
        
        <RuleItem type="start" isBoth>
          <template #title>Circulation</template>
          <template #value>{{ formatShorthandNumber(data[asset].circulation) }}</template>
          <template #editing>
              The stablecoin has 
              <RuleInputText v-model="data[asset].circulation" :min="0" :max="999_999_999_999" useThousandsSeparator />
              tokens in circulation.
          </template>
          <template #help>
            The larger the stablecoin, the more tokens that must be burned for each percentage dropped.
            The currency will grow to 18B tokens before it begins to collapse.
          </template>
        </RuleItem>

        <RuleItem type="start" isBoth>
          <template #title>Base Inflation</template>
          <template #value>{{data[asset].inflation}}%</template>
          <template #editing>
            The dollar's ongoing inflation is expected to be 
            <RuleInputText v-model="data[asset].inflation" :min="0" :max="100" isNumber />
            % annually.
          </template>
          <template #help>
            Average Dollar Inflation. The dollar will experience an annual inflation of 3% going forward.
          </template>
        </RuleItem>

        <RuleItem type="start" isArgon>
          <template #title>Taxable Events</template>
          <template #value>{{ formatShorthandNumber(data[asset].taxableEvents) }} transactions</template>
          <template #editing>
            The network will settle
            <RuleInputText v-model="data[asset].taxableEvents" :min="0" :max="212_600_000_000" useThousandsSeparator />
            payment transactions annually.
          </template>
          <template #help>
            Transactional Throughput. 10B in Argon transactions (0.001% of Visa's volume) will be conducted annually.
          </template>
        </RuleItem>

        <RuleItem type="start" isArgon>
          <template #title>Micropayments</template>
          <template #value>${{ formatShorthandNumber(data[asset].micropayments) }} annually</template>
          <template #editing>
            The stablecoin will process a total revenue volume of
            <RuleInputText v-model="data[asset].micropayments" :min="0" :max="99_999_999_999" isDollars />
            in micropayments annually (i.e., Ulixee transactions).
          </template>
          <template #help>
            Micropayment Throughput. $10M annually (1% of circulation) is running through Ulixee Data Network annually.
          </template>
        </RuleItem>

        <RuleItem type="collapse" isBoth>
          <template #title>Pool Break</template>
          <template #value>{{ formatShorthandNumber(data[asset].poolDepegPct) }}% on {{data[asset].poolDepegDate}}</template>
          <template #editing>
            The trading pool breaks on
            {{ data[asset].poolDepegDate }} resulting in a
            price drop of 
            <RuleInputText v-model="data[asset].poolDepegPct" :min="0" :max="100" isNumber />%.
          </template>
          <template #help>
            Trading Pools Imbalance. Events that can initiate a significant drop in the stablecoin's value. Traders break the pool 5 times for a total of 6% in loss.
          </template>
        </RuleItem>

        <RuleItem type="collapse" isBoth>
          <template #title>Seller Fear</template>
          <template #value>{{data[asset].sellerFearLow}}-{{data[asset].sellerFearHigh}}% within {{data[asset].sellerFearWithinHours}}hrs</template>
          <template #editing>
            Sellers start selling if within a
            <RuleInputText v-model="data[asset].sellerFearWithinHours" :min="0" :max="48" isNumber /> hour window
            the price drops by 
            <RuleInputText v-model="data[asset].sellerFearLow" :min="0" :max="100" isNumber />% or more,
            escalating to peak panic at 
            <RuleInputText v-model="data[asset].sellerFearHigh" :min="0" :max="100" isNumber />%.
          </template>
          <template #help>
            Fear Triggers. Capital flees the market within the range of 2% and 5%. Factors that contribute to investor anxiety and potential sell-offs.
          </template>
        </RuleItem>
        
        <RuleItem type="collapse" isBoth>
          <template #title>Seller Latency</template>
          <template #value>{{data[asset].sellerLatencyLow}}-{{data[asset].sellerLatencyHigh}} hours</template>
          <template #editing>
            Sellers will procrastinate between
            <RuleInputText v-model="data[asset].sellerLatencyLow" :min="0" :max="48" isNumber /> {{ data[asset].sellerLatencyLow === 1 ? 'hour' : 'hours' }}
            and 
            <RuleInputText v-model="data[asset].sellerLatencyHigh" :min="0" :max="48" isNumber /> {{ data[asset].sellerLatencyHigh === 1 ? 'hour' : 'hours' }} before selling.
          </template>
          <template #help>
            Procrastination. How different market participants react to changes in the stablecoin's value. People are lazy and will delay acting for between 2 hours and 3 days.
          </template>
        </RuleItem>

        <RuleItem type="recovery" isArgon>
          <template #title>BTC Vaulted</template>
          <template #value>${{ formatShorthandNumber(data[asset].btcVaulted) }}</template>
          <template #editing>
            <RuleInputText v-model="data[asset].btcVaulted" :min="0" :max="data[asset].circulation" isDollars />
            of Bitcoin will have been vaulted before the collapse.
          </template>
          <template #help>
            Vaulted Bitcoins. Exogenous Incentives that influence the stablecoin's stability and adoption. 100% of allowed Bitcoin vaulting ($18B) is locked.
          </template>
        </RuleItem>

        <RuleItem type="recovery" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>BTC Vault Dates</template>
          <template #value>{{ data[asset].btcLockDateStart }} to {{ data[asset].btcLockDateStart }}</template>
          <template #editing>
            Bitcoins will have been vaulted between
            <RuleInputText v-model="data[asset].btcLockDateStart" min="2010/08/17" max="2023/08/26" isDate />
            and
            <RuleInputText v-model="data[asset].btcLockDateEnd" min="2011/08/17" max="2024/08/26"isDate />
          </template>
          <template #help>
            Lock Prices were set from 2022/01 to 2023/01
          </template>
        </RuleItem>

        <RuleItem type="recovery" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>BTC Ratcheting</template>
          <template #value>{{ data[asset].btcRatcheting }}% at {{ data[asset].btcRatchetingAt }}%</template>
          <template #editing>
            <RuleInputText v-model="data[asset].btcRatcheting" :min="0" :max="100" isNumber />% of vaulted bitcoins ratchet whenever the price changes by
            <RuleInputText v-model="data[asset].btcRatchetingAt" :min="0" :max="100" isNumber />%.
          </template>
          <template #help>
            20% of vaulted bitcoins are actively ratcheting at 10%.
          </template>
        </RuleItem>

        <RuleItem type="recovery" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>BTC Price</template>
          <template #value>${{ addCommas(data[asset].btcPrice) }}</template>
          <template #editing>
            Bitcoin has a current market price of<br />
            <RuleInputText v-model="data[asset].btcPrice" :min="1" :max="999_999" isDollars /> at the end of the collapse.
          </template>
          <template #help>
            This price affects the unlock price and therefore the amount of argons that can be burned out of circulation.
          </template>
        </RuleItem>

        <RuleItem type="recovery" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>BTC Txn Throttle</template>
          <template #value>{{ addCommas(data[asset].btcMaxTxns) }} per hour</template>
          <template #editing>
            A max of<RuleInputText v-model="data[asset].btcMaxTxns" :min="1" :max="24_000" useThousandsSeparator /> bitcoin transactions will be allowed per hour, with only one bitcoin per transaction.
          </template>
          <template #help>
            Automation. Automated bots make up a maximum of 3% of volume.
          </template>
        </RuleItem>

        <RuleItem type="recovery" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>BTC Unvault Bots</template>
          <template #value>{{ data[asset].unvaultBots }}% of market</template>
          <template #editing>
            Automated trading bots control 
            <RuleInputText v-model="data[asset].unvaultBots" :min="0" :max="100" isNumber />% of the vaulted bitcoins.
          </template>
          <template #help>
            Automation. Automated bots make up a maximum of 3% of volume.
          </template>
        </RuleItem>

        <RuleItem type="greed" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>Unvault Greed</template>
          <template #value>{{data[asset].unvaultGreedLow}}-{{data[asset].unvaultGreedHigh}}%</template>
          <template #editing>
            Bitcoiners will start unlocking when
            their profit potential is 
            <RuleInputText v-model="data[asset].unvaultGreedLow" :min="0" :max="100" isNumber />%,
            and they will reach peak fever when it hits
            <RuleInputText v-model="data[asset].unvaultGreedHigh" :min="0" :max="100" isNumber />%.
          </template>
          <template #help>
            Covering Shorts. Factors that drive profit-seeking behavior in the market. Bitcoins will unlock from vaults when they expect to profit between 10% and 20%.
          </template>
        </RuleItem>

        <RuleItem type="greed" :isDisabled="!data[asset].btcVaulted" isArgon>
          <template #title>Unvault Latency</template>
          <template #value>{{data[asset].unvaultLatencyLow}}-{{data[asset].unvaultLatencyHigh}} hours</template>
          <template #editing>
            Bitcoiners will procrastinate between
            <RuleInputText v-model="data[asset].unvaultLatencyLow" :min="0" :max="48" isNumber /> {{ data[asset].unvaultLatencyLow === 1 ? 'hour' : 'hours' }}
            and 
            <RuleInputText v-model="data[asset].unvaultLatencyHigh" :min="0" :max="48" isNumber /> {{ data[asset].unvaultLatencyHigh === 1 ? 'hour' : 'hours' }} before unvaulting.
          </template>
          <template #help>
            Covering Shorts. Factors that drive profit-seeking behavior in the market. Bitcoins will unlock from vaults when they expect to profit between 10% and 20%.
          </template>
        </RuleItem>


        <RuleItem type="greed" isBoth>
          <template #title>Certainty Greed</template>
          <template #value>{{ data[asset].certaintyGreedEnabled ? 'Enabled' : 'Disabled' }} at {{ data[asset].certaintyGreedLow }}-{{ data[asset].certaintyGreedHigh }}%</template>
          <template #editing>
            <RuleInputSelect v-model="data[asset].certaintyGreedEnabled" /> people acquiring argons when there is guaranteed profit from taxation of between 
            <RuleInputText v-model="data[asset].certaintyGreedLow" :min="0" :max="100" isNumber />%
            and 
            <RuleInputText v-model="data[asset].certaintyGreedHigh" :min="0" :max="100" isNumber />%.
          </template>
          <template #help>
            Buying for Profit. People will acquire argons when see a rebound profit of between 10% and 20%
          </template>
        </RuleItem>

        <RuleItem type="greed" :isDisabled="!data[asset].certaintyGreedEnabled" isBoth>
          <template #title>Certainty Latency</template>
          <template #value>{{ data[asset].certaintyLatencyLow }}-{{ data[asset].certaintyLatencyHigh }} hours</template>
          <template #editing>
            People will delay acquiring argons because of micropayment burning for between
            <RuleInputText v-model="data[asset].certaintyLatencyLow" :min="0" :max="48" isNumber /> {{ data[asset].certaintyLatencyLow === 1 ? 'hour' : 'hours' }}
            and 
            <RuleInputText v-model="data[asset].certaintyLatencyHigh" :min="0" :max="48" isNumber /> {{ data[asset].certaintyLatencyHigh === 1 ? 'hour' : 'hours' }}
          </template>
          <template #help>
            Buying for Profit. People will acquire argons when see a rebound profit of between 10% and 20%.
          </template>
        </RuleItem>

        <RuleItem type="greed" isBoth>
          <template #title>Specul. Greed</template>
          <template #value>{{ data[asset].speculativeGreedLow }}-{{ data[asset].speculativeGreedHigh }}% within {{ data[asset].speculativeGreedWithinHours }}hrs</template>
          <template #editing>
            People will acquire argons when see rebound profits of between 
            <RuleInputText v-model="data[asset].speculativeGreedLow" :min="0" :max="100" isNumber />%
            and 
            <RuleInputText v-model="data[asset].speculativeGreedHigh" :min="0" :max="100" isNumber />%
            within {{ data[asset].speculativeGreedWithinHours }} hours.
          </template>
          <template #help>
            Buying for Profit. People will acquire argons when see a rebound profit of between 10% and 20%
          </template>
        </RuleItem>

        <RuleItem type="greed" isBoth>
          <template #title>Specul. Latency</template>
          <template #value>{{ data[asset].speculativeLatencyLow }}-{{ data[asset].speculativeLatencyHigh }} hours</template>
          <template #editing>
            People will delay acquiring argons for between
            <RuleInputText v-model="data[asset].speculativeLatencyLow" :min="0" :max="48" isNumber /> {{ data[asset].speculativeLatencyLow === 1 ? 'hour' : 'hours' }}
            and 
            <RuleInputText v-model="data[asset].speculativeLatencyHigh" :min="0" :max="48" isNumber /> {{ data[asset].speculativeLatencyHigh === 1 ? 'hour' : 'hours' }}
          </template>
          <template #help>
            Buying for Profit. People will acquire argons when see a rebound profit of between 10% and 20%.
          </template>
        </RuleItem>
      
      </div>

      <div :class="asset === 'terra' ? 'pointer-events-none opacity-50' : ''" class="flex flex-row space-x-2 pt-5 pb-5 pl-3 pr-5 items-center font-mono font-thin text-[12.5px]">
        <select :disabled="asset === 'terra'" class="mr-2 inline-block rounded-md border-0 py-1.5 pl-3 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 font-mono font-thin text-[12.5px]" :class="{ 'cursor-not-allowed': asset === 'terra' }">
          <option :selected="data[asset].enableRecoveryDuringFall">Enable</option>
          <option :selected="!data[asset].enableRecoveryDuringFall">Disable</option>
        </select>
        Recovery During Fall 
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import numbro from 'numbro';
import { storeToRefs } from 'pinia';
import ResetIcon from '@/assets/reset-icon.svg';
import RuleItem from './RuleItem.vue';
import RuleInputText from './RuleInputText.vue';
import RuleInputSelect from './RuleInputSelect.vue';
import { useBasicStore } from '@/stores/basic';
import { addCommas } from '../lib/BasicUtils';

const basicStore = useBasicStore();
const { asset, rules: data } = storeToRefs(basicStore);

function formatShorthandNumber(value: number | string) {
  if (value === '--') {
    return value;
  }
  return numbro(value).format({
    average: true,
    mantissa: 1,
    optionalMantissa: true,
  }).toUpperCase();
}

function formatDateToString(date: Date): string {
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

function extractDateFromString(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  const [year, month, day] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

let isUpdatingBtcDates = false;

Vue.watch(() => data.value[asset.value].btcLockDateStart, (newValue, oldValue) => {
  if (!isUpdatingBtcDates && oldValue && newValue !== oldValue) {
    isUpdatingBtcDates = true;
    const startDate = extractDateFromString(newValue);
    const endDate = new Date(startDate.getTime());
    endDate.setFullYear(endDate.getFullYear() + 1);
    data.value[asset.value].btcLockDateEnd = formatDateToString(endDate);
    isUpdatingBtcDates = false;
  }
}, { immediate: true });

Vue.watch(() => data.value[asset.value].btcLockDateEnd, (newValue, oldValue) => {
  if (!isUpdatingBtcDates && oldValue && newValue !== oldValue) {
    isUpdatingBtcDates = true;
    const endDate = extractDateFromString(newValue);
    const startDate = new Date(endDate.getTime());
    startDate.setFullYear(startDate.getFullYear() - 1);
    data.value[asset.value].btcLockDateStart = formatDateToString(startDate);
    isUpdatingBtcDates = false;
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
  div[CONTAINER] {
    &.argon {
      div[ROW].highlight[isArgon], div[ROW].highlight[isBoth] {
        background: linear-gradient(to right, rgba(255, 253, 144, 0) 0%, rgba(255, 253, 144, 0.2) 10%, rgba(255, 253, 144, 0.2) 95%, rgba(118, 134, 180, 0) 100%);
      }
      div[ROW][isTerra] {
        pointer-events: none;
        opacity: 0.3;
      }
    }
    &.terra {
      div[ROW].highlight[isTerra], div[ROW].highlight[isBoth] {
        background: linear-gradient(to right, rgba(255, 253, 144, 0) 0%, rgba(255, 253, 144, 0.2) 10%, rgba(255, 253, 144, 0.2) 95%, rgba(255, 253, 144, 0) 100%);
      }
      div[ROW][isArgon] {
        pointer-events: none;
        opacity: 0.3;
      }
    }
  }
</style>

<style src="@vueform/slider/themes/default.css"></style>
