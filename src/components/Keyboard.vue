<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { ref, onActivated, onDeactivated } from 'vue'
import { useStore } from '../store';
import { loadShuangpinConfig, keyboardLayout } from '../utils/keyboard'

const store = useStore();
const settings = storeToRefs(store).settings;

const props = defineProps<{
  hints?: string[]
  validSeq?: (_: [string?, string?]) => boolean
}>()

const pressingKeys = ref(new Set<string>())
const keySeq = ref<string[]>([])

const onPressKey = (e: KeyboardEvent) => pressKey(e.key)
const onReleaseKey = (e: KeyboardEvent) => releaseKey(e.key)

onActivated(() => {
  document.addEventListener('keydown', onPressKey)
  document.addEventListener('keyup', onReleaseKey)
})

onDeactivated(() => {
  document.removeEventListener('keydown', onPressKey)
  document.removeEventListener('keyup', onReleaseKey)
})

function pressKey(key: string) {
  pressingKeys.value.add(key)
}

function send() {
  if (props.validSeq?.([keySeq.value.at(0), keySeq.value.at(1)])) {
    keySeq.value = []
  }
}

function releaseKey(key: string, shouldSend = true) {
  pressingKeys.value.delete(key)

  if (key === 'Backspace') {
    keySeq.value.pop()
    return send()
  }

  if (!shouldSend || !store.mode.groupByKey.has(key as Char)) {
    return
  }

  if (keySeq.value.length <= 2) {
    keySeq.value.push(key)
  }

  if (keySeq.value.length > 2) {
    if (settings.value.enableAutoClear) {
      keySeq.value = [key]
    } else {
      keySeq.value.pop()
    }
  }

  send()
}

const keyLayout = computed(() => {
  const config = loadShuangpinConfig(settings.value.shuangpinMode)

  return keyboardLayout.map(v => v.split('').map(key => {
    const keyConfig = config.groupByKey.get(key as Char) ?? {
      main: key,
      leads: [],
      follows: []
    }
    return {
      main: keyConfig.main,
      lead: mergeString(keyConfig.leads.filter(v => v !== keyConfig.main)),
      follow: mergeString(keyConfig.follows)
    }
  }))
})

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

function keyItemClass(key: string) {
  let classNames = []

  if (pressingKeys.value.has(key)) {
    classNames.push('pressing')
  }

  if (props.hints?.includes(key) && settings.value.enableKeyHint) {
    classNames.push('hint-key')
  }

  return classNames.join(' ')
}
</script>

<template>
  <div class="keyboard">
    <div
      v-for="(line, li) in keyLayout"
      :key="li"
      class="key-row"
    >
      <div
        v-for="(keyItem, ki) in line"
        :key="ki"
        class="key-item"
        :class="keyItemClass(keyItem.main)"
        @mousedown="pressKey(keyItem.main)"
        @touchstart.stop.prevent="pressKey(keyItem.main)"
        @mouseup="releaseKey(keyItem.main)"
        @mouseout="releaseKey(keyItem.main, false)"
        @touchend.stop.prevent="releaseKey(keyItem.main)"
      >
        <div class="main-content">
          <div class="main-key ">
            {{ keyItem.main.toUpperCase() }}
          </div>
          <div
            v-if="keyItem.lead.length > 0"
            class="lead-key"
          >
            {{ keyItem.lead }}
          </div>
        </div>
        <div class="bottom-content">
          <div class="follow-key">
            {{ keyItem.follow }}
          </div>
        </div>
      </div>

      <div
        v-if="li === keyLayout.length - 1"
        class="key-item backspace"
        :class="keyItemClass('Backspace')"
        @mousedown="pressKey('Backspace')"
        @touchstart.stop.prevent="pressKey('Backspace')"
        @mouseup="releaseKey('Backspace')"
        @mouseout="releaseKey('Backspace', false)"
        @touchend.stop.prevent="releaseKey('Backspace')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 48 48"
          fill="none"
        >
          <path
            d="M14 11L4 24L14 37H44V11H14Z"
            fill="none"
            stroke="#333"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M21 19L31 29"
            stroke="#333"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M31 19L21 29"
            stroke="#333"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style lang="less">
@import "../styles/color.less";

.keyboard {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.key-row {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  .key-item {
    margin: 5px;
    background-color: var(--gray-001);
    border-radius: 5px;
    box-shadow: 0 1px 2px var(--gray-010);
    text-align: center;
    padding: 10px;

    height: 45px;
    width: 45px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    backdrop-filter: blur(5px);
    border: 1px solid var(--gray-001);

    &.hint-key {
      border: 1px solid @primary-color;
    }

    &.pressing {
      background-color: var(--gray-010);
    }

    .main-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .main-key {
        font-size: 14px;
        font-weight: bold;
      }

      .lead-key {
        font-size: 12px;
        font-weight: bold;
        color: @primary-color;
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

  .backspace {
    align-items: center;
    justify-content: center;
  }
}
</style>