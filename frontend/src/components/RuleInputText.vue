<template>
  <span class="whitespace-nowrap">{{ props.isDollars ? '$' : '' }}<input 
    type="text"
    ref="input"
    v-autowidth="{ minWidth: isDate ? '90px' : '23px' }" 
    v-model="localModel" 
    v-maska="maskaOptions"
    class="inline box-border border-b border-slate-300 bg-slate-100 px-2 py-0 leading-5"
    :class="isDragging ? 'cursor-ew-resize select-none' : ''"
    @input="emitInput"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="stopDrag"
    @keydown="handleKeyDown"
  /></span>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import { vMaska } from "maska/vue";
import { directive as vAutowidth } from 'vue-input-autowidth';
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const props = defineProps({
  modelValue: {
    type: [String, Number] as Vue.PropType<string | number>,
    validator: value => typeof value === 'string' || typeof value === 'number'
  },
  min: {
    type: [Number, String] as Vue.PropType<number | string>,
  },
  max: {
    type: [Number, String] as Vue.PropType<number | string>,
  },
  useThousandsSeparator: {
    type: Boolean,
    default: false,
  },
  isDollars: {
    type: Boolean,
    default: false,
  },
  isNumber: {
    type: Boolean,
    default: false,
  },
  isDate: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);
const localModel = Vue.ref(props.modelValue);

const input = Vue.ref();
const maskaOptions = {} as any;
const isDragging = Vue.ref(false);

let dragStartX = 0;
let dragTimeout: number | null = null;
let dragMeta: any = {};

if (props.isDollars || props.useThousandsSeparator) {
  maskaOptions.number = true;
  maskaOptions.thousandsSeparator = ',';
} else if (props.isDate) {
  maskaOptions.mask = '####/##/##';
  maskaOptions.tokens = {
    'Y': { pattern: /[0-9]/ },
    'M': { pattern: /[0-1]/ },
    'D': { pattern: /[0-3]/ },
  };
}

Vue.watch(() => props.modelValue, (newValue) => {
  localModel.value = newValue;
});

Vue.onMounted(() => {
  setTimeout(() => {
    input.value.sizerFunc(input.value);
  }, 100);
});

function cleanNumber(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'undefined') {
    return 0;
  }
  return Number(value.replace(/[^0-9]/g, ''));
}

function emitInput(event: any) {
  let value = event.target.value;
  if (props.isNumber || props.isDollars || props.useThousandsSeparator) {
    value = ensureMinMax(cleanNumber(value));
  } else if (props.isDate) {
    value = (ensureMinMax(dayjs.utc(value)) as Dayjs).format('YYYY/MM/DD');
  }

  emit('update:modelValue', value);
}

function startDrag(event: any) {
  dragTimeout = window.setTimeout(() => {
    isDragging.value = true;
    // input.value.blur();
    document.body.style.userSelect = 'none';
    dragStartX = event.clientX; // Store the initial mouse position
    if (props.isNumber || props.isDollars || props.useThousandsSeparator) {
      const originalValue = cleanNumber(localModel.value);
      dragMeta = {
        originalValue,
        valuePerStep: dragStartX / originalValue,
      }
    } else if (props.isDate) {
      const originalDate = dayjs.utc(localModel.value);
      const minDate = dayjs.utc(props.min ? props.min : '2010/01/01');
      const daysDifference = originalDate.diff(minDate, 'days');
      dragMeta = {
        originalDate,
        daysDifference,
        valuePerStep: Math.max(1, Math.ceil(dragStartX / daysDifference)),
      }
    }
  }, 100);
}

function stopDrag(event: any) {
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  if (isDragging.value) {
    isDragging.value = false;
    document.body.style.userSelect = 'auto';
  }
}

function drag(event: any) {
  if (!isDragging.value) {
    return;
  }
  event.preventDefault();
  let newValue;
  const delta = event.clientX - dragStartX; // Calculate the difference from the initial position

  if (props.isNumber || props.isDollars || props.useThousandsSeparator) {
    newValue = cleanNumber(localModel.value);
    const decreaseFactor = Math.sign(delta) * Math.floor(Math.abs(delta) / dragMeta.valuePerStep);
    newValue = Math.max(0, newValue + decreaseFactor);
  } else if (props.isDate) {
    const daysToAdd = Math.sign(delta) * Math.floor(Math.abs(delta) / dragMeta.valuePerStep);
    const newDate = ensureMinMax(dayjs.utc(localModel.value).add(daysToAdd, 'day')) as Dayjs;
    newValue = newDate.format('YYYY/MM/DD');
  } else {
    // For other inputs, don't change the value
    return;
  } 

  localModel.value = newValue;
  emit('update:modelValue', newValue);
}

function ensureMinMax(value: number | Dayjs) {
  if (typeof value === 'number' && props.isNumber || props.isDollars || props.useThousandsSeparator) {
    const max = props.max ? Number(props.max) : Infinity;
    const min = props.min ? Number(props.min) : 0;
    if (value as number < min) {
      return min;
    }
    if (value as number > max) {
      return max;
    }
  } else if (value instanceof dayjs) {
    const max = dayjs.utc(props.max);
    const min = dayjs.utc(props.min);
    if (value.isBefore(min)) {
      return min;
    }
    if (value.isAfter(max)) {
      return max;
    }
  }
  return value;
}

function extractDateFromString(dateString: string): Dayjs {
  return dateString ? dayjs.utc(dateString) : dayjs.utc();
}

function handleKeyDown(event: any) {
  if (props.isNumber || props.isDollars || props.useThousandsSeparator) {
    if (event.key === 'ArrowUp') {
      localModel.value = ensureMinMax(cleanNumber(localModel.value)) as number + 1;
      emit('update:modelValue', localModel.value);
    } else if (event.key === 'ArrowDown') {
      localModel.value = ensureMinMax(cleanNumber(localModel.value)) as number - 1;
      emit('update:modelValue', localModel.value);
    }
  } else if (props.isDate) {
    if (event.key === 'ArrowUp') {
      const date = ensureMinMax(dayjs.utc(localModel.value).add(1, 'day')) as Dayjs;
      localModel.value = date.format('YYYY/MM/DD')
      emit('update:modelValue', localModel.value);
    } else if (event.key === 'ArrowDown') {
      const date = ensureMinMax(dayjs.utc(localModel.value).subtract(1, 'day')) as Dayjs;
      localModel.value = date.format('YYYY/MM/DD')
      emit('update:modelValue', localModel.value);
    }
  }
}
</script>

