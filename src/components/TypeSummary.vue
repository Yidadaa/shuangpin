<script setup lang="ts">
export interface TypeSummaryProps {
  accuracy: number,
  speed: number,
  avgpress: number
}

const props = defineProps<TypeSummaryProps>()
</script>

<template>
  <div class="type-summary">
    <div class="accuaracy">
      {{ (props.accuracy * 100).toFixed(2) }} %
    </div>
    <div class="speed">
      {{ props.speed.toFixed(2) }} 字每分
    </div>
    <div class="avgpress">
      {{ props.avgpress.toFixed(2) }} 次每字
    </div>
  </div>
</template>

<style>
.type-summary {
  text-align: right;
  font-weight: bold;
}
</style>
