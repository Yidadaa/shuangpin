<script lang="ts" setup>
import { computed } from 'vue';
import { defineProps } from 'vue'

const props = defineProps<{
  chars: string[]
}>()

</script>

<template>
  <div class="pinyin-input">
    <div v-for="(char, ci) in chars" :key="ci" class="cursor">
      {{ char.toUpperCase() }}
    </div>
    <div v-if="chars.length === 0" class="cursor" />
  </div>
</template>

<style lang="less">
.pinyin-input {
  display: flex;
  font-weight: bold;
  font-size: 5em;

  .cursor {
    position: relative;
    min-height: 1.1em;
    min-width: 0.5em;
    text-align: center;
    line-height: 1;

    &:first-child {
      margin-right: 5px;
    }

    &::after {
      position: absolute;
      bottom: 0px;
      left: 0px;
      content: "";
      width: 100%;
      height: 5px;
      background-color: var(--black);
      margin-top: 5px;
    }

    &:last-child::after {
      animation: alternate infinite .6s blink;
    }
  }


}

@keyframes blink {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>