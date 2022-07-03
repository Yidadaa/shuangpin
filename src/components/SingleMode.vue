<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import Hanzi from '../components/Hanzi.vue';
import Pinyin from '../components/Pinyin.vue'
import TypeSummary from '../components/TypeSummary.vue'

export interface SingleModeProps {
  nextChar: () => string
  onValidInput?: (result: boolean) => void
}

const props = defineProps<SingleModeProps>()

</script>

<template>
  <div class="home-page">
    <div class="input-area">
      <Pinyin />
    </div>

    <div class="hanzi-list">
      <Hanzi :next-hanzi="props.nextChar" />
    </div>

    <Keyboard />

    <div class="summary">
      <TypeSummary :speed="65" :accuracy="Math.random()" :avgpress="Math.random() * 3" />
    </div>

  </div>
</template>

<style lang="less">
@import '../styles/color.less';
@import '../styles/var.less';

.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-area {
  margin-bottom: 4em;
}

.summary {
  position: absolute;
  right: @app-padding;
  bottom: @app-padding;
}

.hanzi-list {
  position: absolute;
  top: @app-padding;
  right: @app-padding;
}
</style>