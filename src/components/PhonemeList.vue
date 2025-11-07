<script setup lang="ts">
import type { Phoneme } from "../utils/phoneme";

type Props = {
  phonemeSeq: Phoneme[];
  title?: string;
};
defineProps<Props>();
</script>

<template>
  <div class="phoneme-input-area">
    <div class="title">{{ title }}</div>
    <div class="displayer">
      <span
        v-for="(phoneme, i) in phonemeSeq"
        class="phoneme"
        :class="`${phoneme.status}`"
        :key="i"
      >
        {{ phoneme.displayValue }}
      </span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.title {
  padding-top: calc(0.5em + 2px);
  padding-bottom: 0.5em;

  opacity: 0.4;
  font-size: 14px;
  font-weight: bold;

  &:hover {
    opacity: 1;
  }
}

.displayer {
  max-height: 160px;
  overflow-y: auto;
  margin-right: 32px;
  width: 50vw;

  .phoneme {
    display: inline-block;

    padding-right: 8px;
    font-size: 14px;
    font-weight: bold;

    &.activate {
      opacity: 1;
    }

    &.finished-correct,
    &.finished-wrong,
    &.unfinished {
      opacity: 0.4;
    }

    &.finished-correct {
      color: green;
    }
    &.finished-wrong {
      color: red;
    }
  }
}
</style>
