<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import Hanzi from '../components/Hanzi.vue';
import Pinyin from '../components/Pinyin.vue'
import TypeSummary from '../components/TypeSummary.vue'
import MenuList from '../components/MenuList.vue';

import { onActivated, onDeactivated, onMounted, onUnmounted, ref, watchPostEffect } from 'vue';
import { matchSpToPinyin } from '../utils/keyboard';
import { useStore } from '../store'
import { computed } from 'vue';
import { getPinyinOf } from '../utils/hanzi';
import { TypingSummary } from '../utils/summary'
import { followKeys, leadKeys } from '../utils/pinyin';
import { randInt, randomChoice } from '../utils/number';

export interface SingleModeProps {
  nextChar?: () => string
  hanziList?: string[]
  onValidInput?: (result: boolean) => void
  mode?: "Lead" | "Follow"
}

function nextChar() {
  if (!props.mode) {
    return props.nextChar?.() ?? ''
  }
  return props.hanziList?.[randInt(props.hanziList?.length)] ?? ''
}

const pinyin = ref<string[]>([])

const store = useStore();
const props = defineProps<SingleModeProps>()
const hanziSeq = ref(new Array(4).fill(0).map(() => nextChar()))
const isValid = ref(false)

const summary = ref(new TypingSummary())

const keys = {
  "Lead": leadKeys,
  "Follow": followKeys,
  "": [] as string[]
}[props.mode ?? '']

const progresses = computed(() => keys.map(v => {
  return {
    key: v,
    progress: store.getProgress(v)
  }
}))

const listMenuItems = computed(() => {
  return progresses.value.map(v => `${v.key.toUpperCase()} ${(store.getAccuracy(v.key) * 100).toFixed(2)}%`)
})

const menuIndex = computed(() => {
  if (props.mode === 'Lead') {
    return store.currentLeadIndex
  } else if (props.mode === 'Follow') {
    return store.currentFollowIndex
  }
  return -1;
})

function onMenuChange(i: number) {
  if (props.mode === 'Lead') {
    store.currentLeadIndex = i
  } else if (props.mode === 'Follow') {
    store.currentFollowIndex = i
  }
}

watchPostEffect(() => {
  for (let i = 0; i < 4; ++i) {
    hanziSeq.value.unshift(nextChar())
    hanziSeq.value.pop()
  }
})

function onKeyPressed() {
  summary.value.onKeyPressed()
}

onActivated(() => {
  document.addEventListener('keypress', onKeyPressed)
})

onDeactivated(() => {
  document.removeEventListener('keypress', onKeyPressed)
})

const answer = computed(() => {
  const pys = getPinyinOf(hanziSeq.value.at(-1) ?? '')
  return randomChoice(pys) ?? ''
})

const hints = computed(() => {
  return (store.mode.py2sp.get(answer.value) ?? '').split('')
})

function onSeq([lead, follow]: [string?, string?]) {
  const res = matchSpToPinyin(store.mode, lead as Char, follow as Char, answer.value)

  if (!!lead && !!follow) {
    props.onValidInput?.(res.valid)
    store.updateProgressOnValid(res.lead, res.follow, res.valid)
  }

  const fullInput = !!lead && !!follow;
  if (fullInput) {
    summary.value.onValid(res.valid)
  }

  pinyin.value = [res.lead, res.follow].filter(v => !!v) as string[]

  isValid.value = res.valid

  return res.valid
}

watchPostEffect(() => {
  if (isValid.value) {
    setTimeout(() => {
      hanziSeq.value.unshift(nextChar())
      hanziSeq.value.pop()
      pinyin.value = []
      isValid.value = false
    }, 100)
  }
})

</script>

<template>
  <div class="home-page">
    <div class="single-menu">
      <menu-list :items="listMenuItems" :index="menuIndex" @menu-change="onMenuChange" />
    </div>

    <div class="input-area">
      <Pinyin :chars="pinyin" />
    </div>

    <div class="hanzi-list">
      <Hanzi :hanzi-seq="[...hanziSeq]" />
    </div>

    <Keyboard :valid-seq="onSeq" :hints="hints" />

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

.single-menu {
  position: absolute;
  top: 0;
  left: 7em;
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