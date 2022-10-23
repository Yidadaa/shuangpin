<script setup lang="ts">
import { computed } from "vue";
import { ref, onActivated, onDeactivated, watchEffect } from "vue";
import { useStore } from "../store";
import { mapConfigToLayout, ShuangpinConfig } from "../utils/keyboard";
import { followMap, leadMap } from "../utils/pinyin";

const store = useStore();
const props = defineProps<{
  isEditing?: boolean;
  editingName?: string;
}>();

const keyConfig = computed(() => store.mode());
const keyLayout = computed(() => {
  return mapConfigToLayout(keyConfig.value);
});

const rawConfig = computed(() => keyConfig.value.config); // 加载默认配置
const editingRawConfig = ref(rawConfig);
const editingKey = ref("");
const editingConfig = computed(
  () => new ShuangpinConfig(props.editingName ?? "", editingRawConfig.value)
);

const displayLayout = computed(() =>
  props.isEditing ? mapConfigToLayout(editingConfig.value) : keyLayout.value
);

// 编辑零声母
const zeroLayout = computed(() =>
  props.isEditing ? editingConfig.value.zero2sp : keyConfig.value.zero2sp
);
const editingZero = ref("");

function resetEditingZero() {
  editingZero.value = "";
}

function onClickZero(key: string) {
  if (!props.isEditing) return;
  editingZero.value = key;
}

function onZeroChange(key: string, value: string) {
  editingRawConfig.value.zeroMap = editingRawConfig.value.zeroMap.map((v) =>
    v.endsWith(key) ? [value, key].join("/") : v
  );
}

function onZeroKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === "Escape") {
    resetEditingZero();
  }
}

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

const name = ref(props.editingName ?? "");

watchEffect(() => {
  name.value = props.editingName ?? "";
});

function onSaveConfig() {
  if (name.value.length === 0) return;
  store.saveConfig(name.value, editingRawConfig.value);
}

function onEditKey(key: string, leads: string[], follows: string[]) {
  // 过滤掉非法字符
  leads = leads.map((v) => v.trim()).filter((v) => leadMap.has(v));
  follows = follows.map((v) => v.trim()).filter((v) => followMap.has(v));
  editingRawConfig.value.keyMap = editingRawConfig.value.keyMap.map((v) =>
    v.startsWith(key) ? [key, follows.join(","), leads.join(",")].join("/") : v
  );
}
</script>

<template>
  <div class="keyboard" :style="`transform: scale(${scale})`" id="keyboard">
    <Transition name="scale-to-center">
      <div class="keyboard-name" v-if="props.isEditing">
        <input
          type="text"
          class="keyboard-name-input"
          placeholder="请输入自定义名称"
          v-model="name"
          maxlength="8"
        />
        <div
          class="submit-btn"
          :class="name.length > 0 && 'active-btn'"
          @click="onSaveConfig"
        >
          确认
        </div>
      </div>
    </Transition>

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

    <div class="zero-config">
      <div class="zero-item" v-for="[py, sp] in zeroLayout" :key="py">
        <div class="zero-text">{{ py }}</div>
        <input
          type="text"
          class="sp-text"
          v-if="py === editingZero && isEditing"
          :value="sp"
          maxlength="2"
          autofocus
          :key="py"
          @keydown="onZeroKeyDown"
          @input="(e) => onZeroChange(py, (e.target as HTMLInputElement).value)"
          @blur="resetEditingZero"
        />
        <div
          class="sp-text"
          :class="isEditing && 'editing'"
          @click="onClickZero(py)"
          v-else
        >
          {{ sp }}
        </div>
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

.scale-to-center {
  &-enter-active,
  &-leave-active {
    transition: all 0.3s ease;
    opacity: 1;
    max-height: 45px;
  }

  &-leave-to,
  &-enter-from {
    opacity: 0;
    max-height: 0;
  }
}

.keyboard {
  position: relative;

  .keyboard-name {
    display: flex;
    align-items: center;
    margin: auto;
    position: relative;
    height: 40px;
    transform: translateY(-20px);

    .keyboard-name-input {
      color: var(--black);
      background-color: var(--white);
      outline: none;
      font-family: inherit;
      border: 0;
      border-bottom: 2px solid var(--gray-010);
      padding-bottom: 4px;
      font-size: 16px;
      line-height: 1.2;
      font-weight: bolder;

      &::placeholder {
        color: var(--gray-010);
      }

      &:focus {
        border-color: var(--primary-color);
      }
    }

    .submit-btn {
      position: absolute;
      right: 0px;
      bottom: 14px;
      cursor: pointer;
      color: var(--gray-010);
      font-size: 12px;
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

.zero-config {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  @border: 2px double var(--gray-6);

  .zero-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;

    border-top: @border;
    border-bottom: @border;

    .zero-text {
      border-bottom: @border;
      border-width: 1px;
      font-weight: bolder;
    }

    .sp-text {
      font-style: italic;
      background-color: var(--white);
      color: var(--black);

      &.editing {
        cursor: pointer;
      }
    }

    input.sp-text {
      box-sizing: border-box;
      border: none;
      background: var(--primary-color);
      color: var(--white);
      height: 100%;
      font-family: inherit;
      font-size: inherit;
    }

    .zero-text,
    .sp-text {
      width: 50px;
      padding: 3px 0;
      text-align: center;
    }
  }
}
</style>
