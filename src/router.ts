import RandomMode from "./pages/RandomMode.vue";
import LeadMode from "./pages/LeadMode.vue";
import FollowMode from "./pages/FollowMode.vue";
import ParagraphMode from "./pages/PragraphMode.vue";
import KeyPositionPracticeMode from "./pages/KeyPositionPracticeMode.vue";
import KeyPositionPracticeModeLead from "./pages/KeyPositionPracticeModeLead.vue";
import Settings from "./pages/Settings.vue";

import { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "随机模式",
    component: RandomMode,
  },
  {
    path: "/lead-mode",
    name: "声母模式",
    component: LeadMode,
  },
  {
    path: "/follow-mode",
    name: "韵母模式",
    component: FollowMode,
  },
  {
    path: "/p-mode",
    name: "长句模式",
    component: ParagraphMode,
  },
  {
    path: "/key-practice-mode",
    name: "韵母练习",
    component: KeyPositionPracticeMode,
  },
  {
    path: "/key-practice-mode-lead",
    name: "声母练习",
    component: KeyPositionPracticeModeLead,
  },
  {
    path: "/settings",
    name: "设置",
    component: Settings,
  },
];
