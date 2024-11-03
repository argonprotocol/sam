<template>
  <div class="Component h-4 w-full relative mb-5">
    <div class="absolute -top-1 -bottom-1 w-2 bg-slate-200 border border-slate-400 rounded-full shadow-lg" :style="`left: ${position}%`">
      <div class="absolute -bottom-5 left-0" :style="`transform: translateX(-${position}%)`">{{ value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  position?: number;
  value?: string;
}>();

</script>

<style lang="scss" scoped>
.Component {
  background: linear-gradient(to right, #F44D4D 0%, #AAB0B7 50%, #97D860 100%);
  box-shadow: inset 1px 1px 2px 1px rgba(0, 0, 0, 0.1);
}
</style>