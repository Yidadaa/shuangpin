<script setup lang="ts">
import { ref } from 'vue';
import { hanziMap } from '../utils/hanzi';

function getRandomHanziPair() {
  const items = [...hanziMap.h2p.entries()]
  const total = items.length
  const [hanzi, pinyin] = items[Math.ceil(Math.random() * total)]

  return { hanzi, pinyin }
}

const currentItem = ref({
  ...getRandomHanziPair()
})
</script>

<template>
  <div class="displayer">
    <div class="current-outset">
      <div class="current-item">
        <img class="mi-bg" src="../assets/mi-bg.svg" />
        <div class="pinyin">{{ currentItem.pinyin }}</div>
        <div class="hanzi">{{ currentItem.hanzi }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.displayer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  margin-bottom: 30px;

  .current-outset {
    border: 1px solid black;
    padding: 5px;
  }

  .current-item {
    @size: 50px;
    height: @size;
    width: @size;

    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    padding: 10px;
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
