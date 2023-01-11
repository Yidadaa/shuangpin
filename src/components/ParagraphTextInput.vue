<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  ref,
  computed,
  onActivated,
  onDeactivated,
  watchPostEffect,
} from "vue";

import { useStore } from "../store";

const store = useStore();
const paragraphs = storeToRefs(store).currentParagraphs;
const currentParagraph = storeToRefs(store).currentParagraphIndex;

const isFreeMode = storeToRefs(store).isFreeMode;
const currentInput = ref(
  paragraphs.value[currentParagraph.value.paragraphIndex].slice(
    0,
    currentParagraph.value.textIndex
  )
);
let lastInputLength = currentInput.value.length;
const summary = storeToRefs(store).summary;

store.resetSummary();

onActivated(() => {
  let el = document.body;
  if (isFreeMode) {
    el = document.getElementById("free-input")!;
  }

  el && summary.value.addListener(el);
});

onDeactivated(() => {
  let el = document.body;
  if (isFreeMode) {
    el = document.getElementById("free-input")!;
  }

  el && summary.value.removeListener(el);
});

watchPostEffect(() => {
  const expectedText = paragraphs.value[currentParagraph.value.paragraphIndex];
  const inputText = currentInput.value;

  // 计算正确率
  const currentInputLength = inputText.length;
  let isValid = true;
  let validCount = 0;
  for (let i = lastInputLength; i < currentInputLength; i += 1) {
    summary.value.onValid(inputText[i] === expectedText[i]);
    isValid &&= inputText[i] === expectedText[i];
    validCount += Number(isValid);
  }
  lastInputLength = currentInputLength;

  store.updateArticleProgress(validCount);
});

const inputChars = computed(() => {
  const expectedText = paragraphs.value[currentParagraph.value.paragraphIndex];
  const inputText = currentInput.value;

  const longerCount = Math.max(expectedText.length, inputText.length);

  return new Array(longerCount).fill(0).map((_, i) => ({
    text: expectedText[i] ?? "",
    isCursor: i === inputText.length,
    class:
      i === inputText.length
        ? "current-text"
        : i > inputText.length
        ? "bg-text"
        : expectedText[i] === inputText[i]
        ? "done-text"
        : "error-text",
  }));
});
</script>

<template>
  <!-- eslint-disable vue/html-indent -->
  <div class="text-area">
    <div class="scroll-area free-mode" v-if="isFreeMode">
      <p v-for="(p, i) in paragraphs" :key="i">
        <span v-if="i < currentParagraph.paragraphIndex" class="done-text">
          {{ p }}
        </span>
        <span
          class="editing-paragraph"
          v-else-if="i === currentParagraph.paragraphIndex"
        >
          <span>
            <span
              v-for="(char, ti) in inputChars"
              :key="ti"
              :class="char.class"
              :id="char.isCursor ? 'cursor' : ''"
            >
              {{ char.text }}
            </span>
          </span>
          <textarea
            class="done-text editing-input"
            v-model="currentInput"
            id="free-input"
          ></textarea>
        </span>
        <span v-else class="bg-text">{{ p }}</span>
      </p>
    </div>
    <div class="scroll-area" v-else>
      <p v-for="(p, i) in paragraphs" :key="i">
        <span v-if="i < currentParagraph.paragraphIndex" class="done-text">
          {{ p }}
        </span>
        <span v-else-if="i === currentParagraph.paragraphIndex">
          <span
            v-for="(text, ti) in p"
            :key="ti"
            class="bg-text"
            :class="
              ti < currentParagraph.textIndex
                ? 'done-text'
                : ti === currentParagraph.textIndex
                ? 'current-text'
                : ''
            "
            :id="ti === currentParagraph.textIndex ? 'cursor' : ''"
          >
            {{ text }}
          </span>
        </span>
        <span v-else class="bg-text">{{ p }}</span>
      </p>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/var.less";

.text-area {
  position: relative;
  width: 50vw;
  max-width: calc(0.6 * var(--page-max-width));

  @media (max-width: 576px) {
    width: 100vw;
    max-width: calc(100vw - var(--app-padding) * 2);
  }

  &:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: linear-gradient(
      0deg,
      var(--white) 0%,
      transparent 30%,
      transparent 70%,
      var(--white) 100%
    );
    pointer-events: none;
    z-index: 999;
  }

  .scroll-area {
    overflow-y: scroll;
    height: 144px;
    position: relative;
    margin: 8px 0;

    &.free-mode {
      height: 350px;
    }

    @media (max-width: 576px) {
      height: 30vh;
    }

    .bg-text {
      opacity: 0.4;
    }

    .done-text {
      opacity: 1;
    }

    .error-text {
      background-color: @primary-color;
    }

    .current-text {
      text-decoration: underline;
      text-underline-offset: 2px;
      opacity: 0.8;
    }

    p {
      margin: 0.5em 0;
    }

    .editing-paragraph {
      display: block;
      position: relative;

      .editing-bg {
        display: block;
        line-height: 1.5;
      }

      .editing-input {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        background: transparent;
        position: absolute;
        top: 0;
        left: 0;
        font-size: 16px;
        border: 0;
        line-height: 1.5;
        opacity: 0.1;
        color: var(--black);
        outline: 0;
        font-family: inherit;
      }
    }
  }
}
</style>
