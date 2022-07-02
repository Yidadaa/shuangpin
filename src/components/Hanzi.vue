<script setup lang="ts">
import { effect, ref } from 'vue';
import { getPinyinOf } from '../utils/hanzi';

const props = defineProps<{
  hanziList: string[]
}>()

const hanziIndex = ref(0)
const pinyin = ref('')
const follows = ref<string[]>([])

effect(() => {
  pinyin.value = getPinyinOf(props.hanziList[hanziIndex.value]) ?? ''
  follows.value = props.hanziList.slice(hanziIndex.value + 1, hanziIndex.value + 5).reverse()
})

</script>

<template>
  <div class="displayer">
    <div class="follow-item" v-for="(item, i) in follows" :style="`color: rgba(0, 0, 0, ${i / 4})`">{{ item }}</div>
    <div class="current-outset">
      <div class="current-item">
        <img class="mi-bg" src="../assets/mi-bg.svg" />
        <div class="pinyin">{{ pinyin }}</div>
        <div class="hanzi">{{ hanziList[hanziIndex] }}</div>
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

  .current-outset {
    border: 1px solid black;
    padding: 0.3em;
  }

  .follow-item {
    font-size: 36px;
    font-weight: bold;
    margin-right: 0.8rem;
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
