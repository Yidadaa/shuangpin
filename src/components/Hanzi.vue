<script setup lang="ts">
import { effect, ref } from 'vue';
import { useStore } from '../store';
import { getPinyinOf } from '../utils/hanzi';

const props = defineProps<{
  hanziSeq: string[]
}>()

const pinyin = ref('')
const currentHanzi = ref('')
const settings = useStore().settings

effect(() => {
  currentHanzi.value = props.hanziSeq.pop() ?? ' '
  if (settings.enablePinyinHint) {
    pinyin.value = getPinyinOf(currentHanzi.value)!
  }
})

</script>

<template>
  <div class="displayer">
    <div class="follow-item" v-for="(item, i) in hanziSeq" v-bind:key="item"
      :style="`opacity: ${i / 4};transform: translateX(-${(hanziSeq.length - i + 1) * 120}%);`">
      {{ item }}
    </div>
    <div class="current-outset">
      <div class="current-item">
        <img class="mi-bg" src="../assets/mi-bg.svg" />
        <div class="pinyin">{{ pinyin }}</div>
        <div class="hanzi" :key="currentHanzi">{{ currentHanzi }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@keyframes shift-right {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(100%);
  }
}

.displayer {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .current-outset {
    border: 1px solid black;
    padding: 0.3em;

    @media (prefers-color-scheme: dark) {
      border-color: #aaa;
    }
  }

  .follow-item {
    font-size: 36px;
    font-weight: bold;
    margin-right: 0.8rem;
    position: absolute;
    right: 0;
    transition: all ease .3s;
  }

  .current-item {
    @size: 3em;
    height: @size;
    width: @size;

    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    padding: 0.8em;
    border-radius: 0px;

    .mi-bg {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      opacity: 0.2;

      @media (prefers-color-scheme: dark) {
        filter: invert(1);
      }
    }

    .pinyin {
      font-size: 14px;
      position: absolute;
      top: 2px;
    }

    .hanzi {
      font-size: 36px;
      font-weight: bold;
    }
  }
}
</style>
