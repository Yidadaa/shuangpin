<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import Hanzi from '../components/Hanzi.vue';
import Pinyin from '../components/Pinyin.vue'
import TypeSummary from '../components/TypeSummary.vue'
import { onMounted, onUnmounted, ref, watchPostEffect } from 'vue';
import { matchSpToPinyin } from '../utils/keyboard';
import { useStore } from '../store'
import { computed } from '@vue/reactivity';
import { getPinyinOf } from '../utils/hanzi';
import { TypingSummary } from '../utils/summary'

export interface SingleModeProps {
  nextChar: () => string
  onValidInput?: (result: boolean) => void
}

const pinyin = ref<string[]>([])

const store = useStore();
const props = defineProps<SingleModeProps>()
const initSeq = new Array(4).fill(0).map(() => props.nextChar())
const hanziSeq = ref(initSeq)

const summary = ref(new TypingSummary())

onMounted(() => {
  document.addEventListener('keypress', summary.value.onKeyPressed.bind(summary.value))
})

onUnmounted(() => {
  document.removeEventListener('keypress', summary.value.onKeyPressed.bind(summary.value))
})

const answer = computed(() => {
  return getPinyinOf(hanziSeq.value.at(-1) ?? '') ?? ''
})

function onSeq([lead, follow]: [string?, string?]) {
  const res = matchSpToPinyin(store.mode, lead as Char, follow as Char, answer.value)

  props.onValidInput?.(res.valid)

  if (!!lead && !!follow) {
    summary.value.onValid(res.valid)
  }

  console.log(summary.value)

  pinyin.value = [res.lead, res.follow].filter(v => !!v) as string[]

  return res.valid
}

watchPostEffect(() => {
  if (pinyin.value.join('') === answer.value) {
    setTimeout(() => {
      hanziSeq.value.unshift(props.nextChar())
      hanziSeq.value.pop()
      pinyin.value = []
    }, 100)
  }
})

</script>

<template>
  <div class="home-page">
    <div class="input-area">
      <Pinyin :chars="pinyin" />
    </div>

    <div class="hanzi-list">
      <Hanzi :hanzi-seq="[...hanziSeq]" />
    </div>

    <Keyboard :valid-seq="onSeq" />

    <div class="summary">
      <TypeSummary :speed="summary.hanziPerMinutes" :accuracy="summary.accuracy" :avgpress="summary.pressPerHanzi" />
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
  margin-bottom: 2em;
  height: 10em;
  display: flex;
  align-items: center;
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