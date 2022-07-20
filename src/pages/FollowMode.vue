<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import { followMap, followKeys } from '../utils/pinyin'
import { useStore } from '../store'
import { computed, ref } from '@vue/reactivity';
import { hanziMap } from '../utils/hanzi';
import { storeToRefs } from 'pinia';

const store = useStore()
const currentFollowIndex = storeToRefs(store).currentFollowIndex
const followList = computed(() => {
  if (currentFollowIndex.value < 0 || currentFollowIndex.value >= followKeys.length) {
    return []
  }

  return followMap.get(followKeys[currentFollowIndex.value]) ?? []
})

const hanziList = computed(() => {
  return followList.value.reduce((pre, cur) => pre.concat(hanziMap.p2h.get(cur.full) ?? []), [] as string[])
})

</script>

<template>
  <single-mode :hanzi-list="hanziList" mode="Follow"></single-mode>
</template>

<style lang="less">
</style>