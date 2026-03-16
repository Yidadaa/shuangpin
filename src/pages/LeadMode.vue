<script setup lang="ts">
import SingleMode from "../components/SingleMode.vue";
import { leadMap, leadKeys } from "../utils/pinyin";
import { useStore } from "../store";
import { computed } from "vue";
import { getHanziOf } from "../utils/hanzi";
import { storeToRefs } from "pinia";

const store = useStore();
const currentLeadIndex = storeToRefs(store).currentLeadIndex;

const leadList = computed(() => {
  if (currentLeadIndex.value < 0 || currentLeadIndex.value >= leadKeys.length) {
    return [];
  }

  return leadMap.get(leadKeys[currentLeadIndex.value]) ?? [];
});

const hanziList = computed(() => {
  return leadList.value.flatMap((cur) => getHanziOf(cur.full));
});
</script>

<template>
  <single-mode :hanzi-list="hanziList" mode="Lead" />
</template>
