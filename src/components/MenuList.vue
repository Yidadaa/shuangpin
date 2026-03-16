<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";

export interface MenuProps {
  onMenuChange?: (i: number) => void;
  index: number;
  items: string[];
  defaultShowItem?: boolean;
  enableArrow?: boolean;
}

const props = defineProps<MenuProps>();

function shiftItem(deltaIndex: number) {
  const changedIndex = Math.max(
    0,
    Math.min(props.items.length - 1, props.index + deltaIndex),
  );

  props.onMenuChange?.(changedIndex);
}

function buildItemClass(deltaIndex: number) {
  if (deltaIndex === 0) {
    return "selected-item";
  }
  const isAdjacent = Math.abs(deltaIndex) === 1;
  return isAdjacent ? "adj-item" : "other-item";
}

function onItemWheel(e: WheelEvent) {
  let direction = 0;
  if (e.deltaY > 0) {
    direction = 1;
  } else if (e.deltaY < 0) {
    direction = -1;
  }
  shiftItem(direction);
}

function arrawChangeMenu(e: KeyboardEvent) {
  if (!props.enableArrow) return;
  if (e.key === "ArrowUp") {
    shiftItem(-1);
  } else if (e.key === "ArrowDown") {
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
