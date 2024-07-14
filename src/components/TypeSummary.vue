<script setup lang="ts">
export interface TypeSummary {
  accuracy: number;
  speed: number;
  avgpress: number;
  extraInfos?: string[];
  hideAvgPress?: boolean;
}

defineProps<TypeSummary>();
</script>

<template>
  <div class="type-summary">
    <div v-for="(info, i) in extraInfos" :key="i">
      {{ info }}
    </div>
    <div class="accuaracy">{{ (accuracy * 100).toFixed(2) }} %</div>
    <div class="speed">{{ speed.toFixed(2) }} 字每分</div>
    <div v-if="hideAvgPress" class="avgpress">
      {{ avgpress.toFixed(2) }} 次每字
    </div>
  </div>
</template>

<style>
.type-summary {
  text-align: right;
  font-weight: bold;
}
</style>
