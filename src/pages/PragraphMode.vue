<script setup lang="ts">
import Pinyin from '../components/Pinyin.vue';
import Keyboard from '../components/Keyboard.vue';
import TypeSummary from '../components/TypeSummary.vue';

import { ref, watchPostEffect, onActivated, onDeactivated } from 'vue';
import { useStore } from '../store'
import { storeToRefs } from 'pinia';

import rawArticles from "../utils/article.json";
import { computed } from '@vue/reactivity';
import { getPinyinOf, hanziMap } from '../utils/hanzi';
import { matchSpToPinyin } from '../utils/keyboard';
import { TypingSummary } from '../utils/summary';

const store = useStore()
const articles = storeToRefs(store).articles
const settings = storeToRefs(store).settings

const summary = ref(new TypingSummary())

function onKeyPressed() {
  summary.value.onKeyPressed()
}

onActivated(() => {
  document.addEventListener('keypress', onKeyPressed)
})

onDeactivated(() => {
  document.removeEventListener('keypress', onKeyPressed)
})


if (articles.value.length === 0) {
  articles.value = Object.keys(rawArticles).map(k => {
    const name = k as RawArticleName
    const progress: Progress = {
      currentIndex: 0,
      total: rawArticles[name].length,
      correctTry: 0,
      totalTry: 0
    }

    return { progress, type: name }
  });
}

function loadArticleText(article: Article) {
  if (article.type === 'CUSTOM') {
    const text = localStorage.getItem(article.name) ?? ''

    return {
      text,
      name: article.name,
      progress: article.progress
    }
  }

  return {
    text: rawArticles[article.type] ?? '',
    name: article.type as string,
    progress: article.progress
  }
}

function jumpToNextValidHanzi(index: number, text: string) {
  while (index < text.length && !hanziMap.h2p.has(text[index])) {
    index += 1
  }

  return index
}

const index = ref(0)
const article = computed(() => {
  const info = loadArticleText(articles.value[index.value])

  info.progress.currentIndex = jumpToNextValidHanzi(info.progress.currentIndex, info.text)

  const finishedText = info.text.slice(0, info.progress.currentIndex)
  const currentHanzi = info.text[info.progress.currentIndex] ?? ''
  const pinyin = getPinyinOf(currentHanzi) ?? ''

  return {
    text: info.text.split('\n'),
    finishedText: finishedText.split('\n'),
    currentHanzi,
    answer: pinyin,
    spHints: (store.mode.py2sp.get(pinyin) ?? '').split(''),
    progress: info.progress,
    name: info.name
  }
})

const pinyin = ref<string[]>([])

function onSeq([lead, follow]: [string?, string?]) {
  const res = matchSpToPinyin(store.mode, lead as Char, follow as Char, article.value.answer)
  pinyin.value = [res.lead, res.follow].filter(v => !!v)

  const fullInput = !!lead && !!follow;
  if (fullInput) {
    summary.value.onValid(res.valid)
  }

  return res.valid
}

function scrollToFocus() {
  const cursor = document.getElementById('cursor')
  if (cursor) {
    cursor.scrollIntoView({
      inline: 'center',
      block: 'center',
      behavior: 'smooth'
    })
  }
}

onActivated(() => scrollToFocus())

watchPostEffect(() => {
  scrollToFocus()

  if (pinyin.value.join('') === article.value.answer) {
    setTimeout(() => {
      pinyin.value = []
      if (article.value.progress.currentIndex < article.value.progress.total) {
        article.value.progress.currentIndex += 1
      }
    }, 100);
  }
})
</script>

<template>
  <div class="p-mode">
    <div class="display-area">
      <div class="p-title">
        <div class="pinyin">
          <Pinyin :chars="pinyin" />
        </div>

        <div class="title-info">
          <div class="answer" v-if="settings.enablePinyinHint">{{ article.answer.toUpperCase() }}</div>
          <div class="title-and-count">
            <div class="count">{{ article.progress.currentIndex }} 字 / {{ article.progress.total }} 字</div>
            <div class="title">{{ article.name }}</div>
          </div>
        </div>
      </div>
      <div class="text-area">
        <div class="scroll-area">
          <div class="bg-text">
            <p v-for="(p, i) in article.text">{{ p }}</p>
          </div>
          <div class="done-text">
            <p v-for="(p, i) in article.finishedText">
              {{ p }}<span class="current" id="cursor" v-if="i === article.finishedText.length - 1">{{
                  article.currentHanzi
              }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <Keyboard :valid-seq="onSeq" :hints="article.spHints" />

    <div class="summary">
      <TypeSummary :speed="summary.hanziPerMinutes" :accuracy="summary.accuracy" :avgpress="summary.pressPerHanzi" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../styles/color.less';
@import '../styles/var.less';

.p-mode {
  .display-area {
    padding: 0 4em 2em 2em;

    display: flex;
    align-items: center;
    justify-content: center;

    .p-title {
      margin-right: 2em;
      width: 16em;
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      .pinyin {
        font-size: 12px;
      }

      .title-info {
        display: flex;
        align-items: center;
        margin-top: 0.5em;

        .answer {
          font-size: 1.2em;
          margin-right: 1em;
          font-weight: bold;

          @border: 1px solid black;
          border-top: @border;
          border-bottom: @border;

          @media (prefers-color-scheme: dark) {
            border-color: #aaa;
          }
        }
      }

      .title-and-count {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-weight: bold;
        font-size: 0.8em;

        .title {
          width: 6em;
          text-align: right;
        }
      }
    }

    .text-area {
      position: relative;
      flex: 1;

      &:before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background: linear-gradient(0deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0) 70%, rgba(255, 255, 255, 1) 100%);
        pointer-events: none;
        z-index: 999;
      }

      @media (prefers-color-scheme: dark) {
        &:before {
          background: linear-gradient(0deg, rgba(34, 34, 34, 1) 0%, rgba(34, 34, 34, 0) 30%, rgba(34, 34, 34, 0) 70%, rgba(34, 34, 34, 1) 100%);
        }
      }

      .scroll-area {
        overflow-y: scroll;
        height: 9em;
        position: relative;
        margin: 0.5em 0;

        .done-text {
          position: absolute;
          top: 0;

          .current {
            text-decoration: underline;
            text-underline-offset: 2px;
            opacity: 0.3;
          }
        }

        .bg-text {
          opacity: 0.2;
        }
      }
    }
  }

  .summary {
    position: absolute;
    right: @app-padding;
    bottom: @app-padding;
  }
}
</style>