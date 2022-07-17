<script lang="ts" setup>
import { ref, defineProps, readonly, computed, onMounted, onUnmounted } from 'vue'

export interface MenuProps {
  onMenuChange?: (i: number) => void
  index?: number
  items: string[]
  defaultShowItem?: boolean
  enableArrow?: boolean
}

const props = defineProps<MenuProps>()

const menuItems = computed(() => props.items)

const currentIndex = ref(props.index ?? 0)
const index = computed(() => props.index ?? currentIndex.value)

function shiftItem(deltaIndex: number) {
  currentIndex.value = props.index ?? currentIndex.value
  currentIndex.value += deltaIndex
  currentIndex.value = Math.max(0, Math.min(menuItems.value.length - 1, currentIndex.value))

  if (deltaIndex !== 0) {
    props.onMenuChange?.(currentIndex.value)
  }
}

function buildItemClass(deltaIndex: number) {
  return deltaIndex === 0 ? 'selected-item' : Math.abs(deltaIndex) === 1 ? 'adj-item' : 'other-item'
}

function onItemWheel(e: WheelEvent) {
  shiftItem(e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0)
}

function arrawChangeMenu(e: KeyboardEvent) {
  if (!props.enableArrow) return
  if (e.key === 'ArrowUp') {
    shiftItem(-1)
  } else if (e.key === 'ArrowDown') {
    shiftItem(1)
  }
}

onMounted(() => {
  document.addEventListener('keydown', arrawChangeMenu)
})

onUnmounted(() => {
  document.removeEventListener('keydown', arrawChangeMenu)
})

</script>

<template>
  <div class="menu">
    <div class="menu-items" :class="props.defaultShowItem && 'show-items'"
      :style="`transform: translateY(${-index * 2}em)`" @wheel.prevent="onItemWheel">
      <div class="menu-item" @click="shiftItem(i - index)" :class="buildItemClass(i - index)"
        v-for="(item, i) in menuItems">{{ item }}</div>
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
    transition: all ease .3s;
    cursor: pointer;
    font-size: 1em;
    padding: 2em 0;

    &:hover {
      .show-items()
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
      transition: all ease .3s;
    }

    .other-item {
      opacity: 0;
      transition: all ease .3s;
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