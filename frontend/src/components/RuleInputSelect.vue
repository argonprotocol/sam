<template>
  <select 
    v-model="localModel"
    class="mr-0.5 inline-block rounded-md border-0 py-1.5 pl-3 pr-1 text-gray-900 ring-1 ring-inset ring-gray-300 font-mono font-thin text-[12.5px]"
  >
    <option :value="true">Enable</option>
    <option :value="false">Disable</option>
  </select>
</template>

<script setup lang="ts">
import * as Vue from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean as Vue.PropType<boolean>,
  },
});

const emit = defineEmits(['update:modelValue']);
const localModel = Vue.ref(props.modelValue);

Vue.watch(() => props.modelValue, (newValue) => {
  localModel.value = newValue;
});

Vue.watch(localModel, (newValue) => {
  emit('update:modelValue', newValue);
});

</script>