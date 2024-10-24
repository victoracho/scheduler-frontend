import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)

app.provide('user', user)
app.provide('deal', deal)
app.provide('deal_name', deal_name)
app.mount('#app')
