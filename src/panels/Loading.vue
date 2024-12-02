<template>
  <div class="flex flex-col w-full h-full items-center justify-center">
    <div StatusText class="font-bold text-slate-400 text-2xl">
      LOADING...
    </div>
  </div>
</template>

<style lang="scss" scoped>
[StatusText] {
  transform: translateY(-50%);
  animation: textPulse 1s infinite;
}

@keyframes textPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
}
</style>