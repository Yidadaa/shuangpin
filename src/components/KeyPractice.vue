<script setup lang="ts">
import Keyboard from "../components/Keyboard.vue";
import PhonemeComponent from "../components/PhonemeList.vue";
import TypeSummary from "../components/TypeSummary.vue";
import MenuList from "../components/MenuList.vue";

import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "../store";
import { courseNames, courses, courseTitles } from "../utils/courseConfig.gen";
import { keyboardLayoutWithPunctuation } from "../utils/keyboard";
import {
  allMenuChangeKeys,
  createWholeSeq,
  currentMenuChangeKeys,
  passRequire,
  punctuationMapper,
  resultMap,
} from "../utils/keyPosition";
import type { Phoneme, KeyPracticeProps } from "../utils/phoneme";

const props = defineProps<KeyPracticeProps>();
const store = useStore();
const route = useRoute();
const router = useRouter();
const index = ref(0);
const menuIndex = ref(0);
const phonemeSeq = ref<Phoneme[]>([]);
const summary = ref({
  inputCharNum: 0,
  correctCharNum: 0,
  wrongCharList: {} as Record<string, number | undefined>, // TODO: show wrong char list summary
  startTime: Date.now(),
});
const extraInfos = ref<string[]>([]);
const summaryResult = computed(() => {
  const { startTime, inputCharNum, correctCharNum } = summary.value;
  const now = Date.now();
  const timeDiffer = now - startTime;
  const speed = timeDiffer && (inputCharNum / timeDiffer) * 1000 * 60;
  const accuracy = inputCharNum && correctCharNum / inputCharNum;
  return {
    speed,
    accuracy,
  };
});

init(Number(route.query.course ?? 0));
function init(_menuIndex: number) {
  router.push({ query: { ...route.query, course: _menuIndex } });

  index.value = 0;
  menuIndex.value = _menuIndex;
  phonemeSeq.value = createWholeSeq(
    courses[_menuIndex],
    store.mode(),
    menuIndex.value,
    props.mode
  );
  summary.value = {
    inputCharNum: 0,
    correctCharNum: 0,
    wrongCharList: {},
    startTime: Date.now(),
  };
}

function onFinish() {
  const { accuracy } = summaryResult.value;
  const pass = accuracy >= passRequire;
  extraInfos.value = pass ? [] : ["失败率过高, 请重新完成课程"];
  const newMenuIndex = pass
    ? (menuIndex.value + 1) % courseNames.length
    : menuIndex.value;
  init(newMenuIndex);
}

function updatePhonemeStatus(
  index: number,
  option: { type: "curt"; key: string } | { type: "next" }
): boolean {
  if (index < 0 || index >= phonemeSeq.value.length) {
    return false;
  }

  const phoneme = phonemeSeq.value[index];
  console.log("opt", option);
  switch (option.type) {
    case "curt": {
      const _key = option.key;
      const key = _key in punctuationMapper ? punctuationMapper[_key] : _key;
      const result = Boolean(key === phoneme.char);
      const status = resultMap[`${option.type}_${Number(result) as 0 | 1}`];
      phoneme.status = status;
      return result;
    }
    case "next": {
      const status = resultMap[option.type];
      phoneme.status = status;
      console.log("stas", status, phoneme);
      return true;
    }
  }
}

function onSeq([key]: [string?, string?]) {
  // TODO: support backspace
  if (!key) return false;

  extraInfos.value = [];
  if (key === "Backspace" || allMenuChangeKeys.includes(key as any)) {
    return false;
  }

  const valid = updateSeq({ key, index: index.value });
  if (valid) {
    summary.value.correctCharNum++;
  } else {
    const prev = summary.value.wrongCharList[key];
    summary.value.wrongCharList[key] = (prev ?? 0) + 1;
  }

  summary.value.inputCharNum++;
  return valid;
}

function updateSeq(option: { key: string; index: number }): boolean {
  updatePhonemeStatus(option.index + 1, { type: "next" });
  const result = updatePhonemeStatus(option.index, {
    type: "curt",
    key: option.key,
  });

  index.value++;
  document.querySelector(".phoneme.activate")?.scrollIntoView({
    inline: "nearest",
    block: "center",
    behavior: "smooth",
  });

  if (index.value >= phonemeSeq.value.length) {
    onFinish();
  }

  return result;
}

function onMenuChange(i: number) {
  if (i === menuIndex.value) return;
  init(i);
}

const hints = computed(() => {
  const key = phonemeSeq.value[index.value].char;
  return [key];
});
</script>

<template>
  <div class="home-page">
    <div class="single-menu">
      <menu-list
        enable-arrow
        :menu-change-keys="currentMenuChangeKeys"
        :items="courseNames"
        :index="menuIndex"
        @menu-change="onMenuChange"
      />
    </div>

    <div class="input-area"></div>

    <div class="phoneme-list">
      <PhonemeComponent
        :phoneme-seq="phonemeSeq"
        :title="courseTitles[menuIndex]"
      />
    </div>

    <div class="single-keyboard">
      <Keyboard
        :valid-seq="onSeq"
        :hints="hints"
        mode="singleKey"
        :key-board-layout="keyboardLayoutWithPunctuation"
      />
    </div>

    <div class="summary">
      <TypeSummary
        hide-avgpress
        :avgpress="0"
        :extra-infos="extraInfos"
        :speed="summaryResult.speed"
        :accuracy="summaryResult.accuracy"
      />
    </div>
  </div>
</template>

<style lang="less">
@import "../styles/color.less";
@import "../styles/var.less";

.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;

  .single-menu {
    position: absolute;
    top: 0;
    left: 100px;
  }

  .input-area {
    margin-bottom: 32px;
    height: 160px;
    display: flex;
    align-items: center;

    @media (max-width: 576px) {
      margin-top: 30vh;
    }
  }

  .summary {
    position: absolute;
    right: var(--app-padding);
    bottom: var(--app-padding);

    @media (max-width: 576px) {
      top: 36px;
    }
  }

  .phoneme-list {
    position: absolute;
    top: var(--app-padding);
    left: 200px;

    @media (max-width: 576px) {
      top: 120px;
    }
  }

  @media (max-width: 576px) {
    .single-keyboard {
      position: absolute;
      bottom: 1em;
    }
  }
}
</style>
