<script setup lang="ts">
import Pinyin from '../components/Pinyin.vue';
import Keyboard from '../components/Keyboard.vue';
import TypeSummary from '../components/TypeSummary.vue';

import { ref, watchPostEffect, onActivated, onDeactivated, onMounted, watchEffect } from 'vue';
import { useStore } from '../store'
import { storeToRefs } from 'pinia';

import rawArticles from "../utils/article.json";
import { computed } from '@vue/reactivity';
import { getPinyinOf, hanziMap } from '../utils/hanzi';
import { matchSpToPinyin } from '../utils/keyboard';
import { TypingSummary } from '../utils/summary';
import MenuList from '../components/MenuList.vue';

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


onMounted(() => {
  const rawNames = new Set([...Object.keys(rawArticles)])
  articles.value.forEach(v => {
    rawNames.delete(v.type)
  })

  rawNames.forEach(v => {
    const name = v as RawArticleName
    const progress: Progress = {
      currentIndex: 0,
      total: rawArticles[name].length,
      correctTry: 0,
      totalTry: 0
    }

    articles.value.push({ progress, type: name })
  })
})


function loadArticleText(article: Article) {
  if (article.type === 'CUSTOM') {
    const text = localStorage.getItem(article.name) ?? ''

    return {
      type: article.type,
      text,
      name: article.name,
      progress: article.progress
    }
  }

  return {
    type: article.type,
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

const index = storeToRefs(store).currentArticleIndex
const article = computed(() => {
  const info = loadArticleText(articles.value[index.value % articles.value.length])

  info.progress.currentIndex = jumpToNextValidHanzi(info.progress.currentIndex, info.text)

  const finishedText = info.text.slice(0, info.progress.currentIndex)
  const currentHanzi = info.text[info.progress.currentIndex] ?? ''
  const pinyin = getPinyinOf(currentHanzi) ?? ''

  return {
    type: info.type,
    text: info.text.split('\n'),
    finishedText: finishedText.split('\n'),
    currentHanzi,
    answer: pinyin,
    spHints: (store.mode.py2sp.get(pinyin) ?? '').split(''),
    progress: info.progress,
    name: info.name
  }
})

const articleMenuItems = computed(() => {
  return articles.value.map(v => {
    if (v.type === 'CUSTOM') {
      return v.name
    }
    return v.type
  }).map(x => getShortName(x)).concat('新建文章')
})

const isEditing = ref(false)
const editingTitle = ref('')
const editingContent = ref('')
const validInput = computed(() => {
  return editingTitle.value.length > 0 && editingContent.value.length > 0
})

function onAriticleChange(i: number) {
  index.value = i
  isEditing.value = i >= articles.value.length
}

const pinyin = ref<string[]>([])

function onSeq([lead, follow]: [string?, string?]) {
  const res = matchSpToPinyin(store.mode, lead as Char, follow as Char, article.value.answer)
  pinyin.value = [res.lead, res.follow].filter(v => !!v)

  if (!!lead && !!follow) {
    store.updateProgressOnValid(res.lead, res.follow, res.valid)
  }

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
      } else {
        article.value.progress.currentIndex = 0
      }
    }, 100);
  }
})

function getShortName(s: string, n = 10) {
  let ret = s.slice(0, n)
  if (s.length > n) {
    ret = ret.slice(0, n - 2) + '...'
  }

  return ret
}

function saveArticle() {
  if (!validInput) return
  localStorage.setItem(editingTitle.value, editingContent.value)
  isEditing.value = false

  articles.value.push({
    type: 'CUSTOM',
    name: editingTitle.value,
    progress: {
      currentIndex: 0,
      total: editingContent.value.length,
      correctTry: 0,
      totalTry: 0
    }
  })

  editingTitle.value = ''
  editingContent.value = ''
  index.value = articles.value.length - 1
}

function deleteArticle() {
  articles.value.splice(index.value, 1)
  onAriticleChange(index.value)
}

</script>

<template>
  <div class="p-mode">
    <div class="display-area" :class="isEditing && 'editing'">
      <div class="p-title" :class="isEditing && 'editing'">
        <div class="pinyin">
          <Pinyin :chars="pinyin" />
        </div>

        <div class="title-info">
          <div class="answer" v-if="settings.enablePinyinHint">{{ article.answer.toUpperCase() }}</div>
          <div class="title-and-count">
            <div class="count">{{ article.progress.currentIndex }} 字 / {{ article.progress.total }} 字</div>
            <div class="title">{{ getShortName(article.name) }}</div>
          </div>
        </div>

        <div class="article-menu" :title="isEditing ? '' : article.name">
          <MenuList :items="articleMenuItems" :index="index" :on-menu-change="onAriticleChange" />

          <div class="delete-btn" v-if="article.type === 'CUSTOM'" @click="deleteArticle">删除文章</div>
        </div>
      </div>
      <div class="text-area" v-if="!isEditing">
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
      <div class="editing-text-area" v-else>
        <div class="editing-bar">
          <input class="editing-title" placeholder="键入标题" v-model="editingTitle" />
          <div class="save-btn" :class="!validInput && 'disable'" @click="saveArticle">保存文章</div>
        </div>
        <textarea class="editing-text" placeholder="键入范文……" v-model="editingContent"></textarea>
      </div>
    </div>

    <Keyboard :valid-seq="onSeq" :hints="article.spHints" v-if="!isEditing" />

    <div class="summary" v-if="!isEditing">
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

    &.editing {
      align-items: flex-start;
    }

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
          max-width: 10em;
          text-align: right;
        }
      }

      .article-menu {
        display: none;
        height: 7em;
      }
    }

    .p-title:hover,
    .p-title.editing {
      flex-direction: column;

      .pinyin,
      .title-info,
      .title-and-count {
        display: none;
      }

      .article-menu {
        display: flex;
        flex-direction: column;

        .delete-btn {
          color: @primary-color;
          opacity: 0.5;
          font-size: 14px;
          cursor: pointer;
          font-weight: bold;
          transition: all ease .3s;
          margin-top: 1em;
          text-align: center;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .text-area {
      position: relative;
      width: 50vw;
      max-width: 0.6 * @page-max-width;

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
            opacity: 0.8;
          }
        }

        .bg-text {
          opacity: 0.6;
        }
      }
    }

    .editing-text-area {
      display: flex;
      flex-direction: column;
      margin-top: 2.5em;
      width: 50vw;
      max-width: 0.6 * @page-max-width;

      .editing-bar {
        display: flex;
        align-items: center;
        margin-bottom: 1em;

        .editing-title {
          font-family: inherit;
          font-size: 14px;
          font-weight: bold;
          border: 0;
          outline: none;
          padding: 0 0.5em;
          color: @primary-color;
          border-left: 5px solid @primary-color;
          flex: 1;
          background-color: transparent;
        }

        .save-btn {
          color: @primary-color;
          font-size: 14px;
          cursor: pointer;

          &.disable {
            color: #aaa;
          }
        }
      }

      .editing-text {
        font-family: inherit;
        font-size: 14px;
        font-weight: bold;
        border: 0;
        outline: none;
        padding: 0.5em;
        height: 25em;
        resize: none;
        border: 3px double #000;
        background-color: transparent;
        padding-left: calc(0.5em + 1px);

        @media (prefers-color-scheme: dark) {
          border-color: #666;
          color: #999;
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