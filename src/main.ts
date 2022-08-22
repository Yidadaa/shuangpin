import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import persistPlugin from "pinia-plugin-persistedstate";
import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "./router";
import "./utils/polyfill";

const pinia = createPinia();
pinia.use(persistPlugin);

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
});

createApp(App).use(pinia).use(router).mount("#app");
