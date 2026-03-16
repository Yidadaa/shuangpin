<script setup lang="ts">
import SingleMode from "../components/SingleMode.vue";
import { followMap, followKeys } from "../utils/pinyin";
import { useStore } from "../store";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { getHanziOf } from "../utils/hanzi";

const store = useStore();

const { currentFollowIndex } = storeToRefs(store);

const followList = computed(() => {
  if (
    currentFollowIndex.value < 0 ||
    currentFollowIndex.value >= followKeys.length
  ) {
    return [];
  }
  const key = followKeys[currentFollowIndex.value];
  const result = followMap.get(key) ?? [];
  return result;
});
const hanziList = computed(() => {
  return followList.value.flatMap((cur) => getHanziOf(cur.full));
});
</script>

<template>
  <single-mode :hanzi-list="hanziList" mode="Follow" />
</template>
