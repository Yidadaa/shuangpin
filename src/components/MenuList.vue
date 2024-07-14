<script lang="ts" setup>
import { defineProps, onMounted, onUnmounted } from "vue";

export interface MenuProps {
  onMenuChange?: (i: number) => void;
  index: number;
  items: string[];
  defaultShowItem?: boolean;
  enableArrow?: boolean;
  menuChangeKeys?: readonly [up: string, down: string];
}

const props = defineProps<MenuProps>();

function shiftItem(deltaIndex: number) {
  const changedIndex = Math.max(
    0,
    Math.min(props.items.length - 1, props.index + deltaIndex)
  );

  props.onMenuChange?.(changedIndex);
}

function buildItemClass(deltaIndex: number) {
  return deltaIndex === 0
    ? "selected-item"
    : Math.abs(deltaIndex) === 1
    ? "adj-item"
    : "other-item";
}

function onItemWheel(e: WheelEvent) {
  shiftItem(e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0);
}

function arrawChangeMenu(e: KeyboardEvent) {
  if (!props.enableArrow) return;

  const [up, down] = props.menuChangeKeys ?? ["ArrowUp", "ArrowDown"];
  if (e.key === up) {
    shiftItem(-1);
  } else if (e.key === down) {
    shiftItem(1);
  }
}

onMounted(() => {
  document.addEventListener("keydown", arrawChangeMenu);
});

onUnmounted(() => {
  document.removeEventListener("keydown", arrawChangeMenu);
});
</script>

<template>
  <div class="menu">
    <div
      class="menu-items"
      :class="defaultShowItem && 'show-items'"
      :style="`transform: translateY(${-index * 2}em)`"
      @wheel.prevent="onItemWheel"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="menu-item"
        :class="buildItemClass(i - index)"
        @click="shiftItem(i - index)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<style lang="less">
.menu {
  display: flex;
  font-weight: bold;
  user-select: none;
  overflow: hidden;

  .menu-items {
    transition: all ease 0.3s;
    cursor: pointer;
    font-size: 1em;
    padding: 2em 0;

    &:hover {
      .show-items();
    }

    .menu-item {
      padding: 0.5em 1.2em;
      line-height: 1em;
    }

    .menu-item:hover {
      opacity: 0.8;
    }

    .selected-item {
      opacity: 1;
    }

    .adj-item {
      opacity: 0;
      transition: all ease 0.3s;
    }

    .other-item {
      opacity: 0;
      transition: all ease 0.3s;
    }
  }

  .show-items {
    .adj-item {
      opacity: 0.5;
    }

    .other-item {
      opacity: 0.1;
    }
  }
}
</style>
