<script setup lang="ts">
import {
  ref,
  computed,
  watchPostEffect,
  onActivated,
  onDeactivated,
} from "vue";
import { useStore } from "../store";
import { storeToRefs } from "pinia";

import Keyboard from "../components/Keyboard.vue";
import TypeSummary from "../components/TypeSummary.vue";
import ArticleInfo from "../components/ArticleInfo.vue";

import EditArticlePage from "./EditArticlePage.vue";
import ParagraphTextInput from "../components/ParagraphTextInput.vue";

// TODO: 将这个页面拆分成以下模块：
// 1. 文章进度和文章选择 [v]
// 2. 自由输入模块
// 3. 固定输入模块

const store = useStore();

const isEditing = storeToRefs(store).isEditingArticle;
const pinYinHints = storeToRefs(store).currentPinYinHints;

const { summary, isFreeMode, isValidPinYinInput, currentPinYinInput } =
  storeToRefs(store);

function onArticleSave(newIndex: number) {
  // index.value = newIndex;
  // TODO
}

function scrollToFocus() {
  isFreeMode.value = false;
  const cursor = document.getElementById("cursor");
  if (cursor) {
    cursor.scrollIntoView({
      inline: "nearest",
      block: "center",
      behavior: "smooth",
    });
  }
}

onActivated(() => scrollToFocus());

watchPostEffect(() => {
  scrollToFocus();

  if (isValidPinYinInput.value) {
    setTimeout(() => {
      currentPinYinInput.value = [];
      store.updateArticleProgress();
      isValidPinYinInput.value = false;
    }, 30);
  }
});

const displayAreaClass = computed(() => {
  let retClasses = [];

  if (isEditing.value) {
    retClasses.push("editing");
  }

  if (isFreeMode.value) {
    retClasses.push("free-mode");
  }

  return retClasses.join(" ");
});
</script>

<template>
  <div class="p-mode">
    <div class="display-area" :class="displayAreaClass">
      <ArticleInfo
        :pinyin-input="currentPinYinInput"
        show-pinyin
        :pinyin-answers="pinYinHints"
      />

      <ParagraphTextInput v-if="!isEditing" />

      <EditArticlePage v-if="isEditing" :on-save="onArticleSave" />
    </div>

    <Keyboard
      v-if="!isEditing && !isFreeMode"
      :valid-seq="store.onInputSequence.bind(store)"
      :hints="store.getShuangPinHints()"
    />

    <div v-if="!isEditing" class="summary">
      <TypeSummary
        :speed="summary.hanziPerMinutes"
        :accuracy="summary.accuracy"
        :avgpress="summary.pressPerHanzi"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

.p-mode {
  .display-area {
    padding: 0 64px 32px 32px;

    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 576px) {
      flex-direction: column;
      padding: var(--app-padding);
    }

    &.editing {
      align-items: flex-start;

      @media (max-width: 576px) {
        align-items: center;
      }
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
}
</style>
