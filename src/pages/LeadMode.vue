<script setup lang="ts">
import SingleMode from '../components/SingleMode.vue';
import { leadMap, leadKeys, getCombineOf } from '../utils/pinyin'
import { useStore } from '../store'
import { computed, ref } from '@vue/reactivity';
import { hanziMap } from '../utils/hanzi';
import { randInt } from '../utils/number';

const store = useStore()
const leadList = computed(() => {
  if (store.currentLeadIndex < 0 || store.currentLeadIndex >= leadKeys.length) {
    return []
  }

  return leadMap.get(leadKeys[store.currentLeadIndex]) ?? []
})
const currentIndex = ref(randInt(leadList.value.length))
const hanziList = computed(() => {
  if (!leadList.value[currentIndex.value]) { return [] }

  const pinyin = getCombineOf(leadList.value[currentIndex.value])

  return hanziMap.p2h.get(pinyin) ?? []
})
const currentHanziIndex = ref(0)

function nextChar() {
  return hanziList.value[++currentHanziIndex.value] ?? ''
}

</script>

<template>
  <single-mode :next-char="nextChar"></single-mode>
</template>


<style lang="less">
</style>