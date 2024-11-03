<template>
  <div class="relative border border-slate-300">
    <svg class="w-full h-full relative left-[-1px]" style="width: calc(100% + 2px)" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`textGradientA1-${id}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="20%" :style="{ stopColor: bgColor, stopOpacity: 0 }" />
          <stop offset="100%" :style="{ stopColor: bgColor, stopOpacity: 1 }" />
        </linearGradient>
        <linearGradient :id="`textGradientA2-${id}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :style="{ stopColor: bgColor, stopOpacity: 1 }" />
          <stop offset="80%" :style="{ stopColor: bgColor, stopOpacity: 0 }" />
        </linearGradient>
        <linearGradient :id="`textGradientA3-${id}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="20%" style="stop-color:#fff; stop-opacity:0" />
          <stop offset="100%" style="stop-color:#fff; stop-opacity:1" />
        </linearGradient>
        <linearGradient :id="`textGradientA4-${id}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fff; stop-opacity:1" />
          <stop offset="80%" style="stop-color:#fff; stop-opacity:0" />
        </linearGradient>
        <clipPath :id="`theClipPath1-${id}`">
          <rect width="100%" :height="pct * 100 + '%'" fill="black" x="0" :y="100 - (pct * 100) + '%'" />
        </clipPath>
      </defs>
      <rect width="100%" :height="pct * 100 + '%'" :fill="bgColor" x="0" :y="100 - (pct * 100) + '%'" />
      
      <text @mouseenter="showInsight('tomorrow', $event)" @mouseleave="hideInsight('tomorrow')" :position="insightPosition" class="font-bold opacity-50" x="50%" y="50%" transform="translate(0 -27)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(tomorrow))" lengthAdjust="spacing">
        <tspan class="w-9" :fill="`url(#textGradientA1-${id})`">$</tspan>
        <tspan class="w-9" :fill="`url(#textGradientA1-${id})`" v-for="x of formatAsBillions(tomorrow).split('')">{{x}}</tspan>
      </text>
      
      <text @mouseenter="showInsight('today', $event)" @mouseleave="hideInsight('today')" :position="insightPosition" class="pointer-events-none font-bold" x="50%" y="50%" transform="translate(0 20)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(today))" lengthAdjust="spacing">
        <tspan class="w-9" :fill="bgColor">$</tspan>
        <tspan class="w-9" :fill="bgColor" v-for="x of formatAsBillions(today).split('')">{{x}}</tspan>
      </text>
      
      <text @mouseenter="showInsight('yesterday', $event)" @mouseleave="hideInsight('yesterday')" :position="insightPosition" class="font-bold opacity-50" x="50%" y="50%" transform="translate(0 66)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(yesterday))" lengthAdjust="spacing">
        <tspan class="w-9" :fill="`url(#textGradientA2-${id})`">$</tspan>
        <tspan class="w-9" :fill="`url(#textGradientA2-${id})`" v-for="x of formatAsBillions(yesterday).split('')">{{x}}</tspan>
      </text>
      
      <g :clip-path="`url(#theClipPath1-${id})`">
        <text @mouseenter="showInsight('tomorrow', $event)" @mouseleave="hideInsight('tomorrow')" :position="insightPosition" class="font-bold opacity-50" x="50%" y="50%" transform="translate(0 -27)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(tomorrow))" lengthAdjust="spacing">
          <tspan :fill="`url(#textGradientA3-${id})`">$</tspan>
          <tspan :fill="`url(#textGradientA3-${id})`" v-for="x of formatAsBillions(tomorrow).split('')">{{x}}</tspan>
        </text>
        <text @mouseenter="showInsight('today', $event)" @mouseleave="hideInsight('today')" :position="insightPosition" class="pointer-events-none font-bold" x="50%" y="50%" transform="translate(0 20)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(today))" lengthAdjust="spacing">
          <tspan fill="#fff">$</tspan>
          <tspan fill="#fff" v-for="x of formatAsBillions(today).split('')">{{x}}</tspan>
        </text>
        <text @mouseenter="showInsight('yesterday', $event)" @mouseleave="hideInsight('yesterday')" :position="insightPosition" class="font-bold opacity-50" x="50%" y="50%" transform="translate(0 66)" text-anchor="middle" font-size="50" :textLength="calculateTextLength(formatAsBillions(yesterday))" lengthAdjust="spacing">
          <tspan :fill="`url(#textGradientA4-${id})`">$</tspan>
          <tspan :fill="`url(#textGradientA4-${id})`" v-for="x of formatAsBillions(yesterday).split('')">{{x}}</tspan>
        </text>
      </g>
    </svg>
    <div class="absolute -bottom-1.5 -left-2 -right-2 bg-slate-400/40 h-1"></div>
    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full font-semibold text-slate-400/80">{{ label }}</div>
  </div>
</template>

<script lang="ts" setup>
import * as Vue from 'vue';
import { formatAsBillions } from '../lib/BasicUtils';

const props = defineProps<{
  id: string;
  yesterday: number;
  today: number;
  tomorrow: number;
  pct: number;
  bgColor: string;
}>();

const yesterday = Vue.computed(() => props.yesterday);
const today = Vue.computed(() => props.today);
const tomorrow = Vue.computed(() => props.tomorrow);
const pct = Vue.computed(() => props.pct);
const bgColor = Vue.ref(props.bgColor);
const label = Vue.ref(props.id.charAt(0).toUpperCase() + props.id.slice(1));

const insightPosition = props.id === 'supply' ? 'left' : 'right';

function calculateTextLength(text: string) {
  return (text.length + 1) * 30.8571428571;
}

const emit = defineEmits<{
  (e: 'showInsight', insight: string, $event: MouseEvent): void;
  (e: 'hideInsight', insight: string): void;
}>();

function showInsight(type: string, $event: MouseEvent) {
  emit('showInsight', type, $event);
}

function hideInsight(type: string) {
  emit('hideInsight', type);
}
</script>
