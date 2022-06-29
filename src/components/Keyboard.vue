<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pinyinTable, pinyinSummary } from '../utils/pinyin'

const keys = [
  [
    'q/iu', 'w/ei', 'e/e', 'r/uan', 't/ue,ve', 'y/un', 'u/u/sh', 'i/i/ch', 'o/uo', 'p/ie'
  ],
  [
    'a/a', 's/ong,iong', 'd/ai', 'f/en', 'g/eng', 'h/ang', 'j/an', 'k/ing,uai', 'l/iang,uang'
  ],
  [
    'z/ou', 'x/ia,ua', 'c/ao', 'v/ui/zh', 'b/in', 'n/iao', 'm/ian'
  ]
]

console.log(pinyinTable, pinyinSummary)

onMounted(() => {
  document.onkeydown = console.log
})

const keyLayout = ref(keys.map(line => line.map(keyItem => {
  const [main, follow, lead] = keyItem.split('/')
  return {
    main, follow: follow?.split(','), lead
  }
})))

function mergeString([a, b]: string[] = []) {
  if (!(a && b && a.length > 2 && b.length > 2)) {
    return [a, b].join(' ')
  }
  const aChars = a.split('')
  const bChars = b.split('')
  const commonSuffix = []

  while (aChars.length && bChars.length && aChars[aChars.length - 1] === bChars[bChars.length - 1]) {
    commonSuffix.push(aChars.pop())
    bChars.pop()
  }

  const prefixs = [aChars.join(''), bChars.join('')].filter(v => v.length > 0)

  if (commonSuffix.length === 0) {
    return prefixs.join(' ')
  }

  const prefix = prefixs.join('/')
  const suffix = commonSuffix.reverse().join('')

  return `(${prefix})${suffix}`
}
</script>

<template>
  <div class="keyboard">
    <div class="key-row" v-for="(line, li) in keyLayout" key={{li}}>
      <div class="key-item" v-for="(keyItem, ki) in line" key={{ki}}>
        <div class="main-content">
          <div class="main-key">{{ keyItem.main.toUpperCase() }}</div>
          <div class="lead-key" v-if="!!keyItem.lead">{{ keyItem.lead }}</div>
        </div>
        <div class="bottom-content">
          <div class="follow-key">{{ mergeString(keyItem.follow) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.keyboard {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.key-row {
  display: flex;
  align-items: center;
  justify-content: center;

  .key-item {
    margin: 5px;
    background-color: rgba(0, 0, 0, 0.01);
    border-radius: 5px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    text-align: center;
    padding: 10px;

    height: 45px;
    width: 45px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .main-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .main-key {
        font-size: 14px;
        font-weight: bolder;
      }

      .lead-key {
        font-size: 12px;
        font-weight: bolder;
        color: red;
      }
    }

    .bottom-content {
      display: flex;
      justify-content: center;

      .follow-key {
        font-size: 12px;
        margin-right: 3px;
      }
    }
  }
}
</style>