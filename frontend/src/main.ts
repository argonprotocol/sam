import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createWebHistory, createRouter } from 'vue-router';
import App from './App.vue'
import MainView from './views/MainVue.vue';
import EditView from './views/EditVue.vue';
import './index.css'

const pinia = createPinia()
const app = createApp(App);

const routes = [
  { path: '/', component: MainView },
  { path: '/edit', component: EditView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

app.use(pinia);
app.use(router);
app.mount('#app');
