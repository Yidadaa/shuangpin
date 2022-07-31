<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { ref, onActivated, onDeactivated } from "vue";
import { useStore } from "../store";
import { loadShuangpinConfig, mapConfigToLayout } from "../utils/keyboard";

const store = useStore();
const settings = storeToRefs(store).settings;
const props = defineProps<{
  isEditing?: boolean;
}>();

const keyLayout = computed(() => {
  const config = loadShuangpinConfig(settings.value.shuangpinMode);
  return mapConfigToLayout(config);
});

const editingKey = ref("");

function pressKey(key: string) {
  if (!props.isEditing) return;
  editingKey.value = key;
}

function closePopup() {
  editingKey.value = "";
}
</script>

<template>
  <div class="keyboard">
    <div class="keyboard-name" v-if="props.isEditing">
      <input type="text" class="keyboard-name-input" value="我的双拼" />
    </div>
    <div v-for="(line, li) in keyLayout" :key="li" class="key-row">
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
            <input class="edit-input" :value="keyItem.leads.join(', ')" />
          </div>
          <div class="edit-line">
            <div class="edit-label">韵母</div>
            <input class="edit-input" :value="keyItem.follows.join(', ')" />
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
        v-if="li === keyLayout.length - 1"
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
  padding: 0.5em;
  color: var(--black);
  outline: none;
  font-family: inherit;
}

.keyboard {
  position: relative;

  .keyboard-name {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 1em;

    .keyboard-name-input {
      .input();
      font-size: 1.2em;
      text-align: center;
      line-height: 1.2;
      font-weight: bolder;
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
    top: -11em;
    left: -80%;

    display: flex;
    flex-direction: column;

    background-color: var(--white);
    padding: 1em;
    border: 1px solid var(--gray-010);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

    font-size: 0.9em;

    .edit-line {
      display: flex;
      align-items: center;
      margin-bottom: 1em;

      .edit-label {
        margin-right: 0.5em;
        width: 3em;
        font-weight: bolder;
      }

      .edit-input {
        .input();
        max-width: 5em;
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
