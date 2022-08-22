<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { ref, onActivated, onDeactivated } from "vue";
import { useStore } from "../store";
import {
  loadConfig,
  saveConfig,
  loadShuangpinConfig,
  mapConfigToLayout,
  parseRawConfig,
} from "../utils/keyboard";
import { followMap, leadMap } from "../utils/pinyin";

const store = useStore();
const settings = storeToRefs(store).settings;
const props = defineProps<{
  isEditing?: boolean;
}>();

const keyConfig = computed(() => {
  return loadShuangpinConfig(settings.value.shuangpinMode);
});

const keyLayout = computed(() => {
  return mapConfigToLayout(keyConfig.value);
});

const rawConfig = loadConfig("小鹤双拼"); // 加载默认配置
const editingConfig = ref(rawConfig);
const editingKey = ref("");

const displayLayout = computed(() =>
  props.isEditing
    ? mapConfigToLayout(parseRawConfig(name.value, editingConfig.value))
    : keyLayout.value
);

function pressKey(key: string) {
  if (!props.isEditing) return;
  editingKey.value = key;
}

function closePopup() {
  editingKey.value = "";
}

onActivated(() => {
  window.addEventListener("resize", resizeKeyboard);

  resizeKeyboard();
});

onDeactivated(() => {
  window.removeEventListener("resize", resizeKeyboard);
});

const scale = ref(1);

function resizeKeyboard() {
  const screenWidth = document.getElementById("app")?.clientWidth ?? 920;
  const keyboardWidth = document.getElementById("keyboard")?.clientWidth ?? 920;
  scale.value = screenWidth < 576 ? (screenWidth / keyboardWidth) * 1.1 : 1;
}

const name = ref("");

function onSaveConfig() {
  if (name.value.length === 0) return;
  saveConfig(name.value, editingConfig.value);
  location.reload();
}

function onEditKey(key: string, leads: string[], follows: string[]) {
  // 过滤掉非法字符
  leads = leads.map((v) => v.trim()).filter((v) => leadMap.has(v));
  follows = follows.map((v) => v.trim()).filter((v) => followMap.has(v));
  editingConfig.value.keyMap = editingConfig.value.keyMap.map((v) =>
    v.startsWith(key) ? [key, follows.join(","), leads.join(",")].join("/") : v
  );
}
</script>

<template>
  <div class="keyboard" :style="`transform: scale(${scale})`" id="keyboard">
    <div class="keyboard-name" v-if="props.isEditing">
      <input
        type="text"
        class="keyboard-name-input"
        placeholder="输入自定义名称"
        v-model="name"
      />
      <div
        class="submit-btn"
        :class="name.length > 0 && 'active-btn'"
        @click="onSaveConfig"
      >
        确认
      </div>
    </div>
    <div v-for="(line, li) in displayLayout" :key="li" class="key-row">
      <div
        v-for="(keyItem, ki) in line"
        :key="ki"
        class="key-item"
        @click="pressKey(keyItem.main)"
        @touchstart.stop.prevent="pressKey(keyItem.main)"
      >
        <div
          class="edit-popup"
          v-if="editingKey === keyItem.main && keyItem.main !== ' '"
        >
          <div class="edit-line">
            <div class="edit-label">声母</div>
            <input
              class="edit-input"
              :value="keyItem.leads.join(',')"
              @change="
                e => onEditKey(keyItem.main, (e.target as HTMLInputElement).value.split(','), keyItem.follows)
              "
            />
          </div>
          <div class="edit-line">
            <div class="edit-label">韵母</div>
            <input
              class="edit-input"
              :value="keyItem.follows.join(',')"
              @change="
                e => onEditKey(keyItem.main, keyItem.leads, (e.target as HTMLInputElement).value.split(','))"
            />
          </div>
          <div class="edit-confirm-btn" @click.stop.prevent="closePopup">
            关闭
          </div>
        </div>
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
        v-if="li === displayLayout.length - 1"
        class="key-item backspace"
        @mousedown="pressKey('Backspace')"
        @touchstart.stop.prevent="pressKey('Backspace')"
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
.input {
  background-color: var(--white);
  border: 1px solid var(--gray-010);
  padding: 8px;
  color: var(--black);
  outline: none;
  font-family: inherit;
}

.keyboard {
  position: relative;

  .keyboard-name {
    display: flex;
    align-items: center;
    margin: auto;
    margin-bottom: 10px;
    position: relative;

    .keyboard-name-input {
      .input();
      font-size: 18px;
      line-height: 1.2;
      font-weight: bolder;
    }

    .submit-btn {
      position: absolute;
      right: 10px;
      cursor: pointer;
      color: var(--gray-010);
    }

    .active-btn {
      color: var(--primary-color);
    }
  }
}

.key-item {
  position: relative;
  cursor: pointer;

  &:active {
    background-color: var(--gray-010);
  }

  .edit-popup {
    position: absolute;
    top: -160px;
    left: -80%;

    display: flex;
    flex-direction: column;

    background-color: var(--white);
    padding: 14px;
    border: 1px solid var(--gray-010);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

    font-size: 14px;

    .edit-line {
      display: flex;
      align-items: center;
      margin-bottom: 14px;

      .edit-label {
        margin-right: 8px;
        width: 40px;
        font-weight: bolder;
      }

      .edit-input {
        .input();
        max-width: 60px;
      }
    }

    .edit-confirm-btn {
      cursor: pointer;
      color: var(--primary-color);

      &:hover {
        font-weight: bold;
      }
    }
  }
}
</style>
