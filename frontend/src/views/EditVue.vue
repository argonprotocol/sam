<template>
<div HeaderBar class="HEADER COMPONENT flex flex-row pl-4 items-center z-50">
    <a :disabled="selectedPanel==='runner'" Logo href="https://argonprotocol.org" class="block w-8 relative top-[1px]"><Logo /></a>
    <h1 :disabled="selectedPanel==='runner'" class="text-2xl font-extralight relative top-[0.5px] text-left pl-[10px] py-3 whitespace-nowrap text-slate-600">Stabilization Analysis Model</h1>
    <div class="grow"></div>
    <div class="relative">
    </div>
    <div class="grow"></div>
    <div class="flex flex-row space-x-1 items-center divide-x-2 pr-4">
      <ul class="TOGGLE flex flex-row bg-[#E9EBF1] border border-[#b8b9bd] rounded mr-3 text-center text-slate-600" :disabled="selectedPanel !== 'base'">
        <li class="border-r border-slate-400" @click="saveFilter('collapseThenRecover')" :class="{ 'selected': selectedFilter === 'collapseThenRecover' }">
          <span>Run Argon Mechanisms After Collapse</span>
        </li>
        <li class="border-r border-slate-400" @click="saveFilter('collapsedForever')" :class="{ 'selected': selectedFilter === 'collapsedForever' }">
          <span>Never Run</span>
        </li>
        <li class="" @click="saveFilter('collapsingRecovery')" :class="{ 'selected': selectedFilter === 'collapsingRecovery' }">
          <span>Always Run</span>
        </li>
      </ul>
      <div class="px-1">
        <div class="IconWrapper" :disabled="selectedPanel !== 'base'">
          <DownloadOutlined OutlineIcon class="h-[22px]" />
          <DownloadSolid SolidIcon class="h-[22px]" />
        </div>
      </div>
      <Popover class="px-1 cursor-pointer relative">
        <PopoverButton as="div" class="IconWrapper" id="header-settings-icon">
          <div IconWrapper :disabled="selectedPanel==='runner'">
            <SettingsOutlined OutlineIcon class="h-[24px]" @click="" />
            <SettingsSolid SolidIcon class="h-[24px]" />
          </div>
        </PopoverButton>
      </Popover>
      <div class="px-1 cursor-pointer">
        <a class="IconWrapper" :disabled="selectedPanel==='runner'" href="https://github.com/argonprotocol/stabilization-analysis-model" target="_blank">
          <GithubOutlined OutlineIcon class="h-[24px]" @click="" />
          <GithubSolid SolidIcon class="h-[24px]" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>
