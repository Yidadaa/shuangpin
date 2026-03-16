<script setup lang="ts">
import Keyboard from "../components/Keyboard.vue";
import Hanzi from "../components/Hanzi.vue";
import Pinyin from "../components/Pinyin.vue";
import TypeSummary from "../components/TypeSummary.vue";
import MenuList from "../components/MenuList.vue";
import Sidebar from "../components/ProgressiveSidebar.vue";
import {
  onActivated,
  onDeactivated,
  ref,
  watchPostEffect,
  computed,
  watch,
} from "vue";
import { matchSpToPinyin } from "../utils/keyboard";
import { useStore } from "../store";
import { getSinglePinyinOf } from "../utils/hanzi";
import { TypingSummary } from "../utils/summary";
import { followKeys, leadKeys, progressiveKeys } from "../utils/pinyin";
import { randInt } from "../utils/number";

export interface SingleModeProps {
  nextChar?: () => string;
  hanziList?: string[];
  onValidInput?: (result: boolean) => void;
  mode?: "Lead" | "Follow" | "Progressive";
}

function getNextChar() {
  if (props.nextChar) {
    return props.nextChar();
  }

  if (props.mode) {
    return props.hanziList?.[randInt(props.hanziList?.length)] ?? "";
  }

  return "";
}
const pinyin = ref<string[]>([]);

const store = useStore();
const props = defineProps<SingleModeProps>();
const hanziSeq = ref(new Array(4).fill(0).map(() => getNextChar()));
const isValid = ref(false);

const summary = ref(new TypingSummary());

const keys = {
  Lead: leadKeys,
  Follow: followKeys,
  Progressive: progressiveKeys,
  "": [] as string[],
}[props.mode ?? ""];

const progresses = computed(() =>
  keys.map((v) => {
    return {
      key: v,
      progress: store.getProgress(v),
    };
  }),
);

const listMenuItems = computed(() => {
  return progresses.value.map(
    (v) =>
      `${v.key.toUpperCase()} ${(store.getAccuracy(v.key) * 100).toFixed(2)}%`,
  );
});

const menuIndex = computed(() => {
  switch (props.mode) {
    case "Lead":
      return store.currentLeadIndex;
    case "Follow":
      return store.currentFollowIndex;
    case "Progressive":
      return store.currentProgressiveIndex;
    default:
      return -1;
  }
});

function onMenuChange(i: number) {
  if (props.mode === "Lead") {
    store.currentLeadIndex = i;
  } else if (props.mode === "Follow") {
    store.currentFollowIndex = i;
  } else if (props.mode === "Progressive") {
    store.currentProgressiveIndex = i;
  }
}

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
  const pys = getSinglePinyinOf(hanziSeq.value.at(-1) ?? "");
  return pys.at(0) ?? "";
});

const hints = computed(() => {
  return (store.mode().py2sp.get(answer.value) ?? "").split("");
});

function onSeq([lead, follow]: [string?, string?]) {
  const res = matchSpToPinyin(
    store.mode(),
    lead as Char,
    follow as Char,
    answer.value,
  );

  pinyin.value = [res.lead, res.follow].filter((v) => !!v) as string[];

  if (!!lead && !!follow) {
    props.onValidInput?.(res.valid);
    store.updateProgressOnValid(res.lead, res.follow, res.valid);
    summary.value.onValid(res.valid);
    if (res.valid) {
      pinyin.value = [];
    }
  }

  isValid.value = res.valid;
  return res.valid;
}

export interface KeyAccuracy {
  key: string;
  accuracy: number;
}

const emit = defineEmits<{
  (
    e: "stage-complete",
    stats: { accuracy: number; speed: number; count: number },
  ): void;
  (e: "progress-update", data: { key: string; accuracy: number }[]): void;
}>();

const localCount = ref(0);

watchPostEffect(() => {
  if (isValid.value) {
    localCount.value++;

    emit("stage-complete", {
      accuracy: summary.value.slidingAccuracy,
      speed: summary.value.hanziPerMinutes,
      count: localCount.value,
    });
    const accuracyData = progresses.value.map((v) => ({
      key: v.key,
      accuracy: store.getAccuracy(v.key),
    }));
    emit("progress-update", accuracyData);

    setTimeout(() => {
      const newChar = getNextChar();
      hanziSeq.value.unshift(newChar);
      hanziSeq.value.pop();
      isValid.value = false;
    }, 30);
  }
});

watch(
  [() => props.mode, () => menuIndex.value],
  () => {
    refreshPartialSequence();
  },
  { immediate: false },
);

function refreshPartialSequence() {
  const currentChar = hanziSeq.value.at(-1) || getNextChar();
  hanziSeq.value = [getNextChar(), getNextChar(), getNextChar(), currentChar];
  isValid.value = false;
}

defineExpose({
  resetStats: () => {
    localCount.value = 0;
    summary.value = new TypingSummary();
  },
});

const isSidebarOpen = ref(false);
watch(
  () => props.mode,
  (newMode) => {
    if (newMode !== "Progressive") {
      isSidebarOpen.value = false;
    }
  },
);
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
      <Hanzi :hanzi-seq="[...hanziSeq]" />
    </div>

    <div class="single-keyboard">
      <Keyboard :valid-seq="onSeq" :hints="hints" />
    </div>

    <div class="summary">
      <TypeSummary
        :speed="summary.hanziPerMinutes"
        :accuracy="summary.slidingAccuracy"
        :avgpress="summary.pressPerHanzi"
      />
    </div>
    <Sidebar
      v-show="props.mode === 'Progressive'"
      v-model:is-open="isSidebarOpen"
    />
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
    z-index: 10;
  }

  .single-keyboard {
    position: relative;
    z-index: 15;
  }
  .input-area {
    margin-bottom: 32px;
    height: 160px;
    display: flex;
    align-items: center;
    z-index: 5;

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
