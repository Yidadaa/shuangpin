<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import { followMap, followKeys, getCombineOf } from '../utils/pinyin'
import { useStore } from '../store'
import { computed, ref } from '@vue/reactivity';
import { hanziMap } from '../utils/hanzi';

const store = useStore()
const followList = computed(() => {
  if (store.currentFollowIndex < 0 || store.currentFollowIndex >= followKeys.length) {
    return []
  }

  return followMap.get(followKeys[store.currentFollowIndex]) ?? []
})
const currentIndex = ref(0)
const hanziList = computed(() => {
  const pinyin = getCombineOf(followList.value[currentIndex.value])

  return hanziMap.p2h.get(pinyin) ?? []
})
const currentHanziIndex = ref(0)

function nextChar() {
  return hanziList.value[++currentHanziIndex.value]
}

</script>

<template>
  <single-mode :next-char="nextChar"></single-mode>
</template>

<style lang="less">
</style>