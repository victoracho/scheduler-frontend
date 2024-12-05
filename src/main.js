import { createApp , provide} from 'vue'
import { pinia } from './store/scheduler';
import App from './App.vue'
const app = createApp(App)

import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

// Use plugin with optional defaults
app.use(VCalendar, {})

app.use(pinia)
app.provide('user', user)
app.provide('crm', crm)
app.provide('deal', deal)
app.provide('deal_name', deal_name)
app.mount('#app')
