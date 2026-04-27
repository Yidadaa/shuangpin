<script setup lang="ts">
import Keyboard from "../components/Keyboard.vue";
import Hanzi from "../components/Hanzi.vue";
import Pinyin from "../components/Pinyin.vue";
import TypeSummary from "../components/TypeSummary.vue";
import MenuList from "../components/MenuList.vue";

import { onActivated, onDeactivated, ref, watchPostEffect } from "vue";
import { useStore } from "../store";
import { computed } from "vue";
import { TypingSummary } from "../utils/summary";
import { followKeys, leadKeys } from "../utils/pinyin";
import { randInt } from "../utils/number";
import { buildPracticePrompt, matchPracticeInput } from "../utils/practice";

export interface SingleModeProps {
  nextChar?: () => string;
  hanziList?: string[];
  onValidInput?: (result: boolean) => void;
  mode?: "Lead" | "Follow";
  scheme?: PracticeScheme;
}

function nextChar() {
  if (!props.mode) {
    return props.nextChar?.() ?? "";
  }
  return props.hanziList?.[randInt(props.hanziList?.length)] ?? "";
}

const pinyin = ref<string[]>([]);

const store = useStore();
const props = defineProps<SingleModeProps>();
const hanziSeq = ref(new Array(4).fill(0).map(() => nextChar()));
const isValid = ref(false);

const summary = ref(new TypingSummary());

const keys = {
  Lead: leadKeys,
  Follow: followKeys,
  "": [] as string[],
}[props.mode ?? ""];

const progresses = computed(() =>
  keys.map((v) => {
    return {
      key: v,
      progress: store.getProgress(v),
    };
  })
);

const listMenuItems = computed(() => {
  return progresses.value.map(
    (v) =>
      `${v.key.toUpperCase()} ${(store.getAccuracy(v.key) * 100).toFixed(2)}%`
  );
});

const menuIndex = computed(() => {
  if (props.mode === "Lead") {
    return store.currentLeadIndex;
  } else if (props.mode === "Follow") {
    return store.currentFollowIndex;
  }
  return -1;
});

function onMenuChange(i: number) {
  if (props.mode === "Lead") {
    store.currentLeadIndex = i;
  } else if (props.mode === "Follow") {
    store.currentFollowIndex = i;
  }
}

watchPostEffect(() => {
  for (let i = 0; i < 4; ++i) {
    hanziSeq.value.unshift(nextChar());
    hanziSeq.value.pop();
  }
});

function onKeyPressed() {
  summary.value.onKeyPressed();
}

onActivated(() => {
  document.addEventListener("keypress", onKeyPressed);
});

onDeactivated(() => {
  document.removeEventListener("keypress", onKeyPressed);
});

const answer = computed(() => {
  return hanziSeq.value.at(-1) ?? "";
});

const scheme = computed(() => props.scheme ?? "shuangpin");
const practiceMode = computed(() => store.practiceMode(scheme.value));

const practicePrompt = computed(() =>
  buildPracticePrompt(answer.value, scheme.value, practiceMode.value)
);

const hints = computed(() => practicePrompt.value.hintKeys);

function onSeq(seq: string[]) {
  const result = matchPracticeInput(
    seq,
    practicePrompt.value,
    practiceMode.value
  );

  if (result.completed) {
    props.onValidInput?.(result.valid);
    summary.value.onValid(result.valid);
  }

  if (result.completed && result.progressKeys) {
    store.updateProgressOnValid(result.progressKeys, result.valid);
  }

  pinyin.value = result.display;
  isValid.value = result.valid;

  return result;
}

watchPostEffect(() => {
  if (isValid.value) {
    setTimeout(() => {
      hanziSeq.value.unshift(nextChar());
      hanziSeq.value.pop();
      pinyin.value = [];
      isValid.value = false;
    }, 100);
  }
});
</script>

<template>
  <div class="home-page">
    <div class="single-menu">
      <menu-list
        :items="listMenuItems"
        :index="menuIndex"
        @menu-change="onMenuChange"
      />
    </div>

    <div class="input-area">
      <Pinyin :chars="pinyin" />
    </div>

    <div class="hanzi-list">
      <Hanzi
        :hanzi-seq="[...hanziSeq]"
        :hint-text="practicePrompt.detailHint"
      />
    </div>

    <div class="single-keyboard">
      <Keyboard
        :valid-seq="onSeq"
        :hints="hints"
        :input-length="practicePrompt.inputLength"
        :mode-config="practiceMode"
      />
    </div>

    <div class="summary">
      <TypeSummary
        :speed="summary.hanziPerMinutes"
        :accuracy="summary.accuracy"
        :avgpress="summary.pressPerHanzi"
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

  .hanzi-list {
    position: absolute;
    top: var(--app-padding);
    right: var(--app-padding);

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
