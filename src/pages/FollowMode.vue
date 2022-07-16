<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import { followMap, followKeys } from '../utils/pinyin'
import { useStore } from '../store'
import { computed, ref } from '@vue/reactivity';
import { hanziMap } from '../utils/hanzi';
import { randInt } from '../utils/number';

const store = useStore()
const followList = computed(() => {
  if (store.currentFollowIndex < 0 || store.currentFollowIndex >= followKeys.length) {
    return []
  }

  return followMap.get(followKeys[store.currentLeadIndex]) ?? []
})

const hanziList = computed(() => {
  return followList.value.reduce((pre, cur) => pre.concat(hanziMap.p2h.get(cur.full) ?? []), [] as string[])
})

const currentHanziIndex = ref(0)

function nextChar() {
  currentHanziIndex.value = randInt(hanziList.value.length)
  return hanziList.value[currentHanziIndex.value] ?? ''
}
</script>

<template>
  <single-mode :next-char="nextChar"></single-mode>
</template>

<style lang="less">
</style>