<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "../store";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["update:isOpen"]);

const toggleSidebar = () => {
  emit("update:isOpen", !props.isOpen);
};

const store = useStore();
const { settings } = storeToRefs(store);

const rangeConfigs = {
  targetSpeed: { name: "目标速度", unit: "WPM", min: 10, max: 120 },
  targetAccuracy: { name: "目标准确率", unit: "%", min: 80, max: 100 },
};
</script>

<template>
  <aside :class="['sidebar', { 'is-open': isOpen }]">
    <button
      class="toggle-btn"
      @click="toggleSidebar"
      :title="isOpen ? '收起' : '展开设置'"
    >
      <div :class="['arrow-icon', { 'is-active': isOpen }]"></div>
    </button>

    <div class="sidebar-inner">
      <h3 class="sidebar-title">训练设置</h3>

      <div class="range-setting-container">
        <div
          v-for="(config, key) in rangeConfigs"
          :key="key"
          class="range-item"
        >
          <div class="range-header">
            <span class="setting-name">{{ config.name }}</span>
            <span class="setting-value"
              >{{ settings[key] }}{{ config.unit }}</span
            >
          </div>
          <input
            type="range"
            class="custom-slider"
            :min="config.min"
            :max="config.max"
            v-model.number="settings[key]"
          />
        </div>
      </div>
    </div>

    <div class="setting-tips">
      <div class="tips-header">
        <span class="tips-title">调节建议</span>
      </div>
      <ul class="tips-list">
        <li>
          <strong>先准后快：</strong> 双拼初期由于键位陌生，速度会比全拼慢，这很正常。切勿盲目加速，错误的肌肉记忆很难纠正。请务必确保<span class="highlight">准确率优先（95%+）</span>，速度自然水到渠成。
        </li>
        <li>
          <strong>速度参考：</strong> 0-40 WPM 新手（键位记忆阶段，需看键盘或思考）， 40-60 WPM 入门（形成肌肉记忆，不再卡顿），60-80 WPM 舒适区（日常基准线，注意力回归内容），80+ WPM 精通（行云流水，人机合一）。
        </li>
      </ul>
    </div>
  </aside>
</template>

<style lang="less" scoped>
@import "../styles/color.less";
@import "../styles/animation.less";

.sidebar:not(.is-open) {
  .toggle-btn {
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
}

.sidebar {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(100%, -50%);
  width: 280px;
  background: var(--white, #fff);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.05);
  border-radius: 20px 0 0 20px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  padding: 32px 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &.is-open {
    transform: translate(0, -50%);
  }

  .toggle-btn {
    position: absolute;
    left: -36px;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 80px;

    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);

    border: 1px solid rgba(0, 0, 0, 0.08);
    border-right: none;
    border-radius: 18px 0 0 18px;

    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: -6px 0 15px rgba(0, 0, 0, 0.05);

    &:hover {
      background: #fff;
      left: -40px;
      width: 40px;
      box-shadow: -8px 0 20px rgba(0, 0, 0, 0.08);

      .arrow-icon {
        border-color: @primary-color;
        transform: translateX(0px) rotate(-45deg) scale(1.1);
      }
    }

    .arrow-icon {
      width: 9px;
      height: 9px;
      border-top: 2.5px solid rgba(0, 0, 0, 0.4);
      border-left: 2.5px solid rgba(0, 0, 0, 0.4);
      transform: translateX(3px) rotate(-45deg);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-active {
        transform: translateX(-1px) rotate(135deg);
      }
    }
  }

  .sidebar-inner {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .sidebar-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--black);
    opacity: 0.9;
    border-left: 4px solid @primary-color;
    padding-left: 12px;
  }

  .range-setting-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .range-item {
    display: flex;
    flex-direction: column;

    .range-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 0.9rem;

      .setting-name {
        color: @primary-color;
      }
      .setting-value {
        color: var(--black);
        opacity: 0.7;
      }
    }
  }

  .custom-slider {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: @primary-color;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  .setting-tips {
    margin-top: 8px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.03); 
    border-radius: 12px;
    border-left: 3px solid @primary-color;

    .tips-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .tips-icon {
        font-size: 1.1rem;
      }

      .tips-title {
        font-size: 0.85rem;
        font-weight: bold;
        color: var(--black);
        opacity: 0.8;
      }
    }

    .tips-list {
      margin: 0;
      padding-left: 18px; 
      list-style-type: disc;

      li {
        font-size: 0.75rem;
        line-height: 1.6;
        color: var(--black);
        opacity: 0.6;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .highlight {
          color: @primary-color;
          font-weight: bold;
        }
      }
    }
  }
}
</style>
