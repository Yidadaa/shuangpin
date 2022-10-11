<script setup lang="ts">
import { computed, watchPostEffect } from "vue";
import { storeToRefs } from "pinia";
import { ref, onActivated, onDeactivated } from "vue";
import { useStore } from "../store";
import { mapConfigToLayout } from "../utils/keyboard";

const store = useStore();
const settings = storeToRefs(store).settings;

const props = defineProps<{
  hints?: string[];
  validSeq?: (_: [string?, string?]) => boolean;
}>();

const pressingKeys = ref(new Set<string>());
const keySeq = ref<string[]>([]);
const scale = ref(1);

const onPressKey = (e: KeyboardEvent) => pressKey(e.key);
const onReleaseKey = (e: KeyboardEvent) => releaseKey(e.key);

onActivated(() => {
  document.addEventListener("keydown", onPressKey);
  document.addEventListener("keyup", onReleaseKey);
  window.addEventListener("resize", resizeKeyboard);

  resizeKeyboard();
});

onDeactivated(() => {
  document.removeEventListener("keydown", onPressKey);
  document.removeEventListener("keyup", onReleaseKey);
  window.removeEventListener("resize", resizeKeyboard);
});

function resizeKeyboard() {
  const screenWidth = document.getElementById("app")?.clientWidth ?? 920;
  const keyboardWidth = document.getElementById("keyboard")?.clientWidth ?? 920;
  scale.value = screenWidth < 576 ? (screenWidth / keyboardWidth) * 1.1 : 1;
}

function pressKey(key: string) {
  pressingKeys.value.add(key);

  navigator.vibrate(100);
}

function send() {
  if (props.validSeq?.([keySeq.value.at(0), keySeq.value.at(1)])) {
    keySeq.value = [];
  }
}

function releaseKey(key: string, shouldSend = true) {
  pressingKeys.value.delete(key);

  if (key === "Backspace") {
    keySeq.value.pop();
    return send();
  }

  if (!shouldSend || !store.mode().groupByKey.has(key as Char)) {
    return;
  }

  if (keySeq.value.length <= 2) {
    keySeq.value.push(key);
  }

  if (keySeq.value.length > 2) {
    if (settings.value.enableAutoClear) {
      keySeq.value = [key];
    } else {
      keySeq.value.pop();
    }
  }

  send();
}

const keyLayout = computed(() => {
  return mapConfigToLayout(store.mode());
});

function keyItemClass(key: string) {
  let classNames = [];

  if (pressingKeys.value.has(key)) {
    classNames.push("pressing");
  }

  if (props.hints?.includes(key) && settings.value.enableKeyHint) {
    classNames.push("hint-key");
  }

  return classNames.join(" ");
}
</script>

<template>
  <div class="keyboard" :style="`transform: scale(${scale})`" id="keyboard">
    <div v-for="(line, li) in keyLayout" :key="li" class="key-row">
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
          <div class="main-key">
            {{ keyItem.main.toUpperCase() }}
          </div>
          <div v-if="keyItem.lead.length > 0" class="lead-key">
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
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
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
@import "../styles/keyboard.less";
</style>
