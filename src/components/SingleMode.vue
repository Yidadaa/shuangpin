<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import Hanzi from '../components/Hanzi.vue';
import Pinyin from '../components/Pinyin.vue'
import TypeSummary from '../components/TypeSummary.vue'
import { ref, effect, watchPostEffect } from 'vue';
import { getPinyinOfSp } from '../utils/keyboard';
import { useStore } from '../store'
import { computed } from '@vue/reactivity';
import { getPinyinOf } from '../utils/hanzi';

export interface SingleModeProps {
  nextChar: () => string
  onValidInput?: (result: boolean) => void
}

const pinyin = ref<string[]>([])

const store = useStore();
const props = defineProps<SingleModeProps>()
const initSeq = new Array(4).fill(0).map(() => props.nextChar())
const hanziSeq = ref(initSeq)

const answer = computed(() => {
  return getPinyinOf(hanziSeq.value.at(-1) ?? '')
})

function onSeq([lead, follow]: [string?, string?]) {
  const combines = getPinyinOfSp(store.mode, lead as Char, follow as Char)


  console.log(lead, follow)

  // 完全匹配
  const valid = combines.some(([l, f]) => {
    if (l + f === answer.value) {
      lead = l, follow = f;

      return true;
    }
  })

  if (!valid) {
    // 匹配声母的情况
    combines.some(([l, f]) => {
      if (l.length && answer.value?.startsWith(l)) {
        lead = l;

        return true;
      }

      if (f.length && answer.value?.endsWith(f)) {
        follow = f;

        return true;
      }
    })
  }

  console.log(lead, follow)

  props.onValidInput?.(valid)

  pinyin.value = [lead, follow].filter(v => !!v) as string[]

  return valid
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